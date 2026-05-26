import { describe, expect, it } from "vitest";

import { toFeedItems, toCommentCard } from "@/src/feed/view-model";
import type { LinkitComment, LinkitPost } from "@/src/domain/linkit";

function makeComment(overrides: Partial<LinkitComment> = {}): LinkitComment {
  return {
    id: "comment-1",
    legacyId: null,
    postId: "post-1",
    body: "Worth reading.",
    parentId: null,
    replyToUserName: null,
    replyCount: 0,
    user: {
      id: "user-1",
      email: "ada@example.com",
      name: "Ada Lovelace",
      imageUrl: null
    },
    createdAt: new Date("2026-05-24T08:00:00.000Z"),
    updatedAt: new Date("2026-05-24T08:00:00.000Z"),
    ...overrides
  };
}

describe("feed view model", () => {
  it("adapts domain posts to feed cards", () => {
    const now = new Date("2026-05-24T08:00:00.000Z");
    const posts: LinkitPost[] = [
      {
        id: "post-1",
        legacyId: 1,
        title: "A fast feed can still feel composed",
        body: null,
        link: "https://example.com/story",
        thumbnailUrl: "https://cdn.example.com/story.jpg",
        profileThumbnailUrl: null,
        providerName: "Design Notes",
        clickCount: 11,
        commentsCount: 2,
        user: {
          id: "user-1",
          email: "ada@example.com",
          name: "Ada Lovelace",
          imageUrl: null
        },
        createdAt: now,
        updatedAt: now
      }
    ];

    expect(toFeedItems(posts)).toEqual([
      {
        id: "post-1",
        title: "A fast feed can still feel composed",
        thumbnailUrl: "https://cdn.example.com/story.jpg",
        profileThumbnailUrl: null,
        providerName: "Design Notes",
        commentsCount: 2,
        clickCount: 11,
        href: "/r/post-1",
        comments: []
      }
    ]);
  });

  it("embeds comments under their matching post", () => {
    const now = new Date("2026-05-24T08:00:00.000Z");
    const posts: LinkitPost[] = [
      {
        id: "post-1",
        legacyId: null,
        title: "Commented post",
        body: null,
        link: "https://example.com/commented",
        thumbnailUrl: null,
        profileThumbnailUrl: null,
        providerName: "Example",
        clickCount: 0,
        commentsCount: 1,
        user: {
          id: "user-1",
          email: "ada@example.com",
          name: "Ada Lovelace",
          imageUrl: null
        },
        createdAt: now,
        updatedAt: now
      }
    ];

    expect(
      toFeedItems(posts, [
        makeComment({
          id: "comment-1",
          postId: "post-1",
          body: "Worth reading.",
          user: {
            id: "user-2",
            email: "grace@example.com",
            name: "Grace Hopper",
            imageUrl: null
          }
        })
      ])
    ).toEqual([
      {
        id: "post-1",
        title: "Commented post",
        thumbnailUrl: null,
        profileThumbnailUrl: null,
        providerName: "Example",
        commentsCount: 1,
        clickCount: 0,
        href: "/r/post-1",
        comments: [
          {
            id: "comment-1",
            postId: "post-1",
            body: "Worth reading.",
            authorName: "Grace Hopper"
          }
        ]
      }
    ]);
  });

  it("uses username over name when available", () => {
    const now = new Date("2026-05-24T08:00:00.000Z");
    const posts: LinkitPost[] = [
      {
        id: "post-1",
        legacyId: null,
        title: "Username test",
        body: null,
        link: "https://example.com/u",
        thumbnailUrl: null,
        profileThumbnailUrl: null,
        providerName: "Example",
        clickCount: 0,
        commentsCount: 1,
        user: { id: "user-1", email: "ada@example.com", name: "Ada Lovelace", imageUrl: null },
        createdAt: now,
        updatedAt: now
      }
    ];
    const comments: LinkitComment[] = [
      makeComment({
        id: "c-1",
        postId: "post-1",
        body: "From username holder.",
        user: { id: "user-2", email: "g@example.com", name: "Grace Hopper", username: "grace_h", imageUrl: null }
      })
    ];

    const items = toFeedItems(posts, comments);
    expect(items[0]?.comments[0]?.authorName).toBe("grace_h");
  });
});

describe("toCommentCard", () => {
  it("maps a root comment to a card", () => {
    const c = makeComment({ id: "c-1", replyCount: 3 });
    const card = toCommentCard(c);
    expect(card).toEqual({
      id: "c-1",
      postId: "post-1",
      body: "Worth reading.",
      authorName: "Ada Lovelace",
      authorId: "user-1",
      replyToUserName: null,
      replyCount: 3,
      parentId: null,
      createdAt: new Date("2026-05-24T08:00:00.000Z")
    });
  });

  it("uses username over name", () => {
    const c = makeComment({
      user: { id: "u-1", email: "a@example.com", name: "Alice", username: "alice_99", imageUrl: null }
    });
    expect(toCommentCard(c).authorName).toBe("alice_99");
  });

  it("falls back to name when username is null", () => {
    const c = makeComment({
      user: { id: "u-1", email: "a@example.com", name: "Alice", username: null, imageUrl: null }
    });
    expect(toCommentCard(c).authorName).toBe("Alice");
  });

  it("maps a reply card with parentId and replyToUserName", () => {
    const c = makeComment({
      id: "c-2",
      parentId: "c-1",
      replyToUserName: "Grace"
    });
    const card = toCommentCard(c);
    expect(card.parentId).toBe("c-1");
    expect(card.replyToUserName).toBe("Grace");
  });
});
