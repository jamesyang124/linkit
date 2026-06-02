import type { LinkitComment, LinkitPost } from "@/domain/linkit";

export type CommentNotification = {
  to: string[];
  subject: string;
  text: string;
  html: string;
};

export type Mailer = {
  send(notification: CommentNotification): Promise<void>;
};

export function buildCommentNotification(input: {
  post: LinkitPost;
  comments: LinkitComment[];
  commentId: string;
  appUrl: string;
}): CommentNotification | null {
  const comment = input.comments.find((item) => item.id === input.commentId);
  if (!comment) {
    return null;
  }

  const recipients = uniqueEmails([
    input.post.user.email,
    ...input.comments.map((item) => item.user.email)
  ]);

  return {
    to: recipients,
    subject: `New comment for ${input.post.title}`,
    text: `${comment.user.name} commented on ${input.post.title}:\n\n${comment.body}\n\n${input.appUrl}/#${input.post.id}`,
    html: [
      `<p><strong>${escapeHtml(comment.user.name)}</strong> commented on <strong>${escapeHtml(input.post.title)}</strong>.</p>`,
      `<p>${escapeHtml(comment.body)}</p>`,
      `<p><a href="${escapeHtml(input.appUrl)}/#${escapeHtml(input.post.id)}">Open the discussion</a></p>`
    ].join("")
  };
}

export function createMailgunMailer(input: {
  apiKey: string;
  domain: string;
  from: string;
  fetchImpl?: typeof fetch;
}): Mailer {
  const fetchImpl = input.fetchImpl ?? fetch;

  return {
    async send(notification) {
      const body = new URLSearchParams();
      body.set("from", input.from);
      body.set("to", notification.to.join(","));
      body.set("subject", notification.subject);
      body.set("text", notification.text);
      body.set("html", notification.html);

      const response = await fetchImpl(
        `https://api.mailgun.net/v3/${input.domain}/messages`,
        {
          method: "POST",
          headers: {
            authorization: `Basic ${Buffer.from(`api:${input.apiKey}`).toString("base64")}`
          },
          body
        }
      );

      if (!response.ok) {
        throw new Error(`Mailgun send failed with status ${response.status}`);
      }
    }
  };
}

function uniqueEmails(emails: string[]): string[] {
  return [...new Set(emails.filter(Boolean))];
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll("\"", "&quot;")
    .replaceAll("'", "&#39;");
}
