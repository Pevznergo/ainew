CREATE TABLE IF NOT EXISTS "Demo" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"logo_name" text NOT NULL,
	"logo_url" text,
	"background_color" text,
	"typewriterText1" text,
	"typewriterText2" text,
	"typewriterText3" text,
	"typewriterText4" text,
	"hero_title" text,
	"hero_subtitle" text,
	"features_title" text,
	"features_subtitle" text,
	"features1_title" text,
	"features1_h3" text,
	"features1_p" text,
	"models_title" text,
	"models_subtitle" text,
	"pricing_title" text,
	"pricing_subtitle" text,
	"footer_text" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Demo_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "invites" (
	"id" text PRIMARY KEY NOT NULL,
	"code" varchar(16) NOT NULL,
	"owner_user_id" text NOT NULL,
	"available_count" integer DEFAULT 4 NOT NULL,
	"used_count" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "invites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
ALTER TABLE "Vote_v2" DROP CONSTRAINT IF EXISTS "Vote_v2_chatId_messageId_pk";--> statement-breakpoint
ALTER TABLE "Chat" ALTER COLUMN "visibility" SET DEFAULT 'public';--> statement-breakpoint
-- 1) Add userId column (nullable for now to allow backfill)
ALTER TABLE "Vote_v2" ADD COLUMN IF NOT EXISTS "userId" text;--> statement-breakpoint
-- 2) Backfill userId from chat owner to preserve existing votes
UPDATE "Vote_v2" v
SET "userId" = c."userId"
FROM "Chat" c
WHERE v."chatId" = c."id" AND v."userId" IS NULL;--> statement-breakpoint
-- 3) Deduplicate rows that collapse to the same (chatId,userId)
DELETE FROM "Vote_v2" v
USING "Vote_v2" v2
WHERE v."chatId" = v2."chatId"
  AND v."userId" = v2."userId"
  AND v.ctid < v2.ctid;--> statement-breakpoint
-- 4) Enforce NOT NULL after backfill
ALTER TABLE "Vote_v2" ALTER COLUMN "userId" SET NOT NULL;--> statement-breakpoint
-- 5) Add PK on (chatId, userId)
ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_chatId_userId_pk" PRIMARY KEY("chatId","userId");--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "invites" ADD CONSTRAINT "invites_owner_user_id_User_id_fk" FOREIGN KEY ("owner_user_id") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Vote_v2" ADD CONSTRAINT "Vote_v2_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
