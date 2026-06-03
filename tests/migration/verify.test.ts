import { describe, expect, it } from "vitest";

import {
  verifyMigration,
  type LegacySnapshot,
  type TargetSnapshot
} from "@/migration/verify";

const legacy: LegacySnapshot = {
  users: [{ id: 1, email: "ada@example.com" }],
  posts: [
    {
      id: 10,
      link: "https://example.com/story",
      comments_count: 1,
      click_count: 3
    }
  ],
  comments: [
    {
      id: 100,
      commentable_id: 10,
      user_id: 1
    }
  ]
};

const target: TargetSnapshot = {
  users: [{ legacyId: 1, email: "ada@example.com" }],
  posts: [
    {
      legacyId: 10,
      link: "https://example.com/story",
      commentsCount: 1,
      clickCount: 3
    }
  ],
  comments: [
    {
      legacyId: 100,
      postLegacyId: 10,
      userLegacyId: 1
    }
  ]
};

describe("migration verifier", () => {
  it("passes when migrated rows, ids, links, counters, and relationships match", () => {
    const result = verifyMigration(legacy, target);

    expect(result.ok).toBe(true);
    expect(result.checks.every((check) => check.ok)).toBe(true);
  });

  it("reports mismatches with check-level detail", () => {
    const result = verifyMigration(legacy, {
      ...target,
      posts: [
        {
          ...target.posts[0],
          commentsCount: 0
        }
      ]
    });

    expect(result.ok).toBe(false);
    expect(result.checks).toContainEqual({
      name: "post counters",
      ok: false,
      message: "counter mismatch for legacy posts: 10"
    });
  });
});
