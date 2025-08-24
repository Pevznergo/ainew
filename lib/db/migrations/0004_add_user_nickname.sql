-- Add nickname column to User and backfill
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" text UNIQUE;

-- Backfill existing rows where nickname is null
UPDATE "User" SET "nickname" = "email" WHERE "nickname" IS NULL;
