-- Migrate comments from ltree path model to adjacency list.

-- Add new adjacency list columns
ALTER TABLE "comments"
  ADD COLUMN "parent_id" uuid REFERENCES "comments"("id") ON DELETE SET NULL,
  ADD COLUMN "reply_to_user_name" text,
  ADD COLUMN "reply_count" integer NOT NULL DEFAULT 0;

-- Backfill parent_id from ltree path.
-- Root comments have path with no dots (single label = 32-char hex of their UUID).
-- Reply comments have path like "aabb....xxyy..." — parent label is everything before the last dot.
-- Label → UUID: reinsert hyphens at positions 8, 12, 16, 20.
UPDATE "comments"
SET "parent_id" = (
  SELECT c2.id
  FROM "comments" c2
  WHERE replace(c2.id::text, '-', '') =
        substring("comments"."path"::text
                  FROM 1
                  FOR length("comments"."path"::text) - 33)
  LIMIT 1
)
WHERE "path"::text LIKE '%.%';

-- Backfill reply_to_user_name from reply_to_user_id join
UPDATE "comments" c
SET "reply_to_user_name" = u.username
FROM "users" u
WHERE c.reply_to_user_id = u.id
  AND u.username IS NOT NULL;

-- Backfill reply_count: count direct children per comment
UPDATE "comments" parent
SET "reply_count" = (
  SELECT count(*)::int FROM "comments" child
  WHERE child.parent_id = parent.id
);

-- Drop ltree columns and extension
ALTER TABLE "comments"
  DROP COLUMN "path",
  DROP COLUMN "reply_to_user_id";

DROP INDEX IF EXISTS "comments_path_gist_idx";
DROP INDEX IF EXISTS "comments_post_id_path_idx";

DROP EXTENSION IF EXISTS ltree;

-- Add btree indexes for adjacency list queries
CREATE INDEX "comments_post_parent_idx" ON "comments" ("post_id", "parent_id");
CREATE INDEX "comments_parent_id_idx" ON "comments" ("parent_id");
