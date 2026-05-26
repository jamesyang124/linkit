CREATE EXTENSION IF NOT EXISTS ltree;

ALTER TABLE "users"
  ADD COLUMN "username" text UNIQUE;

ALTER TABLE "comments"
  ADD COLUMN "path" ltree,
  ADD COLUMN "reply_to_user_id" uuid REFERENCES "users"("id") ON DELETE SET NULL;

-- Backfill: existing comments become root nodes (path = uuid without hyphens)
UPDATE "comments" SET "path" = replace(id::text, '-', '')::ltree;

ALTER TABLE "comments" ALTER COLUMN "path" SET NOT NULL;

CREATE INDEX "comments_path_gist_idx" ON "comments" USING gist ("path");
CREATE INDEX "comments_post_id_path_idx" ON "comments" ("post_id", "path");
