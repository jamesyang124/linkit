import { describe, expect, it, vi } from "vitest";

import type { UpdatePostMetadataInput } from "@/domain/linkit";
import { handleJob } from "@/worker/handlers";

function updatedPost(input: UpdatePostMetadataInput) {
  return {
    id: input.postId,
    legacyId: null,
    title: input.title,
    body: input.body,
    link: "https://example.com",
    thumbnailUrl: input.thumbnailUrl,
    profileThumbnailUrl: null,
    providerName: input.providerName,
    clickCount: 0,
    commentsCount: 0,
    user: {
      id: "user-1",
      email: "author@example.com",
      name: "Author",
      imageUrl: null
    },
    createdAt: new Date("2026-05-24T08:00:00.000Z"),
    updatedAt: new Date("2026-05-24T08:00:00.000Z")
  };
}

describe("worker handlers", () => {
  it("enriches a link by fetching metadata and updating the post", async () => {
    const updatePostMetadata = vi.fn(async (input) => ({
      ...input,
      id: input.postId
    }));

    await handleJob(
      {
        type: "link.enrich",
        payload: {
          postId: "post-1",
          link: "https://example.com/story"
        }
      },
      {
        store: {
          updatePostMetadata,
          findPostById: async () => null,
          listCommentsForPosts: async () => []
        },
        metadataProvider: {
          fetch: async () => ({
            title: "Fetched title",
            description: "Fetched description",
            providerName: "Example",
            thumbnailUrl: "https://example.com/thumb.jpg"
          })
        },
        imageUploader: {
          uploadFromUrl: async () => ({
            secureUrl: "https://example.com/not-used.jpg"
          })
        },
        mailer: {
          send: async () => {}
        },
        enqueue: async () => {},
        appUrl: "https://linkit.test"
      }
    );

    expect(updatePostMetadata).toHaveBeenCalledWith({
      postId: "post-1",
      title: "Fetched title",
      body: "Fetched description",
      providerName: "Example",
      thumbnailUrl: "https://example.com/thumb.jpg"
    });
  });

  it("enqueues background image processing after metadata adds a thumbnail", async () => {
    const enqueue = vi.fn(async () => {});

    await handleJob(
      {
        type: "link.enrich",
        payload: {
          postId: "post-1",
          link: "https://example.com/story"
        }
      },
      {
        store: {
          updatePostMetadata: async (input) => updatedPost(input),
          findPostById: async () => null,
          listCommentsForPosts: async () => []
        },
        metadataProvider: {
          fetch: async () => ({
            title: "Fetched title",
            description: "Fetched description",
            providerName: "Example",
            thumbnailUrl: "https://example.com/thumb.jpg"
          })
        },
        imageUploader: {
          uploadFromUrl: async () => ({
            secureUrl: "https://example.com/not-used.jpg"
          })
        },
        mailer: {
          send: async () => {}
        },
        enqueue,
        appUrl: "https://linkit.test"
      }
    );

    expect(enqueue).toHaveBeenCalledWith({
      type: "image.process",
      payload: {
        postId: "post-1",
        thumbnailUrl: "https://example.com/thumb.jpg"
      }
    });
  });

  it("sends comment notifications to the post author and commenters", async () => {
    const send = vi.fn(async () => {});

    await handleJob(
      {
        type: "comment.notify",
        payload: {
          postId: "post-1",
          commentId: "comment-2"
        }
      },
      {
        store: {
          updatePostMetadata: async () => {
            throw new Error("not used");
          },
          findPostById: async () => ({
            id: "post-1",
            legacyId: null,
            title: "A useful link",
            body: null,
            link: "https://example.com",
            thumbnailUrl: null,
            profileThumbnailUrl: null,
            providerName: "Example",
            clickCount: 0,
            commentsCount: 2,
            user: {
              id: "user-1",
              email: "author@example.com",
              name: "Author",
              imageUrl: null
            },
            createdAt: new Date("2026-05-24T08:00:00.000Z"),
            updatedAt: new Date("2026-05-24T08:00:00.000Z")
          }),
          listCommentsForPosts: async () => [
            {
              id: "comment-1",
              legacyId: null,
              postId: "post-1",
              body: "Earlier comment",
              parentId: null,
              replyToUserName: null,
              replyCount: 0,
              user: {
                id: "user-2",
                email: "reader@example.com",
                name: "Reader",
                imageUrl: null
              },
              createdAt: new Date("2026-05-24T08:01:00.000Z"),
              updatedAt: new Date("2026-05-24T08:01:00.000Z")
            },
            {
              id: "comment-2",
              legacyId: null,
              postId: "post-1",
              body: "New comment",
              parentId: null,
              replyToUserName: null,
              replyCount: 0,
              user: {
                id: "user-3",
                email: "commenter@example.com",
                name: "Commenter",
                imageUrl: null
              },
              createdAt: new Date("2026-05-24T08:02:00.000Z"),
              updatedAt: new Date("2026-05-24T08:02:00.000Z")
            }
          ]
        },
        metadataProvider: {
          fetch: async () => {
            throw new Error("not used");
          }
        },
        imageUploader: {
          uploadFromUrl: async () => {
            throw new Error("not used");
          }
        },
        mailer: {
          send
        },
        enqueue: async () => {},
        appUrl: "https://linkit.test"
      }
    );

    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: ["author@example.com", "reader@example.com", "commenter@example.com"],
        subject: "New comment for A useful link",
        text: expect.stringContaining("New comment"),
        html: expect.stringContaining("Commenter")
      })
    );
  });

  it("processes a thumbnail by uploading it and replacing the post thumbnail URL", async () => {
    const updatePostMetadata = vi.fn(async (input) => ({
      ...input,
      id: input.postId
    }));

    await handleJob(
      {
        type: "image.process",
        payload: {
          postId: "post-1",
          thumbnailUrl: "https://remote.test/source.jpg"
        }
      },
      {
        store: {
          updatePostMetadata,
          findPostById: async () => ({
            id: "post-1",
            legacyId: null,
            title: "Existing title",
            body: "Existing body",
            link: "https://example.com",
            thumbnailUrl: "https://remote.test/source.jpg",
            profileThumbnailUrl: null,
            providerName: "Example",
            clickCount: 0,
            commentsCount: 0,
            user: {
              id: "user-1",
              email: "author@example.com",
              name: "Author",
              imageUrl: null
            },
            createdAt: new Date("2026-05-24T08:00:00.000Z"),
            updatedAt: new Date("2026-05-24T08:00:00.000Z")
          }),
          listCommentsForPosts: async () => []
        },
        metadataProvider: {
          fetch: async () => {
            throw new Error("not used");
          }
        },
        imageUploader: {
          uploadFromUrl: async (_url, options) => ({
            secureUrl: `https://cdn.test/uploaded-w${options!.maxWidth}-q${options!.quality}.jpg`
          })
        },
        mailer: {
          send: async () => {}
        },
        enqueue: async () => {},
        appUrl: "https://linkit.test"
      }
    );

    expect(updatePostMetadata).toHaveBeenCalledWith({
      postId: "post-1",
      title: "Existing title",
      body: "Existing body",
      providerName: "Example",
      thumbnailUrl: "https://cdn.test/uploaded-w736-q72.jpg",
      profileThumbnailUrl: "https://cdn.test/uploaded-w900-q80.jpg"
    });
  });

  it("passes default resize and compression bounds to the uploader", async () => {
    const uploadFromUrl = vi.fn(async () => ({
      secureUrl: "https://cdn.test/uploaded.jpg"
    }));

    await handleJob(
      {
        type: "image.process",
        payload: {
          postId: "post-1",
          thumbnailUrl: "https://remote.test/source.jpg"
        }
      },
      {
        store: {
          updatePostMetadata: async (input) => updatedPost(input),
          findPostById: async () => ({
            id: "post-1",
            legacyId: null,
            title: "Existing title",
            body: "Existing body",
            link: "https://example.com",
            thumbnailUrl: "https://remote.test/source.jpg",
            profileThumbnailUrl: null,
            providerName: "Example",
            clickCount: 0,
            commentsCount: 0,
            user: {
              id: "user-1",
              email: "author@example.com",
              name: "Author",
              imageUrl: null
            },
            createdAt: new Date("2026-05-24T08:00:00.000Z"),
            updatedAt: new Date("2026-05-24T08:00:00.000Z")
          }),
          listCommentsForPosts: async () => []
        },
        metadataProvider: {
          fetch: async () => {
            throw new Error("not used");
          }
        },
        imageUploader: {
          uploadFromUrl
        },
        mailer: {
          send: async () => {}
        },
        enqueue: async () => {},
        appUrl: "https://linkit.test"
      }
    );

    expect(uploadFromUrl).toHaveBeenCalledWith("https://remote.test/source.jpg", {
      maxWidth: 736,
      quality: 72
    });
  });

  it("processes a thumbnail with custom resize settings", async () => {
    const updatePostMetadata = vi.fn(async (input) => ({
      ...input,
      id: input.postId
    }));

    await handleJob(
      {
        type: "image.process",
        payload: {
          postId: "post-1",
          thumbnailUrl: "https://remote.test/source.jpg"
        }
      },
      {
        store: {
          updatePostMetadata,
          findPostById: async () => ({
            id: "post-1",
            legacyId: null,
            title: "Existing title",
            body: "Existing body",
            link: "https://example.com",
            thumbnailUrl: "https://remote.test/source.jpg",
            profileThumbnailUrl: null,
            providerName: "Example",
            clickCount: 0,
            commentsCount: 0,
            user: {
              id: "user-1",
              email: "author@example.com",
              name: "Author",
              imageUrl: null
            },
            createdAt: new Date("2026-05-24T08:00:00.000Z"),
            updatedAt: new Date("2026-05-24T08:00:00.000Z")
          }),
          listCommentsForPosts: async () => []
        },
        metadataProvider: {
          fetch: async () => {
            throw new Error("not used");
          }
        },
        imageUploader: {
          uploadFromUrl: async (_url, options) => ({
            secureUrl: `https://cdn.test/uploaded-w${options!.maxWidth}-q${options!.quality}.jpg`
          })
        },
        imageProcessing: {
          maxWidth: 720,
          quality: 64
        },
        mailer: {
          send: async () => {}
        },
        enqueue: async () => {},
        appUrl: "https://linkit.test"
      }
    );

    expect(updatePostMetadata).toHaveBeenCalledWith({
      postId: "post-1",
      title: "Existing title",
      body: "Existing body",
      providerName: "Example",
      thumbnailUrl: "https://cdn.test/uploaded-w720-q64.jpg",
      profileThumbnailUrl: "https://cdn.test/uploaded-w900-q80.jpg"
    });
  });

  it("keeps the old thumbnail when the referenced post is missing", async () => {
    const uploadFromUrl = vi.fn(async () => ({
      secureUrl: "https://cdn.test/uploaded.jpg"
    }));

    await handleJob(
      {
        type: "image.process",
        payload: {
          postId: "missing",
          thumbnailUrl: "https://remote.test/source.jpg"
        }
      },
      {
        store: {
          updatePostMetadata: async () => {
            throw new Error("not used");
          },
          findPostById: async () => null,
          listCommentsForPosts: async () => []
        },
        metadataProvider: {
          fetch: async () => {
            throw new Error("not used");
          }
        },
        imageUploader: {
          uploadFromUrl
        },
        mailer: {
          send: async () => {}
        },
        enqueue: async () => {},
        appUrl: "https://linkit.test"
      }
    );

    expect(uploadFromUrl).not.toHaveBeenCalled();
  });

  it("processes a thumbnail by uploading it and replacing the post thumbnail URL", async () => {
    const updatePostMetadata = vi.fn(async (input) => ({
      ...input,
      id: input.postId
    }));

    await handleJob(
      {
        type: "image.process",
        payload: {
          postId: "post-1",
          thumbnailUrl: "https://remote.test/source.jpg"
        }
      },
      {
        store: {
          updatePostMetadata,
          findPostById: async () => ({
            id: "post-1",
            legacyId: null,
            title: "Existing title",
            body: "Existing body",
            link: "https://example.com",
            thumbnailUrl: "https://remote.test/source.jpg",
            profileThumbnailUrl: null,
            providerName: "Example",
            clickCount: 0,
            commentsCount: 0,
            user: {
              id: "user-1",
              email: "author@example.com",
              name: "Author",
              imageUrl: null
            },
            createdAt: new Date("2026-05-24T08:00:00.000Z"),
            updatedAt: new Date("2026-05-24T08:00:00.000Z")
          }),
          listCommentsForPosts: async () => []
        },
        metadataProvider: {
          fetch: async () => {
            throw new Error("not used");
          }
        },
        imageUploader: {
          uploadFromUrl: async () => ({
            secureUrl: "https://cdn.test/uploaded.jpg"
          })
        },
        mailer: {
          send: async () => {}
        },
        enqueue: async () => {},
        appUrl: "https://linkit.test"
      }
    );

    expect(updatePostMetadata).toHaveBeenCalledWith({
      postId: "post-1",
      title: "Existing title",
      body: "Existing body",
      providerName: "Example",
      thumbnailUrl: "https://cdn.test/uploaded.jpg",
      profileThumbnailUrl: "https://cdn.test/uploaded.jpg"
    });
  });
});
