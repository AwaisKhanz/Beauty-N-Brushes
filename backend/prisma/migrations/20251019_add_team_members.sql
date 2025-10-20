-- Migration: Add Team Member Support for Salon Accounts
-- Date: 2025-10-19
-- Description: Adds tables for salon team member management

-- Create SalonTeamMember table
CREATE TABLE IF NOT EXISTS "SalonTeamMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "salonId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'stylist',
    "status" TEXT NOT NULL DEFAULT 'active',
    "displayName" TEXT NOT NULL,
    "specializations" TEXT[],
    "bio" TEXT,
    "profilePhotoUrl" TEXT,
    "commissionRate" DECIMAL(5,2),
    "canManageBookings" BOOLEAN NOT NULL DEFAULT true,
    "canManageServices" BOOLEAN NOT NULL DEFAULT true,
    "canViewFinances" BOOLEAN NOT NULL DEFAULT false,
    "invitedEmail" TEXT,
    "invitedAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "SalonTeamMember_salonId_fkey" FOREIGN KEY ("salonId") REFERENCES "ProviderProfile" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "SalonTeamMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create unique index on salonId + userId
CREATE UNIQUE INDEX IF NOT EXISTS "SalonTeamMember_salonId_userId_key" ON "SalonTeamMember"("salonId", "userId");

-- Create index on salonId for faster lookups
CREATE INDEX IF NOT EXISTS "SalonTeamMember_salonId_idx" ON "SalonTeamMember"("salonId");

-- Create index on userId
CREATE INDEX IF NOT EXISTS "SalonTeamMember_userId_idx" ON "SalonTeamMember"("userId");

-- Create index on status
CREATE INDEX IF NOT EXISTS "SalonTeamMember_status_idx" ON "SalonTeamMember"("status");

-- Add teamMemberLimit to ProviderProfile if not exists
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "teamMemberLimit" INTEGER DEFAULT 10;

-- Add Google Calendar fields to ProviderProfile if not exists
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "googleCalendarConnected" BOOLEAN DEFAULT false;
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "googleAccessToken" TEXT;
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "googleRefreshToken" TEXT;
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "googleTokenExpiresAt" TIMESTAMP(3);
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "googleEmail" TEXT;
ALTER TABLE "ProviderProfile" ADD COLUMN IF NOT EXISTS "googleCalendarLastSync" TIMESTAMP(3);

-- Add team member assignment fields to Booking if not exists
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "assignedTeamMemberId" TEXT;
ALTER TABLE "Booking" ADD COLUMN IF NOT EXISTS "anyAvailableStylist" BOOLEAN DEFAULT false;

-- Add foreign key constraint for assignedTeamMemberId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Booking_assignedTeamMemberId_fkey'
    ) THEN
        ALTER TABLE "Booking" ADD CONSTRAINT "Booking_assignedTeamMemberId_fkey" 
        FOREIGN KEY ("assignedTeamMemberId") REFERENCES "SalonTeamMember"("id") ON DELETE SET NULL ON UPDATE CASCADE;
    END IF;
END $$;

-- Create index on assignedTeamMemberId for faster lookups
CREATE INDEX IF NOT EXISTS "Booking_assignedTeamMemberId_idx" ON "Booking"("assignedTeamMemberId");

