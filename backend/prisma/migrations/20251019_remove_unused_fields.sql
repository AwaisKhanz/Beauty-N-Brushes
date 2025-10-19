-- ============================================
-- Migration: Remove Unused Hair Analysis Fields
-- Created: 2025-10-19
-- Purpose: Remove hairType, styleType, colorInfo, complexityLevel from ServiceMedia
-- Reason: These fields are redundant - we use aiTags instead for all categorization
-- ============================================

-- Remove unused columns from ServiceMedia table
ALTER TABLE "ServiceMedia"
  DROP COLUMN IF EXISTS "hairType",
  DROP COLUMN IF EXISTS "styleType",
  DROP COLUMN IF EXISTS "colorInfo",
  DROP COLUMN IF EXISTS "complexityLevel";

-- ============================================
-- NOTES:
-- ============================================
-- These fields were replaced by the more flexible aiTags array
-- which provides better categorization and search capabilities
-- ============================================

