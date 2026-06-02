import { describe, expect, it, vi } from "vitest";

import {
  getGalleryFeedPageFromStore,
  getFeedItemsFromStore,
  getFeedItemsWithFallback,
  getProfileFeedItemFromStore
} from "@/feed/load-feed";
import type { LinkitPost, PostPageCursor } from "@/domain/linkit";
import { decodePostCursor } from "@/feed/keyset";

const now = new Date("2026-05-24T08:00:00.000Z");

const post: LinkitPost = {
  id: "post-1",
  legacyId: null,
  title: "DB-backed public feed",
  body: null,
  link: "https://example.com/db-feed",
  thumbnailUrl: null,
  profileThumbnailUrl: null,
  providerName: "Example",
  clickCount: 5,
  commentsCount: 2,
  user: {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada Lovelace",
    imageUrl: null
  },
  createdAt: now,
  updatedAt: now
};

describe("feed loader", () => {
  it("loads feed cards from a Linkit store", async () => {
    await expect(
      getFeedItemsFromStore({
        listPosts: async () => [post],
        listCommentsForPosts: async () => []
      })
    ).resolves.toEqual([
      {
        id: "post-1",
        title: "DB-backed public feed",
        thumbnailUrl: null,
        profileThumbnailUrl: null,
        providerName: "Example",
        commentsCount: 2,
        clickCount: 5,
        href: "/r/post-1",
        comments: []
      }
    ]);
  });

  it("returns an empty feed if the backing store is unavailable", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      getFeedItemsWithFallback({
        listPosts: async () => {
          throw new Error("database unavailable");
        },
        listCommentsForPosts: async () => []
      })
    ).resolves.toEqual([]);
    expect(errorSpy).toHaveBeenCalledOnce();

    errorSpy.mockRestore();
  });

  it("loads a keyset-paginated gallery page from thumbnail-ready posts", async () => {
    let receivedCursor: PostPageCursor | null | undefined;
    const nextCursor = {
      providerName: "Pinterest",
      createdAt: new Date("2026-05-24T07:59:00.000Z"),
      id: "post-0"
    };

    const page = await getGalleryFeedPageFromStore(
      {
        listPostsPage: async (input) => {
          receivedCursor = input.cursor;
          expect(input).toMatchObject({
            limit: 2,
            thumbnailsOnly: false
          });
          return {
            posts: [{ ...post, thumbnailUrl: "https://example.com/thumb.jpg" }],
            nextCursor
          };
        },
        listCommentsForPosts: async () => []
      },
      { limit: 2 }
    );

    expect(receivedCursor).toBeNull();
    expect(page.items).toHaveLength(1);
    expect(page.items[0]?.thumbnailUrl).toBe("https://example.com/thumb.jpg");
    expect(page.nextCursor).not.toBeNull();
    expect(decodePostCursor(page.nextCursor as string)).toEqual(nextCursor);
  });

  it("loads a profile item by id without depending on the public feed list", async () => {
    const item = await getProfileFeedItemFromStore(
      {
        findPostById: async (postId) => (postId === post.id ? post : null),
        listCommentsForPosts: async (postIds) => {
          expect(postIds).toEqual([post.id]);
          return [];
        }
      },
      post.id
    );

    expect(item).toMatchObject({
      id: post.id,
      title: post.title,
      href: `/r/${post.id}`
    });
  });

  it("returns null when a profile post does not exist", async () => {
    const item = await getProfileFeedItemFromStore(
      {
        findPostById: async () => null,
        listCommentsForPosts: async () => {
          throw new Error("comments should not be loaded for a missing post");
        }
      },
      "missing-post"
    );

    expect(item).toBeNull();
  });
});
