-- Migration: Add Performance Indexes for Scalability
-- Date: 2025-10-19
-- Description: Add recommended indexes for improved query performance at scale

-- ================================
-- Provider Profile Indexes
-- ================================

-- Payment provider filtering (for regional queries)
CREATE INDEX IF NOT EXISTS "ProviderProfile_paymentProvider_idx" ON "ProviderProfile"("paymentProvider");

-- Region code filtering (for regional analytics)
CREATE INDEX IF NOT EXISTS "ProviderProfile_regionCode_idx" ON "ProviderProfile"("regionCode");

-- Subscription status filtering (for billing queries)
CREATE INDEX IF NOT EXISTS "ProviderProfile_subscriptionStatus_idx" ON "ProviderProfile"("subscriptionStatus");

-- Salon type filtering (for salon-specific queries)
CREATE INDEX IF NOT EXISTS "ProviderProfile_isSalon_idx" ON "ProviderProfile"("isSalon");

-- ================================
-- Team Member Indexes
-- ================================

-- Pending invitation lookups
CREATE INDEX IF NOT EXISTS "SalonTeamMember_invitedEmail_idx" ON "SalonTeamMember"("invitedEmail") WHERE "status" = 'pending';

-- ================================
-- Booking Analytics Indexes
-- ================================

-- Provider booking status queries (for dashboard)
CREATE INDEX IF NOT EXISTS "Booking_providerId_bookingStatus_idx" ON "Booking"("providerId", "bookingStatus");

-- Team member booking status queries (for team analytics)
CREATE INDEX IF NOT EXISTS "Booking_assignedTeamMemberId_bookingStatus_idx" ON "Booking"("assignedTeamMemberId", "bookingStatus") WHERE "assignedTeamMemberId" IS NOT NULL;

-- Date range queries for analytics
CREATE INDEX IF NOT EXISTS "Booking_providerId_appointmentDate_idx" ON "Booking"("providerId", "appointmentDate");

-- Team member date range queries
CREATE INDEX IF NOT EXISTS "Booking_assignedTeamMemberId_appointmentDate_idx" ON "Booking"("assignedTeamMemberId", "appointmentDate") WHERE "assignedTeamMemberId" IS NOT NULL;

-- ================================
-- Payment Transaction Indexes
-- ================================

-- Payment provider filtering
CREATE INDEX IF NOT EXISTS "Booking_paymentProvider_paymentStatus_idx" ON "Booking"("paymentProvider", "paymentStatus");

-- ================================
-- Composite Indexes for Common Queries
-- ================================

-- Active salons with specific subscription status
CREATE INDEX IF NOT EXISTS "ProviderProfile_isSalon_subscriptionStatus_idx" ON "ProviderProfile"("isSalon", "subscriptionStatus");

-- Regional subscription filtering
CREATE INDEX IF NOT EXISTS "ProviderProfile_regionCode_subscriptionTier_idx" ON "ProviderProfile"("regionCode", "subscriptionTier");

-- ================================
-- Analytics
-- ================================

COMMENT ON INDEX "Booking_assignedTeamMemberId_bookingStatus_idx" IS 'Optimizes team member analytics queries';
COMMENT ON INDEX "Booking_providerId_bookingStatus_idx" IS 'Optimizes provider dashboard queries';
COMMENT ON INDEX "ProviderProfile_isSalon_idx" IS 'Optimizes salon-only feature checks';

