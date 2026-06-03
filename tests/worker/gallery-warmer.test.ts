import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { FeedItemsPage } from "@/feed/load-feed";

// Helpers -----------------------------------------------------------------------

function page(id: string, nextCursor: string | null): FeedItemsPage {
  return {
    items: [
      {
        id,
        title: `Post ${id}`,
        thumbnailUrl: `https://example.com/${id}.jpg`,
        profileThumbnailUrl: null,
        providerName: "GitHub",
        tags: [],
        commentsCount: 0,
        clickCount: 1,
        href: `/r/${id}`,
        comments: []
      }
    ],
    nextCursor
  };
}

// Tests -------------------------------------------------------------------------

describe("warmFeedPages", () => {
  let cachedPages: Array<{ provider: string | null; cursor: string | null; page: FeedItemsPage }>;

  beforeEach(() => {
    cachedPages = [];
    vi.doMock("@/server/redis", () => ({
      setCachedGalleryPage: async (
        provider: string | null,
        cursor: string | null,
        p: FeedItemsPage
      ) => cachedPages.push({ provider, cursor, page: p })
    }));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("stores a single-page feed and stops", async () => {
    const { warmFeedPages } = await import("@/worker/gallery-warmer");
    const singlePage = page("p1", null);
    await warmFeedPages(async () => singlePage, "GitHub");

    expect(cachedPages).toHaveLength(1);
    expect(cachedPages[0]).toMatchObject({ provider: "GitHub", cursor: null, page: singlePage });
  });

  it("walks a two-page chain, storing page 1 under null cursor and page 2 under page-1's nextCursor", async () => {
    const { warmFeedPages } = await import("@/worker/gallery-warmer");
    const pageA = page("p1", "cursor-abc");
    const pageB = page("p2", null);
    const fetchPage = vi.fn(async (cursor: string | null) => {
      if (cursor === null) return pageA;
      if (cursor === "cursor-abc") return pageB;
      throw new Error(`unexpected cursor: ${cursor}`);
    });

    await warmFeedPages(fetchPage, null);

    expect(fetchPage).toHaveBeenCalledTimes(2);
    expect(fetchPage).toHaveBeenNthCalledWith(1, null);
    expect(fetchPage).toHaveBeenNthCalledWith(2, "cursor-abc");

    expect(cachedPages).toHaveLength(2);
    expect(cachedPages[0]).toMatchObject({ provider: null, cursor: null, page: pageA });
    expect(cachedPages[1]).toMatchObject({ provider: null, cursor: "cursor-abc", page: pageB });
  });

  it("walks a three-page chain to completion", async () => {
    const { warmFeedPages } = await import("@/worker/gallery-warmer");
    const pages = new Map([
      [null, page("p1", "c1")],
      ["c1", page("p2", "c2")],
      ["c2", page("p3", null)]
    ]);

    await warmFeedPages(async (cursor) => pages.get(cursor as never)!, "Pinterest");

    expect(cachedPages).toHaveLength(3);
    expect(cachedPages.map((c) => c.cursor)).toEqual([null, "c1", "c2"]);
    expect(cachedPages.every((c) => c.provider === "Pinterest")).toBe(true);
  });
});

describe("warmGalleryCache", () => {
  let cachedPages: Array<{ provider: string | null; cursor: string | null }>;

  beforeEach(() => {
    cachedPages = [];
    vi.doMock("@/server/redis", () => ({
      setCachedGalleryPage: async (
        provider: string | null,
        cursor: string | null
      ) => cachedPages.push({ provider, cursor })
    }));
  });

  afterEach(() => {
    vi.resetModules();
  });

  it("warms global feed + all provider feeds in parallel", async () => {
    const globalPage = page("g1", null);
    const ghPage = page("gh1", null);
    const pinPage = page("pin1", null);

    vi.doMock("@/feed/load-feed", () => ({
      defaultGalleryPageSize: 30,
      getGalleryFeedPageFromStore: vi.fn().mockResolvedValue(globalPage),
      getProviderFeedPageFromStore: vi.fn(async (_store: unknown, providerName: string) => {
        if (providerName === "GitHub") return ghPage;
        if (providerName === "Pinterest") return pinPage;
        throw new Error(`unexpected provider: ${providerName}`);
      })
    }));

    const { warmGalleryCache } = await import("@/worker/gallery-warmer");
    const store = {
      listProviders: async () => [
        { providerName: "GitHub", count: 5 },
        { providerName: "Pinterest", count: 3 }
      ]
    };

    await warmGalleryCache(store as never);

    const providers = cachedPages.map((c) => c.provider);
    expect(providers).toContain(null);       // global
    expect(providers).toContain("GitHub");
    expect(providers).toContain("Pinterest");
    expect(cachedPages).toHaveLength(3);
  });

  it("handles zero providers — only warms global feed", async () => {
    const globalPage = page("g1", null);

    vi.doMock("@/feed/load-feed", () => ({
      defaultGalleryPageSize: 30,
      getGalleryFeedPageFromStore: vi.fn().mockResolvedValue(globalPage),
      getProviderFeedPageFromStore: vi.fn()
    }));

    const { warmGalleryCache } = await import("@/worker/gallery-warmer");
    const store = { listProviders: async () => [] };
    await warmGalleryCache(store as never);

    expect(cachedPages).toHaveLength(1);
    expect(cachedPages[0]).toMatchObject({ provider: null, cursor: null });
  });

  it("single provider with two pages — warms both pages", async () => {
    const p1 = page("p1", "cursor-x");
    const p2 = page("p2", null);

    vi.doMock("@/feed/load-feed", () => ({
      defaultGalleryPageSize: 30,
      getGalleryFeedPageFromStore: vi.fn().mockResolvedValue(page("g1", null)),
      getProviderFeedPageFromStore: vi.fn(async (_store: unknown, _provider: string, { cursor }: { cursor: string | null }) => {
        if (cursor === null) return p1;
        if (cursor === "cursor-x") return p2;
        throw new Error("unexpected cursor");
      })
    }));

    const { warmGalleryCache } = await import("@/worker/gallery-warmer");
    const store = { listProviders: async () => [{ providerName: "GitHub", count: 2 }] };
    await warmGalleryCache(store as never);

    const githubPages = cachedPages.filter((c) => c.provider === "GitHub");
    expect(githubPages).toHaveLength(2);
    expect(githubPages[0]?.cursor).toBeNull();
    expect(githubPages[1]?.cursor).toBe("cursor-x");
  });
});
