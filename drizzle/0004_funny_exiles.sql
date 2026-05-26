UPDATE "users" SET "name" = "username" WHERE "name" IS NULL AND "username" IS NOT NULL;--> statement-breakpoint
ALTER TABLE "users" DROP COLUMN "username";
