import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcryptjs";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";
import { eq } from "drizzle-orm";

import * as schema from "@/db/schema";

const { comments, posts, users } = schema;

export const TEST_USER_ID = "00000000-0000-0000-0000-000000000001";
export const TEST_USER_EMAIL = "e2e@linkit.dev";
export const TEST_USER_PASSWORD = "password123";
export const TEST_POST_ID = "00000000-0000-0000-0000-000000000002";
export const TEST_POST_LINK = "https://example.com/e2e-test-article";
export const TEST_POST_THUMBNAIL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 320 400'%3E%3Crect width='320' height='400' fill='%23d24a27'/%3E%3Cpath d='M40 320h240V80H40z' fill='%23f5f0e8'/%3E%3Ctext x='160' y='222' text-anchor='middle' font-size='54' font-family='serif' fill='%23161616'%3ELK%3C/text%3E%3C/svg%3E";
export const TEST_GALLERY_POST_COUNT = 15;

export default async function globalSetup() {
  const databaseUrl = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("TEST_DATABASE_URL is required for E2E tests");
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const migrationsFolder = path.resolve(__dirname, "../../drizzle");

  const sql = postgres(databaseUrl, { max: 1, prepare: false });
  const db = drizzle(sql, { schema });

  await migrate(db, { migrationsFolder });

  // Clean up from any previous run. Tests create comments and posts owned by
  // the seeded user, and posts do not cascade when a user is deleted.
  await db.delete(comments).where(eq(comments.userId, TEST_USER_ID));
  await db.delete(posts).where(eq(posts.userId, TEST_USER_ID));
  await db.delete(users).where(eq(users.email, TEST_USER_EMAIL));

  const passwordHash = await bcrypt.hash(TEST_USER_PASSWORD, 10);
  await db.insert(users).values({
    id: TEST_USER_ID,
    email: TEST_USER_EMAIL,
    name: "E2E Test User",
    passwordHash,
  });

  await db.insert(posts).values({
    id: TEST_POST_ID,
    userId: TEST_USER_ID,
    title: "E2E Test Article",
    body: "A seeded post for E2E smoke tests.",
    link: TEST_POST_LINK,
    thumbnailUrl: TEST_POST_THUMBNAIL,
    providerName: "example.com",
    clickCount: 0,
    commentsCount: 0,
  });

  const galleryPosts = Array.from({ length: TEST_GALLERY_POST_COUNT }, (_, index) => {
    const number = index + 10;
    return {
      id: `00000000-0000-0000-0000-${String(number).padStart(12, "0")}`,
      userId: TEST_USER_ID,
      title: `E2E Gallery Article ${index + 1}`,
      body: "A seeded gallery post for keyset pagination tests.",
      link: `https://example.com/e2e-gallery-seed-${index + 1}`,
      thumbnailUrl: TEST_POST_THUMBNAIL,
      providerName: "example.com",
      clickCount: 0,
      commentsCount: 0,
      createdAt: new Date(Date.UTC(2026, 4, 24, 7, 59 - index, 0))
    };
  });
  await db.insert(posts).values(galleryPosts);

  await sql.end();
  await revalidatePublicFeed();
}

async function revalidatePublicFeed() {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  try {
    await fetch("https://localhost:8443/api/revalidate", {
      method: "POST",
      headers: {
        "x-linkit-revalidate-secret": "development-revalidate-secret-change-me"
      }
    });
  } catch {
    // Playwright may run this before the Caddy web server is available in fresh
    // environments. Mutating tests still revalidate through server actions.
  }
}
