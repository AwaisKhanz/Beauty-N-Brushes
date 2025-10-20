-- Remove refresh token fields from User table
ALTER TABLE "User" DROP COLUMN IF EXISTS "refreshTokenHash";
ALTER TABLE "User" DROP COLUMN IF EXISTS "refreshTokenExpiry";

