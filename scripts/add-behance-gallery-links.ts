import { drizzle } from "drizzle-orm/postgres-js";

import { createPostgresClient } from "@/src/db/client";
import { createPostgresLinkitStore } from "@/src/db/linkit-store";
import * as schema from "@/src/db/schema";
import { submitLinkFromForm } from "@/src/server/posts";

type ScrapedProject = {
  link: string;
  title: string;
  description: string | null;
  thumbnailUrl: string;
};

const sourceUrls = [
  "https://www.behance.net/galleries/photography",
  "https://www.behance.net/galleries/photography/landscape-photography",
  "https://www.behance.net/galleries/photography/automotive-photography",
  "https://www.behance.net/galleries/photography/photojournalism",
  "https://www.behance.net/galleries/photography/retouching",
  "https://www.behance.net/search/projects/photography",
  "https://www.behance.net/search/projects/landscape%20photography",
  "https://www.behance.net/search/projects/automotive%20photography"
];
const targetCount = Number(process.env.BEHANCE_TARGET_COUNT ?? 30);
const maxProjectsToInspect = Number(process.env.BEHANCE_MAX_PROJECTS ?? 80);

const seedUser = {
  id: "11111111-1111-4111-8111-111111111111",
  email: "behance-photography-seed@linkit.app",
  name: "Behance Photography Seed",
  image: null
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const projects = await scrapePhotographyProjects();
  if (projects.length < targetCount) {
    throw new Error(`Only found ${projects.length} thumbnail-ready projects; need ${targetCount}.`);
  }

  const client = createPostgresClient(databaseUrl);
  const store = createPostgresLinkitStore(drizzle(client, { schema }));
  let created = 0;
  let skipped = 0;
  let failed = 0;

  try {
    for (const project of projects.slice(0, targetCount)) {
      const formData = new FormData();
      formData.set("link", project.link);

      const result = await submitLinkFromForm(formData, seedUser, {
        store,
        enqueue: async () => {},
        revalidateFeed: () => {},
        metadataProvider: {
          async fetch() {
            return {
              title: project.title,
              description: project.description,
              providerName: "Behance Photography",
              thumbnailUrl: project.thumbnailUrl
            };
          }
        }
      });

      if (result.ok) {
        created += 1;
        console.log(`created ${project.link}`);
      } else if (result.message.includes("already been shared")) {
        skipped += 1;
        console.log(`skipped ${project.link}`);
      } else {
        failed += 1;
        console.error(`failed ${project.link}: ${result.message}`);
      }
    }

    console.log(`Behance photography import complete: ${created} created, ${skipped} skipped, ${failed} failed.`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

async function scrapePhotographyProjects(): Promise<ScrapedProject[]> {
  const projectLinkSet = new Set<string>();
  for (const sourceUrl of sourceUrls) {
    const galleryHtml = await fetchText(sourceUrl);
    for (const link of extractProjectLinks(galleryHtml)) {
      projectLinkSet.add(link);
    }
    if (projectLinkSet.size >= maxProjectsToInspect) {
      break;
    }
  }

  const projectLinks = [...projectLinkSet].slice(0, maxProjectsToInspect);
  const projects: ScrapedProject[] = [];

  for (const link of projectLinks) {
    if (projects.length >= targetCount) {
      break;
    }

    try {
      const project = await scrapeProject(link);
      projects.push(project);
      console.log(`thumbnail-ready ${project.link}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.log(`skip ${link}: ${message}`);
    }
  }

  return projects;
}

async function scrapeProject(link: string): Promise<ScrapedProject> {
  const html = await fetchText(link);
  const title = cleanTitle(
    readMeta(html, "og:title") ??
    readMeta(html, "twitter:title") ??
    readHeading(html) ??
    new URL(link).pathname.split("/").pop() ??
    "Behance Photography"
  );
  const description = cleanText(
    readMeta(html, "og:description") ??
    readMeta(html, "description")
  );
  const candidates = extractImageCandidates(html);

  for (const candidate of candidates) {
    if (await isUsableImage(candidate)) {
      return {
        link,
        title,
        description,
        thumbnailUrl: candidate
      };
    }
  }

  throw new Error("no usable image thumbnail found");
}

function extractProjectLinks(html: string): string[] {
  const decoded = decodeHtml(html).replaceAll("\\/", "/");
  const links = new Set<string>();
  const patterns = [
    /https:\/\/www\.behance\.net\/gallery\/\d+\/[A-Za-z0-9._~!$&'()*+,;=:@%-]+/g,
    /href=["'](\/gallery\/\d+\/[^"']+)["']/g
  ];

  for (const pattern of patterns) {
    for (const match of decoded.matchAll(pattern)) {
      const raw = match[1] ?? match[0];
      const absolute = raw.startsWith("http")
        ? raw
        : `https://www.behance.net${raw}`;
      links.add(stripQuery(absolute));
    }
  }

  return [...links];
}

function extractImageCandidates(html: string): string[] {
  const decoded = decodeHtml(html)
    .replaceAll("\\/", "/")
    .replaceAll("\\u002F", "/");
  const candidates = new Set<string>();
  const metaImage = readMeta(decoded, "og:image") ?? readMeta(decoded, "twitter:image");
  if (metaImage) {
    candidates.add(metaImage);
  }

  const imagePattern = /https:\/\/[^"'\s<>]+(?:\.jpg|\.jpeg|\.png|\.webp)(?:\?[^"'\s<>]+)?/gi;
  for (const match of decoded.matchAll(imagePattern)) {
    const imageUrl = match[0];
    if (
      imageUrl.includes("behance.net") ||
      imageUrl.includes("adobe.com") ||
      imageUrl.includes("scene7.com")
    ) {
      candidates.add(imageUrl);
    }
  }

  return [...candidates]
    .map((url) => url.replaceAll("&amp;", "&"))
    .filter((url) => !url.includes("profile") && !url.includes("avatar"));
}

async function isUsableImage(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      headers: requestHeaders(),
      signal: AbortSignal.timeout(12_000)
    });
    if (!response.ok) {
      return false;
    }

    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) {
      return false;
    }

    const blob = await response.blob();
    return blob.size > 1024;
  } catch {
    return false;
  }
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    headers: requestHeaders(),
    signal: AbortSignal.timeout(15_000)
  });
  if (!response.ok) {
    throw new Error(`fetch failed ${response.status}`);
  }
  return response.text();
}

function requestHeaders(): HeadersInit {
  return {
    accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
    "accept-language": "en-US,en;q=0.9",
    "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"
  };
}

function readMeta(html: string, property: string): string | null {
  const tagPattern = new RegExp(
    `<meta\\s[^>]*(?:property|name)=["']${escapeRegExp(property)}["'][^>]*>`,
    "i"
  );
  const tag = tagPattern.exec(html)?.[0];
  if (!tag) return null;
  const contentMatch = /content=["']([^"']+)["']/i.exec(tag);
  return cleanText(contentMatch?.[1] ?? null);
}

function readHeading(html: string): string | null {
  return cleanText(/<h1[^>]*>(.*?)<\/h1>/is.exec(html)?.[1] ?? null);
}

function cleanTitle(value: string): string {
  return cleanText(value.replace(/\s*::\s*Behance\s*$/i, "")) ?? "Behance Photography";
}

function cleanText(value: string | null): string | null {
  if (!value) {
    return null;
  }
  return decodeHtml(value)
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim() || null;
}

function decodeHtml(value: string): string {
  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&apos;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">");
}

function stripQuery(url: string): string {
  const parsed = new URL(url);
  parsed.search = "";
  parsed.hash = "";
  return decodeURI(parsed.toString());
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
