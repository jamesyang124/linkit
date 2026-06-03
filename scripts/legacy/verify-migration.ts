import { readFile } from "node:fs/promises";

import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import { createPostgresClient } from "@/db/client";
import * as schema from "@/db/schema";
import {
  verifyMigration,
  type LegacySnapshot,
  type TargetSnapshot
} from "@/migration/verify";

const { comments, posts, users } = schema;

async function main() {
  const legacyExportPath = process.env.LEGACY_EXPORT_JSON;
  const databaseUrl = process.env.DATABASE_URL;

  if (!legacyExportPath) {
    console.log(
      "Legacy verification needs LEGACY_EXPORT_JSON pointing to a Rails export JSON file."
    );
    process.exitCode = 1;
    return;
  }

  if (!databaseUrl) {
    console.log("Legacy verification needs DATABASE_URL for the target Postgres DB.");
    process.exitCode = 1;
    return;
  }

  const legacy = JSON.parse(
    await readFile(legacyExportPath, "utf8")
  ) as LegacySnapshot;
  const target = await readTargetSnapshot(databaseUrl);
  const result = verifyMigration(legacy, target);

  for (const check of result.checks) {
    console.log(`[${check.ok ? "pass" : "fail"}] ${check.name}: ${check.message}`);
  }

  process.exitCode = result.ok ? 0 : 1;
}

async function readTargetSnapshot(databaseUrl: string): Promise<TargetSnapshot> {
  const client = createPostgresClient(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    const targetUsers = await db.select().from(users);
    const targetPosts = await db.select().from(posts);
    const targetComments = await db
      .select({
        comment: comments,
        post: posts,
        user: users
      })
      .from(comments)
      .innerJoin(posts, eq(comments.postId, posts.id))
      .innerJoin(users, eq(comments.userId, users.id));

    return {
      users: targetUsers.map((user) => ({
        legacyId: user.legacyId,
        email: user.email
      })),
      posts: targetPosts.map((post) => ({
        legacyId: post.legacyId,
        link: post.link,
        commentsCount: post.commentsCount,
        clickCount: post.clickCount
      })),
      comments: targetComments.map((row) => ({
        legacyId: row.comment.legacyId,
        postLegacyId: row.post.legacyId,
        userLegacyId: row.user.legacyId
      }))
    };
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
