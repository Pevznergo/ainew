-- Add email verification and task system fields to User table
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verified" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verification_token" text;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "email_verification_expires" timestamp;

-- Task completion tracking
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_email_verified" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_profile_completed" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_first_chat" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_first_share" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_twitter" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_facebook" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_vk" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_social_telegram" boolean DEFAULT false;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_friends_invited" integer DEFAULT 0;

-- Task completion timestamps for analytics
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_email_verified_at" timestamp;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_profile_completed_at" timestamp;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_first_chat_at" timestamp;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_first_share_at" timestamp;

-- Total tokens earned from tasks
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "task_tokens_earned" integer DEFAULT 0;