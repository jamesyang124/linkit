export type LinkMetadata = {
  title: string;
  description: string | null;
  providerName: string;
  thumbnailUrl: string | null;
};

export type LinkMetadataProvider = {
  fetch(link: string): Promise<LinkMetadata>;
};

export function createOpenGraphMetadataProvider(
  fetchImpl: typeof fetch = fetch
): LinkMetadataProvider {
  return {
    async fetch(link) {
      const response = await fetchImpl(link, {
        headers: {
          "user-agent": "Linkit metadata worker"
        }
      });
      const html = await response.text();

      return {
        title:
          readMeta(html, "og:title") ??
          readTitle(html) ??
          new URL(link).hostname,
        description: readMeta(html, "og:description") ?? null,
        providerName:
          readMeta(html, "og:site_name") ?? new URL(link).hostname,
        thumbnailUrl: readMeta(html, "og:image") ?? null
      };
    }
  };
}

function readMeta(html: string, property: string): string | null {
  // Find the <meta> tag with matching property/name, regardless of attribute order
  const tagPattern = new RegExp(
    `<meta\\s[^>]*(?:property|name)=["']${escapeRegExp(property)}["'][^>]*>`,
    "i"
  );
  const tag = tagPattern.exec(html)?.[0];
  if (!tag) return null;
  const contentMatch = /content=["']([^"']+)["']/i.exec(tag);
  return decodeHtml(contentMatch?.[1] ?? null);
}

function readTitle(html: string): string | null {
  const match = /<title[^>]*>([^<]+)<\/title>/i.exec(html);
  return decodeHtml(match?.[1] ?? null);
}

function decodeHtml(value: string | null): string | null {
  if (!value) {
    return null;
  }

  return value
    .replaceAll("&amp;", "&")
    .replaceAll("&quot;", "\"")
    .replaceAll("&#39;", "'")
    .replaceAll("&lt;", "<")
    .replaceAll("&gt;", ">")
    .trim();
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
