import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedItemsPage } from "@/feed/load-feed";

// Minimal Redis mock — only the methods the gallery cache uses.
function makeRedisMock() {
  return {
    get: vi.fn<[string], Promise<string | null>>(),
    set: vi.fn<[string, string, "EX", number], Promise<"OK">>(),
    del: vi.fn<string[], Promise<number>>(),
    scan: vi.fn<[string, "MATCH", string, "COUNT", number], Promise<[string, string[]]>>()
  };
}

type RedisMock = ReturnType<typeof makeRedisMock>;

const page: FeedItemsPage = {
  items: [
    {
      id: "p1",
      title: "Test Post",
      thumbnailUrl: "https://example.com/thumb.jpg",
      profileThumbnailUrl: null,
      providerName: "GitHub",
      tags: [],
      commentsCount: 0,
      clickCount: 3,
      href: "/r/p1",
      comments: []
    }
  ],
  nextCursor: null
};

describe("gallery Redis cache", () => {
  let mock: RedisMock;
  let originalRedisUrl: string | undefined;
  let originalClient: unknown;

  beforeEach(() => {
    mock = makeRedisMock();
    originalRedisUrl = process.env.REDIS_URL;
    originalClient = (globalThis as Record<string, unknown>).__redisClient;

    // Inject mock client and set REDIS_URL so getRedisClient() returns our mock.
    process.env.REDIS_URL = "redis://localhost:6379";
    (globalThis as Record<string, unknown>).__redisClient = mock;
  });

  afterEach(async () => {
    if (originalRedisUrl === undefined) {
      delete process.env.REDIS_URL;
    } else {
      process.env.REDIS_URL = originalRedisUrl;
    }
    (globalThis as Record<string, unknown>).__redisClient = originalClient;
    vi.resetModules();
  });

  describe("getCachedGalleryPage", () => {
    it("returns null when REDIS_URL is not set", async () => {
      delete process.env.REDIS_URL;
      (globalThis as Record<string, unknown>).__redisClient = undefined;
      vi.resetModules();
      const { getCachedGalleryPage } = await import("@/server/redis");
      expect(await getCachedGalleryPage(null, null)).toBeNull();
    });

    it("returns null on cache miss", async () => {
      mock.get.mockResolvedValue(null);
      const { getCachedGalleryPage } = await import("@/server/redis");
      expect(await getCachedGalleryPage(null, null)).toBeNull();
      expect(mock.get).toHaveBeenCalledWith("gallery:v2:page:__global__:__null__");
    });

    it("returns parsed page on cache hit — global, no cursor", async () => {
      mock.get.mockResolvedValue(JSON.stringify(page));
      const { getCachedGalleryPage } = await import("@/server/redis");
      const result = await getCachedGalleryPage(null, null);
      expect(result).toEqual(page);
      expect(mock.get).toHaveBeenCalledWith("gallery:v2:page:__global__:__null__");
    });

    it("returns parsed page on cache hit — named provider with cursor", async () => {
      const cursor = "eyJwcm92aWRlck5hbWUiOiJHaXRIdWIifQ";
      mock.get.mockResolvedValue(JSON.stringify(page));
      const { getCachedGalleryPage } = await import("@/server/redis");
      const result = await getCachedGalleryPage("GitHub", cursor);
      expect(result).toEqual(page);
      expect(mock.get).toHaveBeenCalledWith(`gallery:v2:page:GitHub:${cursor}`);
    });

    it("returns null when get() throws — non-fatal", async () => {
      mock.get.mockRejectedValue(new Error("connection reset"));
      const { getCachedGalleryPage } = await import("@/server/redis");
      expect(await getCachedGalleryPage(null, null)).toBeNull();
    });

    it("returns null when cached JSON is invalid — non-fatal", async () => {
      mock.get.mockResolvedValue("not valid json {");
      const { getCachedGalleryPage } = await import("@/server/redis");
      expect(await getCachedGalleryPage(null, null)).toBeNull();
    });
  });

  describe("setCachedGalleryPage", () => {
    it("stores the page with 65s TTL", async () => {
      mock.set.mockResolvedValue("OK");
      const { setCachedGalleryPage } = await import("@/server/redis");
      await setCachedGalleryPage(null, null, page);
      expect(mock.set).toHaveBeenCalledWith(
        "gallery:v2:page:__global__:__null__",
        JSON.stringify(page),
        "EX",
        65
      );
    });

    it("uses correct key for named provider + cursor", async () => {
      const cursor = "abc123";
      mock.set.mockResolvedValue("OK");
      const { setCachedGalleryPage } = await import("@/server/redis");
      await setCachedGalleryPage("Pinterest", cursor, page);
      expect(mock.set).toHaveBeenCalledWith(
        `gallery:v2:page:Pinterest:${cursor}`,
        JSON.stringify(page),
        "EX",
        65
      );
    });

    it("does not throw when set() fails — non-fatal", async () => {
      mock.set.mockRejectedValue(new Error("READONLY You can't write against a read only replica"));
      const { setCachedGalleryPage } = await import("@/server/redis");
      await expect(setCachedGalleryPage(null, null, page)).resolves.toBeUndefined();
    });

    it("no-op when REDIS_URL is not set", async () => {
      delete process.env.REDIS_URL;
      (globalThis as Record<string, unknown>).__redisClient = undefined;
      vi.resetModules();
      const { setCachedGalleryPage } = await import("@/server/redis");
      await expect(setCachedGalleryPage(null, null, page)).resolves.toBeUndefined();
    });
  });

  describe("invalidateGalleryCache", () => {
    it("deletes all gallery:v2:page:* keys via SCAN loop", async () => {
      // First SCAN returns cursor "42" with two keys, second returns "0" with one key.
      mock.scan
        .mockResolvedValueOnce(["42", ["gallery:v2:page:__global__:__null__", "gallery:v2:page:GitHub:__null__"]])
        .mockResolvedValueOnce(["0", ["gallery:v2:page:Pinterest:__null__"]]);
      mock.del.mockResolvedValue(2);

      const { invalidateGalleryCache } = await import("@/server/redis");
      await invalidateGalleryCache();

      expect(mock.scan).toHaveBeenCalledTimes(2);
      expect(mock.scan).toHaveBeenCalledWith("0", "MATCH", "gallery:v2:page:*", "COUNT", 100);
      expect(mock.del).toHaveBeenCalledTimes(2);
      expect(mock.del).toHaveBeenCalledWith(
        "gallery:v2:page:__global__:__null__",
        "gallery:v2:page:GitHub:__null__"
      );
      expect(mock.del).toHaveBeenCalledWith("gallery:v2:page:Pinterest:__null__");
    });

    it("skips DEL when SCAN returns empty batch", async () => {
      mock.scan.mockResolvedValueOnce(["0", []]);
      const { invalidateGalleryCache } = await import("@/server/redis");
      await invalidateGalleryCache();
      expect(mock.del).not.toHaveBeenCalled();
    });

    it("does not throw when scan() fails — non-fatal", async () => {
      mock.scan.mockRejectedValue(new Error("NOSCRIPT"));
      const { invalidateGalleryCache } = await import("@/server/redis");
      await expect(invalidateGalleryCache()).resolves.toBeUndefined();
    });

    it("no-op when REDIS_URL is not set", async () => {
      delete process.env.REDIS_URL;
      (globalThis as Record<string, unknown>).__redisClient = undefined;
      vi.resetModules();
      const { invalidateGalleryCache } = await import("@/server/redis");
      await expect(invalidateGalleryCache()).resolves.toBeUndefined();
      expect(mock.scan).not.toHaveBeenCalled();
    });
  });
});
