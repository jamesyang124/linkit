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

// Gallery first-page cache (cursor=null requests only)
// TTL is 65s so the background warmer (60s interval) always refreshes before expiry.
const GALLERY_FIRST_PAGE_TTL = 65;

function galleryFirstPageKey(provider: string | null): string {
  return `gallery:v1:first:${provider ?? "__global__"}`;
}

export async function getCachedGalleryFirstPage(
  provider: string | null
): Promise<FeedItemsPage | null> {
  const client = getRedisClient();
  if (!client) return null;

  try {
    const raw = await client.get(galleryFirstPageKey(provider));
    if (!raw) return null;
    return JSON.parse(raw) as FeedItemsPage;
  } catch {
    return null;
  }
}

export async function setCachedGalleryFirstPage(
  provider: string | null,
  page: FeedItemsPage
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    await client.set(
      galleryFirstPageKey(provider),
      JSON.stringify(page),
      "EX",
      GALLERY_FIRST_PAGE_TTL
    );
  } catch {
    // cache write failure is non-fatal
  }
}

export async function invalidateGalleryFirstPages(
  providers: string[]
): Promise<void> {
  const client = getRedisClient();
  if (!client) return;

  try {
    const keys = [galleryFirstPageKey(null), ...providers.map(galleryFirstPageKey)];
    await client.del(...keys);
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
