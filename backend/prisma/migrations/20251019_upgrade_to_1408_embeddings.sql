-- ============================================
-- Migration: Upgrade AI Embeddings to 1408 Dimensions + ANN Index
-- Created: 2025-10-19
-- Purpose:
--   1. Upgrade vector embeddings from 512 to 1408 dimensions
--   2. Add IVFFlat ANN index for faster similarity search
--   3. Improve matching quality with high-dimensional embeddings
-- ============================================

-- Step 1: Ensure pgvector extension is enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Update ServiceMedia aiEmbedding column to 1408 dimensions
-- We need to drop and recreate the column because vector dimensions can't be altered
ALTER TABLE "ServiceMedia"
  DROP COLUMN IF EXISTS "aiEmbedding";

ALTER TABLE "ServiceMedia"
  ADD COLUMN "aiEmbedding" vector(1408) DEFAULT '[0]'::vector;

-- Step 3: Update InspirationImage aiEmbedding column to 1408 dimensions
ALTER TABLE "InspirationImage"
  DROP COLUMN IF EXISTS "aiEmbedding";

ALTER TABLE "InspirationImage"
  ADD COLUMN "aiEmbedding" vector(1408) DEFAULT '[0]'::vector;

-- Step 4: Add IVFFlat indexes for Approximate Nearest Neighbor search
-- These indexes significantly improve query performance for large datasets
-- The 'lists' parameter controls the number of clusters (typically sqrt(rows))
-- We'll use 100 lists as a good starting point

-- Index for ServiceMedia vector similarity search
CREATE INDEX IF NOT EXISTS "ServiceMedia_aiEmbedding_ivfflat_idx"
  ON "ServiceMedia"
  USING ivfflat ("aiEmbedding" vector_cosine_ops)
  WITH (lists = 100);

-- Index for InspirationImage vector similarity search
CREATE INDEX IF NOT EXISTS "InspirationImage_aiEmbedding_ivfflat_idx"
  ON "InspirationImage"
  USING ivfflat ("aiEmbedding" vector_cosine_ops)
  WITH (lists = 100);

-- Step 5: Add index on processing status for efficient filtering
CREATE INDEX IF NOT EXISTS "ServiceMedia_processingStatus_idx"
  ON "ServiceMedia"("processingStatus");

-- ============================================
-- NOTES:
-- ============================================
-- 1. IVFFlat Index Configuration:
--    - 'lists = 100' is optimal for up to 10,000 images
--    - For larger datasets, use: sqrt(total_rows)
--    - For 100k images: lists = 316
--    - For 1M images: lists = 1000
--
-- 2. Query Performance:
--    - IVFFlat provides approximate results (99%+ accuracy)
--    - Up to 100x faster than brute-force search
--    - Trade-off: slight accuracy loss for major speed gain
--
-- 3. Index Maintenance:
--    - Indexes are automatically maintained on INSERT/UPDATE
--    - Rebuild index if data distribution changes significantly:
--      REINDEX INDEX "ServiceMedia_aiEmbedding_ivfflat_idx";
--
-- 4. After Migration:
--    - All existing embeddings will be reset to zeros
--    - Run: npm run regenerate-embeddings
--    - This will regenerate all embeddings at 1408 dimensions
-- ============================================
