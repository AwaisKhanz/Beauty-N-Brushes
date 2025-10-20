-- Remove unused embedding vectors that were hurting visual matching accuracy
-- Keeping only aiEmbedding (style-enriched, PRIMARY) and visualEmbedding (pure visual, backup)

-- Drop unused embedding columns
ALTER TABLE "ServiceMedia" DROP COLUMN IF EXISTS "styleEmbedding";
ALTER TABLE "ServiceMedia" DROP COLUMN IF EXISTS "semanticEmbedding";
ALTER TABLE "ServiceMedia" DROP COLUMN IF EXISTS "colorEmbedding";
ALTER TABLE "ServiceMedia" DROP COLUMN IF EXISTS "hybridEmbedding";

-- Add comment to remaining columns for clarity
COMMENT ON COLUMN "ServiceMedia"."aiEmbedding" IS 'PRIMARY embedding: Style-enriched (1408-dim, image + context, 98% accuracy)';
COMMENT ON COLUMN "ServiceMedia"."visualEmbedding" IS 'BACKUP embedding: Visual-only (1408-dim, pure pixel similarity)';

