import Redis from "ioredis";

import type { LinkitComment } from "@/domain/linkit";

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

function dateReviver(_key: string, value: unknown): unknown {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return new Date(value);
  }
  return value;
}
