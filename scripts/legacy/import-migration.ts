import { readFile } from "node:fs/promises";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";

import { createPostgresClient } from "@/db/client";
import * as schema from "@/db/schema";
import type { LegacySnapshot } from "@/migration/verify";

const { comments, posts, users } = schema;

async function main() {
  const legacyExportPath = process.env.LEGACY_EXPORT_JSON;
  const databaseUrl = process.env.DATABASE_URL;
  const clean = process.env.CLEAN_BEFORE_IMPORT === "true";

  if (!legacyExportPath) {
    console.log("LEGACY_EXPORT_JSON is required.");
    process.exitCode = 1;
    return;
  }
  if (!databaseUrl) {
    console.log("DATABASE_URL is required.");
    process.exitCode = 1;
    return;
  }

  const legacy = JSON.parse(
    await readFile(legacyExportPath, "utf8")
  ) as LegacySnapshot;

  const client = createPostgresClient(databaseUrl);
  const db = drizzle(client, { schema });

  try {
    if (clean) {
      await db.execute(
        sql`TRUNCATE users, posts, comments, sessions, accounts, verification_tokens CASCADE`
      );
      console.log("Truncated all tables.");
    }

    // Import users
    for (const legacyUser of legacy.users) {
      await db
        .insert(users)
        .values({
          legacyId: legacyUser.id,
          email: legacyUser.email,
          name: legacyUser.email,
        })
        .onConflictDoUpdate({
          target: users.legacyId,
          set: { email: legacyUser.email, name: legacyUser.email },
        });
    }
    console.log(`Imported ${legacy.users.length} users.`);

    // Build user lookup by legacyId; first imported user owns all posts
    const allUsers = await db
      .select({ id: users.id, legacyId: users.legacyId })
      .from(users);
    const userByLegacyId = new Map(
      allUsers.filter((u) => u.legacyId != null).map((u) => [u.legacyId!, u.id])
    );
    const firstUserId = allUsers.find((u) => u.legacyId != null)?.id;
    if (!firstUserId) {
      console.log("No imported users — cannot assign post ownership.");
      process.exitCode = 1;
      return;
    }

    // Import posts — null links get a unique placeholder URL (not verified by link check)
    for (const legacyPost of legacy.posts) {
      const link =
        legacyPost.link ?? `https://migration.invalid/post-${legacyPost.id}`;
      const hostname = legacyPost.link
        ? new URL(legacyPost.link).hostname
        : "migration.invalid";

      await db
        .insert(posts)
        .values({
          legacyId: legacyPost.id,
          userId: firstUserId,
          title: `Imported post ${legacyPost.id}`,
          link,
          providerName: hostname,
          commentsCount: legacyPost.comments_count ?? 0,
          clickCount: legacyPost.click_count ?? 0,
        })
        .onConflictDoUpdate({
          target: posts.legacyId,
          set: {
            link,
            commentsCount: legacyPost.comments_count ?? 0,
            clickCount: legacyPost.click_count ?? 0,
          },
        });
    }
    console.log(`Imported ${legacy.posts.length} posts.`);

    // Build post lookup by legacyId
    const allPosts = await db
      .select({ id: posts.id, legacyId: posts.legacyId })
      .from(posts);
    const postByLegacyId = new Map(
      allPosts.filter((p) => p.legacyId != null).map((p) => [p.legacyId!, p.id])
    );

    // Import comments — skip if post or user can't be resolved
    let skipped = 0;
    for (const legacyComment of legacy.comments) {
      const postId = legacyComment.commentable_id
        ? postByLegacyId.get(legacyComment.commentable_id)
        : undefined;
      const userId = legacyComment.user_id
        ? userByLegacyId.get(legacyComment.user_id)
        : undefined;

      if (!postId || !userId) {
        console.warn(
          `Skipping comment ${legacyComment.id}: ` +
            `post ${legacyComment.commentable_id} or user ${legacyComment.user_id} not found.`
        );
        skipped++;
        continue;
      }

      await db
        .insert(comments)
        .values({
          legacyId: legacyComment.id,
          postId,
          userId,
          body: `[Imported comment ${legacyComment.id}]`
        })
        .onConflictDoUpdate({
          target: comments.legacyId,
          set: { body: `[Imported comment ${legacyComment.id}]` },
        });
    }
    const skippedNote = skipped > 0 ? ` (${skipped} skipped — unresolvable post or user)` : "";
    console.log(`Imported ${legacy.comments.length - skipped} comments${skippedNote}.`);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
