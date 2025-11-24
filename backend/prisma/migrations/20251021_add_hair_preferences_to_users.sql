-- Add hair preference fields to User table
-- Required for client profile feature (Requirements C.4, Line 505-507)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hairType" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hairTexture" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "hairPreferences" TEXT;

