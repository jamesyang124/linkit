import { and, isNotNull, not, sql } from "drizzle-orm";
import path from "node:path";

import { createPostgresClient } from "@/db/client";
import * as schema from "@/db/schema";
import { createSharpImageUploader } from "@/images/uploader";

const { posts } = schema;

const defaultMaxWidth = 736;
const defaultQuality = 72;

type ThumbnailRow = {
  id: string;
  title: string;
  thumbnailUrl: string;
};

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is required.");
  }

  const uploadsDir =
    process.env.UPLOADS_DIR ?? path.join(process.cwd(), "public/uploads");
  const maxWidth = positiveIntegerFromEnv("IMAGE_MAX_WIDTH", defaultMaxWidth);
  const quality = positiveIntegerFromEnv("IMAGE_QUALITY", defaultQuality);

  const client = createPostgresClient(databaseUrl);
  const db = (await import("drizzle-orm/postgres-js")).drizzle(client, {
    schema
  });
  const uploader = createSharpImageUploader({ outputDir: uploadsDir });

  try {
    const rows = (await db
      .select({
        id: posts.id,
        title: posts.title,
        thumbnailUrl: posts.thumbnailUrl
      })
      .from(posts)
      .where(
        and(
          isNotNull(posts.thumbnailUrl),
          not(sql`${posts.thumbnailUrl} like 'http://localhost:%'`)
        )
      )
      .orderBy(posts.createdAt)) as ThumbnailRow[];

    console.log(`Found ${rows.length} thumbnails to process.`);

    let processed = 0;
    let failed = 0;

    for (const row of rows) {
      try {
        if (await isLocalUploadAtTargetWidth(row.thumbnailUrl, uploadsDir, maxWidth)) {
          console.log(`skipped ${row.id} ${row.title} -> already ${maxWidth}px wide`);
          continue;
        }

        const result = await uploader.uploadFromUrl(row.thumbnailUrl, {
          maxWidth,
          quality
        });

        await db
          .update(posts)
          .set({
            thumbnailUrl: result.secureUrl,
            updatedAt: new Date()
          })
          .where(sql`${posts.id} = ${row.id}`);

        processed += 1;
        console.log(`processed ${row.id} ${row.title} -> ${result.secureUrl}`);
      } catch (error) {
        failed += 1;
        console.error(
          `failed ${row.id} ${row.title}: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }

    console.log(`Thumbnail processing complete: ${processed} processed, ${failed} failed.`);
    if (failed > 0) {
      process.exitCode = 1;
    }
  } finally {
    await client.end();
  }
}

async function isLocalUploadAtTargetWidth(
  thumbnailUrl: string,
  uploadsDir: string,
  targetWidth: number
) {
  if (!thumbnailUrl.startsWith("/uploads/")) {
    return false;
  }

  const sharp = (await import("sharp")).default;
  const metadata = await sharp(path.join(uploadsDir, path.basename(thumbnailUrl))).metadata();
  return metadata.width === targetWidth;
}

function positiveIntegerFromEnv(name: string, fallback: number) {
  const value = process.env[name];
  if (!value) {
    return fallback;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be a positive integer.`);
  }

  return parsed;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
