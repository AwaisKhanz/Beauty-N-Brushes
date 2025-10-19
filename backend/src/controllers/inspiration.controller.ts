import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { aiService } from '../lib/ai';
import type { AuthRequest } from '../types';
import type {
  UploadInspirationResponse,
  MatchInspirationResponse,
  GetInspirationsResponse,
  DeleteInspirationResponse,
} from '../../../shared-types';

/**
 * ============================================
 * PURE VECTOR SIMILARITY MATCHING
 * ============================================
 *
 * REMOVED: isValidBeautyInspirationImage() and calculateSemanticRelevance()
 *
 * We now use PURE VECTOR SIMILARITY matching - NO tag-based filtering
 * User feedback: "I complete want vector matching not these tag, they are creating issue"
 *
 * The system now relies entirely on:
 * - 1408-dimensional multimodal embeddings (image + text context)
 * - Cosine distance vector similarity search
 * - Non-linear perception-based scoring
 * - IVFFlat ANN indexing for performance
 */

/**
 * Upload and analyze inspiration image
 */
export async function uploadInspiration(
  req: AuthRequest,
  res: Response<UploadInspirationResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { imageUrl, sourceUrl, notes } = req.body;

    if (!imageUrl) {
      throw new AppError(400, 'Image URL required');
    }

    // Analyze inspiration image with AI
    console.log('Analyzing inspiration image:', imageUrl);

    // Fetch the image from local storage
    // This works for localhost URLs that AI APIs can't access directly
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);

    // Analyze image using base64 (works with localhost URLs)
    const base64Image = imageBuffer.toString('base64');
    const analysis = await aiService.analyzeImageFromBase64(base64Image);

    // Build text context from AI analysis for multimodal embedding
    const inspirationContext = [
      ...analysis.tags.slice(0, 5), // Top 5 tags
      notes, // User's notes if provided
    ]
      .filter(Boolean)
      .join(' ');

    // Generate MULTIMODAL embedding (image + text context)
    // This combines visual features + semantic meaning for better matching
    // Uses 1408 dimensions for maximum detail
    const embedding = await aiService.generateMultimodalEmbedding(imageBuffer, inspirationContext);
    const embeddingStr = `[${embedding.join(',')}]`;

    console.log(`✅ Generated ${embedding.length}-dim MULTIMODAL embedding`);
    console.log(`   Context: "${inspirationContext.substring(0, 80)}..."`);

    // Store inspiration using raw SQL for vector support
    const result = await prisma.$queryRaw<Array<{ id: string }>>`
      INSERT INTO "InspirationImage" (
        "id",
        "clientId",
        "imageUrl",
        "thumbnailUrl",
        "sourceUrl",
        "aiTags",
        "aiEmbedding",
        "styleDescription",
        "colorPalette",
        "notes",
        "isFavorite",
        "createdAt"
      ) VALUES (
        gen_random_uuid(),
        ${userId}::uuid,
        ${imageUrl}::text,
        ${imageUrl}::text,
        ${sourceUrl || null}::text,
        ${analysis.tags}::text[],
        ${embeddingStr}::vector,
        ${
          analysis.dominantColors ? JSON.stringify({ colors: analysis.dominantColors }) : null
        }::jsonb,
        ${notes || null}::text,
        false::boolean,
        NOW()
      )
      RETURNING id::text
    `;

    const inspirationId = result[0]?.id;

    // Fetch the created inspiration using raw SQL
    const inspirations = await prisma.$queryRaw<
      Array<{
        id: string;
        clientId: string;
        imageUrl: string;
        thumbnailUrl: string | null;
        sourceUrl: string | null;
        aiTags: string[];
        styleDescription: string | null;
        colorPalette: any;
        notes: string | null;
        isFavorite: boolean;
        createdAt: Date;
      }>
    >`
      SELECT
        id::text,
        "clientId"::text,
        "imageUrl",
        "thumbnailUrl",
        "sourceUrl",
        "aiTags",
        "styleDescription",
        "colorPalette",
        "notes",
        "isFavorite",
        "createdAt"
      FROM "InspirationImage"
      WHERE "id"::text = ${inspirationId}
    `;

    const inspiration = inspirations[0];

    if (!inspiration) {
      throw new AppError(500, 'Failed to create inspiration');
    }

    sendSuccess<UploadInspirationResponse>(
      res,
      {
        message: 'Inspiration analyzed successfully',
        inspiration: inspiration as any,
        analysis: {
          tags: analysis.tags,
          dominantColors: analysis.dominantColors,
        },
      },
      201
    );
  } catch (error) {
    console.error('Upload inspiration error:', error);
    next(error);
  }
}

/**
 * Match inspiration to provider services
 */
export async function matchInspiration(
  req: AuthRequest,
  res: Response<MatchInspirationResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const { inspirationId } = req.params;
    const { location, maxResults = 20 } = req.body;

    if (!inspirationId) {
      throw new AppError(400, 'Inspiration ID required');
    }

    // Get inspiration with embedding using raw SQL
    const inspirations = await prisma.$queryRaw<
      Array<{
        id: string;
        clientId: string;
        imageUrl: string;
        aiTags: string[];
        aiEmbedding: string;
      }>
    >`
      SELECT "id", "clientId", "imageUrl", "aiTags", "aiEmbedding"::text as "aiEmbedding"
      FROM "InspirationImage"
      WHERE "id"::text = ${inspirationId}
    `;

    const inspiration = inspirations[0];

    if (!inspiration) {
      throw new AppError(404, 'Inspiration not found');
    }

    // Vector similarity search using COSINE DISTANCE
    // Google's multimodal embeddings are NORMALIZED, so cosine distance is optimal
    //
    // Distance metrics:
    // - <=> (cosine distance): Range 0-2, where 0 = identical, 2 = opposite
    // - <#> (negative inner product): For normalized vectors, equivalent to cosine
    // - <-> (L2 distance): Euclidean distance, not recommended for normalized embeddings
    //
    // Google best practice: Use cosine distance for multimodal embeddings
    const baseQuery = Prisma.sql`
      SELECT
        sm."id"::text as media_id,
        sm."fileUrl" as media_url,
        sm."thumbnailUrl" as thumbnail_url,
        s."id"::text as service_id,
        s."title" as service_title,
        s."priceMin" as service_price_min,
        s."currency" as service_currency,
        p."id"::text as provider_id,
        p."businessName" as provider_business_name,
        p."slug" as provider_slug,
        p."logoUrl" as provider_logo_url,
        p."city" as provider_city,
        p."state" as provider_state,
        (sm."aiEmbedding" <=> ${inspiration.aiEmbedding}::vector) AS distance,
        sm."aiTags" as ai_tags
      FROM "ServiceMedia" sm
      JOIN "Service" s ON sm."serviceId" = s.id
      JOIN "ProviderProfile" p ON s."providerId" = p.id
      WHERE sm."aiEmbedding" IS NOT NULL
        AND s."active" = true
        AND p."profileCompleted" = true
    `;

    const locationCondition = location?.city
      ? Prisma.sql` AND p."city" = ${location.city}`
      : Prisma.empty;

    const orderAndLimit = Prisma.sql`
      ORDER BY distance ASC
      LIMIT ${maxResults}
    `;

    const matches = await prisma.$queryRaw<
      Array<{
        media_id: string;
        media_url: string;
        thumbnail_url: string;
        service_id: string;
        service_title: string;
        service_price_min: number;
        service_currency: string;
        provider_id: string;
        provider_business_name: string;
        provider_slug: string;
        provider_logo_url: string | null;
        provider_city: string;
        provider_state: string;
        distance: number;
        ai_tags: string[];
      }>
    >(Prisma.join([baseQuery, locationCondition, orderAndLimit], ''));

    // Get inspiration tags for display purposes only
    const inspirationTags = inspiration.aiTags || [];

    console.log('\n🎯 Matching Debug:');
    console.log('   Inspiration tags:', inspirationTags.slice(0, 10));
    console.log('   Raw matches found:', matches.length);

    // Transform matches - PURE VECTOR SIMILARITY with realistic scoring
    const transformedMatches = matches
      .map((match) => {
        // Convert cosine distance to similarity
        const cosineSimilarity = 1 - match.distance;

        // Realistic scoring algorithm
        // Based on research: cosine similarity > 0.95 = very similar images
        // We use a non-linear scale for more realistic perception
        let matchScore: number;

        if (cosineSimilarity >= 0.98) {
          // 98-100% similarity = Nearly identical (score: 95-100)
          matchScore = 95 + (cosineSimilarity - 0.98) * 250;
        } else if (cosineSimilarity >= 0.9) {
          // 90-98% similarity = Very similar (score: 85-95)
          matchScore = 85 + (cosineSimilarity - 0.9) * 125;
        } else if (cosineSimilarity >= 0.8) {
          // 80-90% similarity = Similar (score: 70-85)
          matchScore = 70 + (cosineSimilarity - 0.8) * 150;
        } else if (cosineSimilarity >= 0.7) {
          // 70-80% similarity = Somewhat similar (score: 55-70)
          matchScore = 55 + (cosineSimilarity - 0.7) * 150;
        } else if (cosineSimilarity >= 0.6) {
          // 60-70% similarity = Loosely related (score: 40-55)
          matchScore = 40 + (cosineSimilarity - 0.6) * 150;
        } else {
          // < 60% similarity = Low match (score: 0-40)
          matchScore = Math.max(0, cosineSimilarity * 66.7);
        }

        matchScore = Math.round(Math.min(100, Math.max(0, matchScore)));

        // Find matching tags for display purposes only
        const serviceTags = match.ai_tags || [];
        const matchingTags = inspirationTags.filter((tag: string) => serviceTags.includes(tag));

        // Debug first match only
        if (match === matches[0]) {
          console.log('\n   📊 First Match Details:');
          console.log('      Service tags:', serviceTags.slice(0, 10));
          console.log('      Cosine similarity:', Math.round(cosineSimilarity * 1000) / 1000);
          console.log('      Match score:', matchScore);
          console.log('      Distance:', match.distance);
        }

        return {
          mediaId: match.media_id,
          mediaUrl: match.media_url,
          thumbnailUrl: match.thumbnail_url,
          serviceId: match.service_id,
          serviceTitle: match.service_title,
          servicePriceMin: Number(match.service_price_min),
          serviceCurrency: match.service_currency,
          providerId: match.provider_id,
          providerBusinessName: match.provider_business_name,
          providerSlug: match.provider_slug,
          providerLogoUrl: match.provider_logo_url || undefined,
          providerCity: match.provider_city,
          providerState: match.provider_state,
          matchScore: matchScore, // Realistic similarity score
          distance: match.distance, // Raw distance for debugging
          cosineSimilarity: Math.round(cosineSimilarity * 1000) / 1000, // Similarity for debugging
          matchingTags: matchingTags, // Matching tags for display only
          aiTags: match.ai_tags, // All AI tags for display
        };
      })
      // Filter out low-quality matches (< 40% match score)
      .filter((match) => match.matchScore >= 40);

    console.log('   ✅ Matches after filtering:', transformedMatches.length);
    console.log(
      '   Top 3 scores:',
      transformedMatches.slice(0, 3).map((m) => `${m.matchScore}%`)
    );

    sendSuccess<MatchInspirationResponse>(res, {
      message: 'Matches found',
      matches: transformedMatches,
      totalMatches: transformedMatches.length,
    });
  } catch (error) {
    console.error('Match inspiration error:', error);
    next(error);
  }
}

/**
 * Get all inspirations for current user
 */
export async function getInspirations(
  req: AuthRequest,
  res: Response<GetInspirationsResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get inspirations using raw SQL
    const inspirations = await prisma.$queryRaw<
      Array<{
        id: string;
        clientId: string;
        imageUrl: string;
        thumbnailUrl: string | null;
        sourceUrl: string | null;
        aiTags: string[];
        styleDescription: string | null;
        colorPalette: any;
        notes: string | null;
        isFavorite: boolean;
        createdAt: Date;
      }>
    >`
      SELECT * FROM "InspirationImage" 
      WHERE "clientId" = ${userId}::uuid
      ORDER BY "createdAt" DESC
    `;

    sendSuccess<GetInspirationsResponse>(res, {
      message: 'Inspirations retrieved',
      inspirations: inspirations as any,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete inspiration
 */
export async function deleteInspiration(
  req: AuthRequest,
  res: Response<DeleteInspirationResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { inspirationId } = req.params;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    if (!inspirationId) {
      throw new AppError(400, 'Inspiration ID required');
    }

    // Verify ownership using raw SQL
    const inspirations = await prisma.$queryRaw<Array<{ id: string }>>`
      SELECT "id" FROM "InspirationImage"
      WHERE "id"::text = ${inspirationId} AND "clientId"::text = ${userId}
    `;

    if (inspirations.length === 0) {
      throw new AppError(404, 'Inspiration not found');
    }

    // Delete inspiration
    await prisma.$executeRaw`
      DELETE FROM "InspirationImage" WHERE "id"::text = ${inspirationId}
    `;

    sendSuccess<DeleteInspirationResponse>(res, {
      message: 'Inspiration deleted',
    });
  } catch (error) {
    next(error);
  }
}
