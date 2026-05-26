import { describe, expect, it } from "vitest";

import {
  BlankCommentError,
  BlankLinkError,
  DuplicateLinkError,
  createLinkitService,
  createMemoryLinkitStore,
  type LinkitJob,
  type LinkitUser
} from "@/src/domain/linkit";

function testUser(overrides: Partial<LinkitUser> = {}): LinkitUser {
  return {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada Lovelace",
    imageUrl: null,
    ...overrides
  };
}

function createHarness() {
  const store = createMemoryLinkitStore();
  const jobs: LinkitJob[] = [];
  const service = createLinkitService({
    store,
    enqueue: async (job) => {
      jobs.push(job);
    }
  });

  return { jobs, service, store };
}

describe("Linkit service", () => {
  it("creates a post from a submitted link and enqueues metadata enrichment", async () => {
    const { jobs, service } = createHarness();

    const post = await service.submitLink({
      link: " https://example.com/notes ",
      user: testUser()
    });

    expect(post.link).toBe("https://example.com/notes");
    expect(post.title).toBe("example.com");
    expect(post.providerName).toBe("example.com");
    expect(post.clickCount).toBe(0);
    expect(post.commentsCount).toBe(0);
    expect(jobs).toEqual([
      {
        type: "link.enrich",
        payload: {
          postId: post.id,
          link: "https://example.com/notes"
        }
      }
    ]);
  });

  it("rejects blank links before creating a post", async () => {
    const { service, store } = createHarness();

    await expect(
      service.submitLink({ link: "   ", user: testUser() })
    ).rejects.toBeInstanceOf(BlankLinkError);
    await expect(store.listPosts()).resolves.toEqual([]);
  });

  it("rejects duplicate links", async () => {
    const { service } = createHarness();
    const user = testUser();

    await service.submitLink({ link: "https://example.com/one", user });

    await expect(
      service.submitLink({ link: "https://example.com/one", user })
    ).rejects.toBeInstanceOf(DuplicateLinkError);
  });

  it("adds comments, updates the post count, and enqueues notification", async () => {
    const { jobs, service, store } = createHarness();
    const post = await service.submitLink({
      link: "https://example.com/comments",
      user: testUser()
    });

    const comment = await service.addComment({
      postId: post.id,
      body: "This belongs in the feed.",
      user: testUser({ id: "user-2", email: "grace@example.com", name: "Grace Hopper" })
    });

    const updatedPost = await store.findPostById(post.id);
    expect(comment.body).toBe("This belongs in the feed.");
    expect(updatedPost?.commentsCount).toBe(1);
    expect(jobs).toContainEqual({
      type: "comment.notify",
      payload: {
        postId: post.id,
        commentId: comment.id
      }
    });
  });

  it("rejects blank comments", async () => {
    const { service } = createHarness();
    const post = await service.submitLink({
      link: "https://example.com/blank-comment",
      user: testUser()
    });

    await expect(
      service.addComment({ postId: post.id, body: "", user: testUser() })
    ).rejects.toBeInstanceOf(BlankCommentError);
  });

  it("increments click count and returns the original redirect URL", async () => {
    const { service, store } = createHarness();
    const post = await service.submitLink({
      link: "https://example.com/redirect-target",
      user: testUser()
    });

    const redirectUrl = await service.registerRedirect(post.id);

    const updatedPost = await store.findPostById(post.id);
    expect(redirectUrl).toBe("https://example.com/redirect-target");
    expect(updatedPost?.clickCount).toBe(1);
  });

  it("lists posts with keyset pagination and thumbnail filtering", async () => {
    const store = createMemoryLinkitStore();
    const user = testUser();
    const olderPost = await store.createPost({
      link: "https://example.com/older",
      title: "Older",
      body: null,
      providerName: "Example",
      thumbnailUrl: "https://example.com/older.jpg",
      user
    });
    await store.createPost({
      link: "https://example.com/pending",
      title: "Pending",
      body: null,
      providerName: "Example",
      thumbnailUrl: null,
      user
    });
    const newerPost = await store.createPost({
      link: "https://example.com/newer",
      title: "Newer",
      body: null,
      providerName: "Example",
      thumbnailUrl: "https://example.com/newer.jpg",
      user
    });

    const firstPage = await store.listPostsPage({
      limit: 1,
      thumbnailsOnly: true
    });
    expect(firstPage.posts.map((post) => post.id)).toEqual([newerPost.id]);
    expect(firstPage.nextCursor).toEqual({
      createdAt: newerPost.createdAt,
      id: newerPost.id
    });

    const secondPage = await store.listPostsPage({
      limit: 1,
      cursor: firstPage.nextCursor,
      thumbnailsOnly: true
    });
    expect(secondPage.posts.map((post) => post.id)).toEqual([olderPost.id]);
    expect(secondPage.nextCursor).toBeNull();
  });
});
