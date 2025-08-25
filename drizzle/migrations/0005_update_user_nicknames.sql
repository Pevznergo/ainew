-- Update existing user nicknames to use user-{first9chars} format instead of email
-- This migration converts all existing email-based nicknames to the new format

UPDATE "User" 
SET "nickname" = 'user-' || SUBSTRING("id", 1, 9)
WHERE "nickname" IS NOT NULL 
  AND "nickname" != 'user-' || SUBSTRING("id", 1, 9)
  AND ("nickname" = "email" OR "nickname" LIKE '%@%');