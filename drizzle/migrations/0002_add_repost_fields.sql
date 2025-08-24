-- Add repost related fields to Chat table
ALTER TABLE "Chat" 
ADD COLUMN IF NOT EXISTS "is_repost" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS "original_chat_id" TEXT REFERENCES "Chat"("id") ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS "original_author_id" TEXT REFERENCES "User"("id") ON DELETE SET NULL;

-- Create index for better performance on repost lookups
CREATE INDEX IF NOT EXISTS "idx_chat_is_repost" ON "Chat" ("is_repost");
CREATE INDEX IF NOT EXISTS "idx_chat_original_chat" ON "Chat" ("original_chat_id");
CREATE INDEX IF NOT EXISTS "idx_chat_original_author" ON "Chat" ("original_author_id");
