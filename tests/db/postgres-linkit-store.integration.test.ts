import { randomUUID } from "node:crypto";

import { describe, expect, it } from "vitest";

import { createDb } from "@/db/client";
import { createPostgresLinkitStore } from "@/db/linkit-store";
import {
  createLinkitService,
  type LinkitJob,
  type LinkitUser
} from "@/domain/linkit";

const testDatabaseUrl = process.env.TEST_DATABASE_URL;
const describeIfDatabase = testDatabaseUrl ? describe : describe.skip;

function testUser(): LinkitUser {
  const id = randomUUID();

  return {
    id,
    email: `${id}@example.com`,
    name: "Integration User",
    imageUrl: null
  };
}

describeIfDatabase("Postgres Linkit store integration", () => {
  it("persists posts, comments, and counters through the domain service", async () => {
    const db = createDb(testDatabaseUrl as string);
    const store = createPostgresLinkitStore(db);
    const jobs: LinkitJob[] = [];
    const service = createLinkitService({
      store,
      enqueue: async (job) => {
        jobs.push(job);
      }
    });
    const user = testUser();
    const link = `https://example.com/integration/${randomUUID()}`;

    const post = await service.submitLink({ link, user });
    const comment = await service.addComment({
      postId: post.id,
      body: "Persist this comment.",
      user
    });
    const redirectUrl = await service.registerRedirect(post.id);

    const updatedPost = await store.findPostById(post.id);
    expect(redirectUrl).toBe(link);
    expect(comment.body).toBe("Persist this comment.");
    expect(updatedPost?.commentsCount).toBe(1);
    expect(updatedPost?.clickCount).toBe(1);
    expect(jobs).toEqual([
      {
        type: "link.enrich",
        payload: {
          postId: post.id,
          link
        }
      },
      {
        type: "comment.notify",
        payload: {
          postId: post.id,
          commentId: comment.id
        }
      }
    ]);
  });
});
