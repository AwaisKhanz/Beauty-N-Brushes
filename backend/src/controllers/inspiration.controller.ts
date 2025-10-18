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

    // Generate IMAGE-BASED embedding (not text-based!)
    // This preserves visual features like color, texture, and style
    const embedding = await aiService.generateImageEmbedding(imageBuffer);
    const embeddingStr = `[${embedding.join(',')}]`;

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
        ${analysis.styleType || null}::text,
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
          hairType: analysis.hairType,
          styleType: analysis.styleType,
          colorInfo: analysis.colorInfo,
          complexityLevel: analysis.complexityLevel,
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

    // Vector similarity search
    // Using cosine distance (<=>), lower values are better matches
    // Build query conditionally based on location filter
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

    // Transform matches and calculate match scores
    const transformedMatches = matches.map((match) => {
      // Convert distance to match score (0-1, where 1 is perfect)
      // Cosine distance ranges from 0 (identical) to 2 (opposite)
      const matchScore = Math.max(0, 1 - match.distance / 2);

      // Find matching tags for reference
      const inspirationTags = inspiration.aiTags || [];
      const serviceTags = match.ai_tags || [];
      const matchingTags = inspirationTags.filter((tag: string) => serviceTags.includes(tag));

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
        matchScore: Math.round(matchScore * 100), // Convert to 0-100 scale (pure vector similarity)
        distance: match.distance,
        matchingTags: matchingTags,
        aiTags: match.ai_tags, // Include all AI tags
      };
    });

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
