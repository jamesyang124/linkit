import { describe, expect, it, vi } from "vitest";

vi.mock("next/cache", () => ({
  unstable_cache: (callback: unknown) => callback
}));

describe("public feed loader", () => {
  it("does not attempt a database connection when DATABASE_URL is missing", async () => {
    const originalDatabaseUrl = process.env.DATABASE_URL;
    delete process.env.DATABASE_URL;

    vi.resetModules();
    const { getPublicFeedItems } = await import("@/feed/load-feed");

    await expect(getPublicFeedItems()).resolves.toEqual([]);

    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
  });
});
