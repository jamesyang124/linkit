import Redis from "ioredis";

import type { LinkitComment } from "@/domain/linkit";
import type { FeedItemsPage } from "@/feed/load-feed";

declare global {
  // eslint-disable-next-line no-var
  var __redisClient: Redis | undefined;
}

function getRedisClient(): Redis | null {
  const url = process.env.REDIS_URL;
  if (!url) return null;

  if (!globalThis.__redisClient) {
    globalThis.__redisClient = new Redis(url, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      lazyConnect: false
    });
    globalThis.__redisClient.on("error", () => {});
  }

  return globalThis.__redisClient;
}

const TOP_LEVEL_TTL = 60;

function topLevelKey(postId: string): string {
  return `thread:toplevel:${postId}`;
}

export async function getCachedTopLevelComments(
  postId: string
): Promise<LinkitComment[] | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(topLevelKey(postId));
    if (!raw) return null;
    return JSON.parse(raw, dateReviver) as LinkitComment[];
  } catch {
    return null;
  }
}

export async function setCachedTopLevelComments(
  postId: string,
  commentsList: LinkitComment[]
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(topLevelKey(postId), JSON.stringify(commentsList), "EX", TOP_LEVEL_TTL);
  } catch {
    // cache write failure is non-fatal
  }
}

export async function invalidateTopLevelComments(postId: string): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.del(topLevelKey(postId));
  } catch {
    // cache invalidation failure is non-fatal
  }
}

// Gallery page cache — keyed by (provider, cursor) so every page the client can
// request is pre-warmed by the background warmer. Only standard page size (30)
// is cached; non-standard limits bypass the cache and hit the DB.
// TTL 65s ensures entries outlive the 60s warm interval.
const GALLERY_PAGE_TTL = 65;

function galleryPageKey(provider: string | null, cursor: string | null): string {
  const p = provider ?? "__global__";
  const c = cursor ?? "__null__";
  return `gallery:v2:page:${p}:${c}`;
}

export async function getCachedGalleryPage(
  provider: string | null,
  cursor: string | null
): Promise<FeedItemsPage | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(galleryPageKey(provider, cursor));
    if (!raw) return null;
    return JSON.parse(raw) as FeedItemsPage;
  } catch {
    return null;
  }
}

export async function setCachedGalleryPage(
  provider: string | null,
  cursor: string | null,
  page: FeedItemsPage
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(
      galleryPageKey(provider, cursor),
      JSON.stringify(page),
      "EX",
      GALLERY_PAGE_TTL
    );
  } catch {
    // cache write failure is non-fatal
  }
}

export async function invalidateGalleryCache(): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    let scanCursor = "0";
    do {
      const [nextCursor, keys] = await client.scan(
        scanCursor,
        "MATCH",
        "gallery:v2:page:*",
        "COUNT",
        100
      );
      scanCursor = nextCursor;
      if (keys.length > 0) await client.del(...keys);
    } while (scanCursor !== "0");
  } catch {
    // non-fatal
  }
}

function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
}
