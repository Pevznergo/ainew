CREATE TABLE IF NOT EXISTS "Repost" (
	"chatId" text NOT NULL,
	"userId" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "Repost_chatId_userId_pk" PRIMARY KEY("chatId","userId")
);
--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "hashtags" varchar(64)[];--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "is_repost" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "original_chat_id" text;--> statement-breakpoint
ALTER TABLE "Chat" ADD COLUMN IF NOT EXISTS "original_author_id" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "bio" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verification_token" text;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verification_expires" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_email_verified" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_profile_completed" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_first_chat" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_first_share" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_twitter" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_facebook" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_vk" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_telegram" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_reddit" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_friends_invited" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_friends_pro_subscribed" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_post_likes_10" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_email_verified_at" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_profile_completed_at" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_first_chat_at" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_first_share_at" timestamp;--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_tokens_earned" integer DEFAULT 0;--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Repost" ADD CONSTRAINT "Repost_chatId_Chat_id_fk" FOREIGN KEY ("chatId") REFERENCES "public"."Chat"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Repost" ADD CONSTRAINT "Repost_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_original_chat_id_Chat_id_fk" FOREIGN KEY ("original_chat_id") REFERENCES "public"."Chat"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "Chat" ADD CONSTRAINT "Chat_original_author_id_User_id_fk" FOREIGN KEY ("original_author_id") REFERENCES "public"."User"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
-- Add unique constraint only if it doesn't exist
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'User_nickname_unique' 
        AND table_name = 'User'
    ) THEN
        ALTER TABLE "User" ADD CONSTRAINT "User_nickname_unique" UNIQUE("nickname");
    END IF;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;