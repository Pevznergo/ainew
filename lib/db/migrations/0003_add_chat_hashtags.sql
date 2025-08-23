-- Add hashtags column to Chat
ALTER TABLE "Chat"
ADD COLUMN IF NOT EXISTS "hashtags" varchar(64)[];

-- Optional GIN index to speed up array membership queries
CREATE INDEX IF NOT EXISTS chat_hashtags_gin_idx ON "Chat" USING GIN ("hashtags");
