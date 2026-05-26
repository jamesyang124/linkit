import { describe, expect, it, vi } from "vitest";

import {
  registerPostRedirect,
  submitCommentFromForm,
  submitLinkFromForm
} from "@/src/server/posts";
import {
  createMemoryLinkitStore,
  type LinkitJob
} from "@/src/domain/linkit";
import { getFeedItemsFromStore } from "@/src/feed/load-feed";

function sessionUser() {
  return {
    id: "user-1",
    email: "ada@example.com",
    name: "Ada Lovelace",
    image: null
  };
}

function formData(link: string) {
  const data = new FormData();
  data.set("link", link);
  return data;
}

function commentFormData(postId: string, comment: string) {
  const data = new FormData();
  data.set("postId", postId);
  data.set("comment", comment);
  return data;
}

describe("post server workflows", () => {
  it("submits a link for the signed-in user, enqueues enrichment, and revalidates the feed", async () => {
    const store = createMemoryLinkitStore();
    const jobs: LinkitJob[] = [];
    const revalidateFeed = vi.fn();

    const result = await submitLinkFromForm(
      formData(" https://example.com/new-link "),
      sessionUser(),
      {
        store,
        enqueue: async (job) => {
          jobs.push(job);
        },
        revalidateFeed
      }
    );

    const posts = await store.listPosts();
    expect(result).toEqual({ ok: true, postId: posts[0]?.id });
    expect(posts[0]?.link).toBe("https://example.com/new-link");
    expect(jobs).toEqual([
      {
        type: "link.enrich",
        payload: {
          postId: posts[0]?.id,
          link: "https://example.com/new-link"
        }
      }
    ]);
    expect(revalidateFeed).toHaveBeenCalledOnce();
  });

  it("metadataProvider path: post is created with real OG data and image processing is enqueued", async () => {
    const store = createMemoryLinkitStore();
    const jobs: LinkitJob[] = [];
    const revalidateFeed = vi.fn();

    const result = await submitLinkFromForm(
      formData("https://example.com/og-page"),
      sessionUser(),
      {
        store,
        enqueue: async (job) => { jobs.push(job); },
        revalidateFeed,
        metadataProvider: {
          fetch: async () => ({
            title: "Real page title",
            description: "Real description",
            providerName: "Example Site",
            thumbnailUrl: "https://example.com/og-image.jpg"
          })
        }
      }
    );

    expect(result.ok).toBe(true);
    const posts = await store.listPosts();
    expect(posts[0]).toMatchObject({
      title: "Real page title",
      providerName: "Example Site",
      thumbnailUrl: "https://example.com/og-image.jpg"
    });
    expect(jobs).toEqual([
      {
        type: "image.process",
        payload: {
          postId: posts[0]?.id,
          thumbnailUrl: "https://example.com/og-image.jpg"
        }
      }
    ]);
    expect(revalidateFeed).toHaveBeenCalledOnce();
  });

  it("rejects link submission without a signed-in user", async () => {
    const store = createMemoryLinkitStore();
    const revalidateFeed = vi.fn();

    await expect(
      submitLinkFromForm(formData("https://example.com"), null, {
        store,
        enqueue: async () => {},
        revalidateFeed
      })
    ).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
      message: "Sign in before sharing a link."
    });
    await expect(store.listPosts()).resolves.toEqual([]);
    expect(revalidateFeed).not.toHaveBeenCalled();
  });

  it("returns a validation failure for bad input", async () => {
    await expect(
      submitLinkFromForm(formData(" "), sessionUser(), {
        store: createMemoryLinkitStore(),
        enqueue: async () => {},
        revalidateFeed: vi.fn()
      })
    ).resolves.toEqual({
      ok: false,
      reason: "invalid",
      message: "Link is required."
    });
  });

  it("registers redirects by incrementing click count and returning the target URL", async () => {
    const store = createMemoryLinkitStore();
    const submitResult = await submitLinkFromForm(
      formData("https://example.com/target"),
      sessionUser(),
      {
        store,
        enqueue: async () => {},
        revalidateFeed: vi.fn()
      }
    );

    if (!submitResult.ok) {
      throw new Error("expected post creation to succeed");
    }

    await expect(registerPostRedirect(submitResult.postId, store)).resolves.toBe(
      "https://example.com/target"
    );
    await expect(store.findPostById(submitResult.postId)).resolves.toMatchObject({
      clickCount: 1
    });
  });

  it("returns null for redirects to missing posts", async () => {
    await expect(
      registerPostRedirect("missing", createMemoryLinkitStore())
    ).resolves.toBeNull();
  });

  it("submits a comment for the signed-in user, enqueues notification, and revalidates the feed", async () => {
    const store = createMemoryLinkitStore();
    const jobs: LinkitJob[] = [];
    const revalidateFeed = vi.fn();
    const postResult = await submitLinkFromForm(
      formData("https://example.com/commented"),
      sessionUser(),
      {
        store,
        enqueue: async () => {},
        revalidateFeed: vi.fn()
      }
    );

    if (!postResult.ok) {
      throw new Error("expected post creation to succeed");
    }

    const result = await submitCommentFromForm(
      commentFormData(postResult.postId, "This belongs in the thread."),
      sessionUser(),
      {
        store,
        enqueue: async (job) => {
          jobs.push(job);
        },
        revalidateFeed
      }
    );

    const comments = await store.listCommentsForPosts([postResult.postId]);
    expect(result).toEqual({ ok: true, commentId: comments[0]?.id });
    expect(comments[0]?.body).toBe("This belongs in the thread.");
    expect(jobs).toEqual([
      {
        type: "comment.notify",
        payload: {
          postId: postResult.postId,
          commentId: comments[0]?.id
        }
      }
    ]);
    expect(revalidateFeed).toHaveBeenCalledOnce();
  });

  it("submits a threaded reply with parentId and replyToUserName", async () => {
    const store = createMemoryLinkitStore();
    const revalidateFeed = vi.fn();

    const postResult = await submitLinkFromForm(
      formData("https://example.com/thread"),
      sessionUser(),
      { store, enqueue: async () => {}, revalidateFeed: vi.fn() }
    );
    if (!postResult.ok) throw new Error("post creation failed");

    // First: root comment
    const rootResult = await submitCommentFromForm(
      commentFormData(postResult.postId, "Root comment"),
      sessionUser(),
      { store, enqueue: async () => {}, revalidateFeed: vi.fn() }
    );
    if (!rootResult.ok) throw new Error("root comment failed");

    const rootComments = await store.listTopLevelComments(postResult.postId);
    const rootId = rootComments[0]?.id;
    if (!rootId) throw new Error("root comment id missing");

    // Reply using parentId
    const replyFormData = new FormData();
    replyFormData.set("postId", postResult.postId);
    replyFormData.set("comment", "Reply to root");
    replyFormData.set("parentId", rootId);
    replyFormData.set("replyToUserName", "Ada Lovelace");

    const replyResult = await submitCommentFromForm(replyFormData, sessionUser(), {
      store,
      enqueue: async () => {},
      revalidateFeed
    });
    expect(replyResult.ok).toBe(true);

    const replies = await store.listRepliesForComment(rootId);
    expect(replies[0]?.body).toBe("Reply to root");
    expect(replies[0]?.parentId).toBe(rootId);
    expect(replies[0]?.replyToUserName).toBe("Ada Lovelace");
  });

  it("rejects comment submission without a signed-in user", async () => {
    await expect(
      submitCommentFromForm(commentFormData("post-1", "Nope"), null, {
        store: createMemoryLinkitStore(),
        enqueue: async () => {},
        revalidateFeed: vi.fn()
      })
    ).resolves.toEqual({
      ok: false,
      reason: "unauthenticated",
      message: "Sign in before commenting."
    });
  });

  it("returns a validation failure for blank comments", async () => {
    const store = createMemoryLinkitStore();
    const postResult = await submitLinkFromForm(
      formData("https://example.com/blank-comment"),
      sessionUser(),
      {
        store,
        enqueue: async () => {},
        revalidateFeed: vi.fn()
      }
    );

    if (!postResult.ok) {
      throw new Error("expected post creation to succeed");
    }

    await expect(
      submitCommentFromForm(commentFormData(postResult.postId, ""), sessionUser(), {
        store,
        enqueue: async () => {},
        revalidateFeed: vi.fn()
      })
    ).resolves.toEqual({
      ok: false,
      reason: "invalid",
      message: "Comment is required."
    });
  });
});

describe("gallery pending-link invariant", () => {
  it("post title is the real OG title when metadataProvider succeeds", async () => {
    const store = createMemoryLinkitStore();

    await submitLinkFromForm(formData("https://example.com/story"), sessionUser(), {
      store,
      enqueue: async () => {},
      revalidateFeed: vi.fn(),
      metadataProvider: {
        fetch: async () => ({
          title: "Real Story Title",
          description: "A description",
          providerName: "Example Site",
          thumbnailUrl: "https://cdn.example.com/og.jpg"
        })
      }
    });

    const posts = await store.listPosts();
    expect(posts[0]?.title).toBe("Real Story Title");
    expect(posts[0]?.title).not.toMatch(/pending/i);
    expect(posts[0]?.thumbnailUrl).toBe("https://cdn.example.com/og.jpg");
  });

  it("post title falls back to hostname (not placeholder text) when OG fetch fails", async () => {
    const store = createMemoryLinkitStore();

    await submitLinkFromForm(formData("https://myblog.com/article"), sessionUser(), {
      store,
      enqueue: async () => {},
      revalidateFeed: vi.fn(),
      metadataProvider: {
        fetch: async () => { throw new Error("network error"); }
      }
    });

    const posts = await store.listPosts();
    expect(posts[0]?.title).toBe("myblog.com");
    expect(posts[0]?.title).not.toMatch(/pending/i);
    expect(posts[0]?.thumbnailUrl).toBeNull();
  });

  it("only posts with thumbnails appear in the visible gallery feed", async () => {
    const store = createMemoryLinkitStore();

    // Post with real thumbnail (OG success)
    await submitLinkFromForm(formData("https://good.com/link"), sessionUser(), {
      store,
      enqueue: async () => {},
      revalidateFeed: vi.fn(),
      metadataProvider: {
        fetch: async () => ({
          title: "Good Post",
          description: null,
          providerName: "Good Site",
          thumbnailUrl: "https://cdn.good.com/img.jpg"
        })
      }
    });

    // Post with no thumbnail (OG failed → null thumbnailUrl)
    await submitLinkFromForm(formData("https://broken.com/link"), sessionUser(), {
      store,
      enqueue: async () => {},
      revalidateFeed: vi.fn(),
      metadataProvider: {
        fetch: async () => { throw new Error("fetch failed"); }
      }
    });

    const feedItems = await getFeedItemsFromStore(store);
    expect(feedItems).toHaveLength(2);

    const galleryVisible = feedItems.filter((item) => item.thumbnailUrl !== null);
    expect(galleryVisible).toHaveLength(1);
    expect(galleryVisible[0]).toMatchObject({
      title: "Good Post",
      thumbnailUrl: "https://cdn.good.com/img.jpg"
    });

    // Neither post carries placeholder text
    for (const item of feedItems) {
      expect(item.title).not.toMatch(/pending/i);
    }
  });
});
