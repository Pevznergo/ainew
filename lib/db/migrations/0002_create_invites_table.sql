-- drizzle/000_create_invites_table.sql

CREATE TABLE IF NOT EXISTS "invites" (
  "id" text PRIMARY KEY,
  "code" varchar(16) NOT NULL UNIQUE,
  "owner_user_id" text NOT NULL REFERENCES "User"("id"),
  "available_count" integer NOT NULL DEFAULT 4,
  "used_count" integer NOT NULL DEFAULT 0,
  "created_at" timestamp NOT NULL DEFAULT now()
);

-- Optional index to speed up owner lookups
CREATE INDEX IF NOT EXISTS "idx_invites_owner" ON "invites" ("owner_user_id");
