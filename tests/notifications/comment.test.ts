import { describe, expect, it, vi } from "vitest";

import {
  buildCommentNotification,
  createMailgunMailer
} from "@/src/notifications/comment";

const now = new Date("2026-05-24T08:00:00.000Z");

describe("comment notifications", () => {
  it("builds a unique-recipient notification for the target comment", () => {
    const notification = buildCommentNotification({
      appUrl: "https://linkit.test",
      commentId: "comment-1",
      post: {
        id: "post-1",
        legacyId: null,
        title: "A useful link",
        body: null,
        link: "https://example.com",
        thumbnailUrl: null,
        profileThumbnailUrl: null,
        providerName: "Example",
        clickCount: 0,
        commentsCount: 1,
        user: {
          id: "user-1",
          email: "author@example.com",
          name: "Author",
          imageUrl: null
        },
        createdAt: now,
        updatedAt: now
      },
      comments: [
        {
          id: "comment-1",
          legacyId: null,
          postId: "post-1",
          body: "This is sharp.",
          parentId: null,
          replyToUserName: null,
          replyCount: 0,
          user: {
            id: "user-2",
            email: "author@example.com",
            name: "Author Again",
            imageUrl: null
          },
          createdAt: now,
          updatedAt: now
        }
      ]
    });

    expect(notification).toEqual(
      expect.objectContaining({
        to: ["author@example.com"],
        subject: "New comment for A useful link",
        text: expect.stringContaining("This is sharp."),
        html: expect.stringContaining("Open the discussion")
      })
    );
  });

  it("returns null when the target comment is not available", () => {
    expect(
      buildCommentNotification({
        appUrl: "https://linkit.test",
        commentId: "missing",
        post: {
          id: "post-1",
          legacyId: null,
          title: "A useful link",
          body: null,
          link: "https://example.com",
          thumbnailUrl: null,
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
          createdAt: now,
          updatedAt: now
        },
        comments: []
      })
    ).toBeNull();
  });

  it("sends notifications through Mailgun", async () => {
    const fetchImpl = vi.fn(async () => ({
      ok: true,
      status: 200
    })) as unknown as typeof fetch;

    await createMailgunMailer({
      apiKey: "test-key",
      domain: "mail.linkit.test",
      from: "Linkit <notifications@linkit.test>",
      fetchImpl
    }).send({
      to: ["reader@example.com"],
      subject: "Subject",
      text: "Plain text",
      html: "<p>HTML</p>"
    });

    expect(fetchImpl).toHaveBeenCalledWith(
      "https://api.mailgun.net/v3/mail.linkit.test/messages",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          authorization: expect.stringMatching(/^Basic /)
        }),
        body: expect.any(URLSearchParams)
      })
    );
  });
});
