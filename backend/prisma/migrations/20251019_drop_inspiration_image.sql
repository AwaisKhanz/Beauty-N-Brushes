-- Drop InspirationImage table (moved to ephemeral search - no storage)
-- Visual search now works by analyzing uploaded images on-the-fly
-- No need to store inspiration images in database

DROP TABLE IF EXISTS "InspirationImage";

