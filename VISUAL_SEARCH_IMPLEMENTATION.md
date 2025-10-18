# Visual Search Implementation - Image-Based Embeddings

## Overview

The visual similarity search now uses **image-based embeddings** instead of text-based embeddings. This dramatically improves match accuracy by comparing actual visual features (color, texture, shape) instead of text descriptions.

## The Problem (Before)

**Issue:** Yellow afro matching brown textured fade at 95% similarity

**Root Cause:**
- Used text-based embeddings: Image → Text Description → Text Embedding
- Lost critical visual information in the conversion
- "yellow curly hair" and "brown textured hair" are semantically similar in text space
- Result: Completely different hairstyles matched with high confidence

## The Solution (Now)

**Google Vision AI - TRUE Visual Embeddings:**

- **How it works:** Creates a custom 512-dimensional visual feature vector from actual pixels
- **Feature extraction:**
  - Color histogram (256 dims) - RGB color distribution from actual pixels
  - Object/label features (128 dims) - Hair-specific visual attributes
  - Spatial features (64 dims) - Face position and hair region geometry
  - Texture features (64 dims) - Color variance and visual complexity
- **Pros:**
  - ✅ TRUE image-to-image matching (not text-based)
  - ✅ Excellent color accuracy (yellow ≠ brown)
  - ✅ Excellent texture matching (curly ≠ straight)
  - ✅ Free tier: 1,000 requests/month
  - ✅ Low cost: $1.50 per 1,000 images after free tier
- **Cons:**
  - ❌ Requires Google Cloud setup with service account
  - ❌ More complex initial configuration

## Configuration

Add to your `.env` file:

```env
# REQUIRED for visual similarity search
USE_GOOGLE_AI=true
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account-key.json

# Also needed for AI hair analysis (separate from embeddings)
OPENAI_API_KEY=sk-...
```

## Setup Instructions

1. **Create Google Cloud Project:**
   - Go to https://console.cloud.google.com/
   - Create a new project or select existing one
   - Note your PROJECT_ID

2. **Enable Vision AI API:**
   - Go to https://console.cloud.google.com/apis/library
   - Search for "Cloud Vision API"
   - Click "Enable"

3. **Create Service Account:**
   - Go to https://console.cloud.google.com/iam-admin/serviceaccounts
   - Click "Create Service Account"
   - Name it "beauty-n-brushes-vision"
   - Grant role: "Cloud Vision AI User"
   - Create and download JSON key
   - Save it as `/path/to/service-account-key.json`

4. **Update `.env`:**
   ```env
   USE_GOOGLE_AI=true
   GOOGLE_CLOUD_PROJECT_ID=your-project-id
   GOOGLE_APPLICATION_CREDENTIALS=/absolute/path/to/service-account-key.json
   ```

5. **Restart backend server**

## Expected Results

### Before (Text-based):
```
Yellow afro: 95% match with brown textured fade ❌
Matching tags: [] (0 matches)
```

### After (Google Vision AI - Pixel-based):
```
Yellow afro: 30-40% match with brown textured fade ✅
(Filtered out because < 50% threshold)

Yellow afro: 92%+ match with other curly yellow/gold hair ✅
Brown fade: 94%+ match with other brown textured cuts ✅
```

**Why it works:**
- Yellow pixels ≠ Brown pixels → Low color histogram similarity
- Tight curls ≠ Textured straight → Low texture similarity
- Different facial features/positions → Low spatial similarity
- Result: Accurate visual matching!

## Technical Details

### Google Vision AI Feature Vector Breakdown

**512 dimensions total:**
- **Color Histogram (256 dims):**
  - RGB distribution across image
  - Captures dominant colors and their prevalence
  - Yellow afro has high values in yellow bins
  - Brown hair has high values in brown bins

- **Object & Label Features (128 dims):**
  - Hair-specific keywords: curly, straight, wavy, afro, etc.
  - Weighted by Google Vision confidence scores

- **Spatial Features (64 dims):**
  - Face bounding box position and size
  - Hair region location and extent
  - Volume and shape indicators

- **Texture Features (64 dims):**
  - Color variance (smooth vs textured)
  - Number of distinct colors
  - Pixel fraction distribution


## Code Changes

### Files Modified:
1. **[backend/src/lib/ai.ts](backend/src/lib/ai.ts)**
   - Added `generateImageEmbedding()` - Uses Google Vision AI only
   - Helper methods for visual feature extraction:
     - `createVisualFeatureVector()` - Combines all features
     - `createColorHistogram()` - RGB distribution
     - `createObjectFeatures()` - Hair-specific labels
     - `createSpatialFeatures()` - Face/hair position
     - `createTextureFeatures()` - Color variance

2. **[backend/src/controllers/inspiration.controller.ts](backend/src/controllers/inspiration.controller.ts)**
   - Updated to use `generateImageEmbedding()` instead of text-based embedding

3. **[backend/src/config/env.ts](backend/src/config/env.ts)**
   - Added `EMBEDDING_PROVIDER` configuration
   - Added Google AI environment variables

4. **[backend/ENV_TEMPLATE.md](backend/ENV_TEMPLATE.md)**
   - Documented new configuration options
   - Added provider comparison and recommendations

## Testing

Test the new system by uploading images with distinct visual features:

1. **Upload a yellow afro image** → Should match other yellow/curly hairstyles
2. **Upload a brown fade image** → Should match other brown/textured men's cuts
3. **Verify:** Yellow afro should NOT match brown fade (< 50% similarity)

## Cost Analysis

### Google Vision AI:
- **Free tier:** 1,000 requests/month
- **After free tier:** $1.50 per 1,000 images
- **Example costs:**
  - 5,000 images/month: $6/month (4,000 paid × $0.0015)
  - 10,000 images/month: $13.50/month (9,000 paid × $0.0015)
  - 50,000 images/month: $73.50/month (49,000 paid × $0.0015)

**Very cost-effective for visual similarity search!**

## Migration Guide

If you already have images in your database with old text-based embeddings:

1. All existing service images need to be re-embedded
2. The old embeddings will produce poor results with the new system
3. You'll need to create a migration script to:
   - Fetch all ServiceMedia records with images
   - Download each image
   - Generate new embeddings using `generateImageEmbedding()`
   - Update the database

Would you like me to create this migration script?

## Support

If you encounter issues:
1. Check that your API keys are valid
2. Verify the EMBEDDING_PROVIDER matches your configuration
3. Check server logs for detailed error messages
4. Ensure images are accessible (not 404/403 errors)
