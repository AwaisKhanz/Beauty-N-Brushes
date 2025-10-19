import { Response, NextFunction } from 'express';
import { prisma } from '../config/database';
import { Prisma } from '@prisma/client';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { aiService } from '../lib/ai';
import { MatchingEngine } from '../lib/matching-engine';
import type { AuthRequest } from '../types';
import type { AnalyzeInspirationResponse, MatchInspirationResponse } from '../../../shared-types';

/**
 * ============================================
 * EPHEMERAL VISUAL SEARCH
 * ============================================
 *
 * SIMPLIFIED FLOW:
 * 1. Client uploads image
 * 2. AI analyzes image (tags, embedding)
 * 3. Return analysis + matches immediately
 * 4. NO database storage - ephemeral search only
 *
 * Uses PURE VECTOR SIMILARITY matching:
 * - 1408-dimensional multimodal embeddings (image + text context)
 * - Cosine distance vector similarity search
 * - Non-linear perception-based scoring
 * - IVFFlat ANN indexing for performance
 */

/**
 * Analyze inspiration image (ephemeral - no storage)
 */
export async function analyzeInspiration(
  req: AuthRequest,
  res: Response<AnalyzeInspirationResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { imageUrl, notes } = req.body;

    if (!imageUrl) {
      throw new AppError(400, 'Image URL required');
    }

    // TWO-STAGE AI ANALYSIS (matching provider flow)
    console.log('🤖 Analyzing inspiration image:', imageUrl);

    // Fetch the image from storage
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
    }

    const imageArrayBuffer = await imageResponse.arrayBuffer();
    const imageBuffer = Buffer.from(imageArrayBuffer);
    const base64Image = imageBuffer.toString('base64');

    // STAGE 1: AI Vision Analysis - Extract visual features
    console.log('   📊 Stage 1: Extracting visual features...');
    const analysis = await aiService.analyzeImageFromBase64(base64Image);

    // STAGE 2: Generate ENRICHED MULTIMODAL Embedding
    // Combine: User notes + AI-extracted visual features
    // This creates better matching because embedding includes:
    // - Visual features (what image shows)
    // - User context (what they're looking for)
    console.log('   🧠 Stage 2: Generating enriched embedding...');

    const enrichedContext = [
      notes, // User's notes/context if provided
      ...analysis.tags.slice(0, 10), // Top 10 visual feature tags
    ]
      .filter(Boolean)
      .join(' ');

    const embedding = await aiService.generateMultimodalEmbedding(
      imageBuffer,
      enrichedContext // User notes + AI visual tags
    );

    console.log('   ✅ Analysis complete!');
    console.log(`      Tags: ${analysis.tags.slice(0, 8).join(', ')}`);
    console.log(`      Context: "${enrichedContext.substring(0, 80)}..."`);
    console.log(`      Embedding: ${embedding.length}-dim MULTIMODAL vector`);

    // Return analysis WITHOUT storing in database
    sendSuccess<AnalyzeInspirationResponse>(
      res,
      {
        message: 'Image analyzed successfully',
        analysis: {
          tags: analysis.tags,
          embedding: embedding, // Return enriched embedding for matching
        },
      },
      200
    );
  } catch (error) {
    console.error('❌ Analyze inspiration error:', error);
    next(error);
  }
}

/**
 * Match inspiration to provider services (ephemeral - no storage)
 */
export async function matchInspiration(
  req: AuthRequest,
  res: Response<MatchInspirationResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { embedding, tags, location, maxResults = 20 } = req.body;

    if (!embedding || !Array.isArray(embedding)) {
      throw new AppError(400, 'Embedding required');
    }

    console.log('🔍 Starting ephemeral visual search...');
    console.log(`   Embedding dimensions: ${embedding.length}`);
    console.log(`   Tags: ${tags?.slice(0, 5).join(', ') || 'none'}`);

    // Convert embedding array to vector string
    const embeddingStr = `[${embedding.join(',')}]`;

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
        sc."name" as category_name,
        p."id"::text as provider_id,
        p."businessName" as provider_business_name,
        p."slug" as provider_slug,
        p."logoUrl" as provider_logo_url,
        p."city" as provider_city,
        p."state" as provider_state,
        (sm."aiEmbedding" <=> ${embeddingStr}::vector) AS distance,
        sm."aiTags" as ai_tags
      FROM "ServiceMedia" sm
      JOIN "Service" s ON sm."serviceId" = s.id
      JOIN "ServiceCategory" sc ON s."categoryId" = sc.id
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
        category_name: string;
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

    console.log(`   Raw matches found: ${matches.length}`);

    const inspirationTags = tags || [];

    // Transform matches - HYBRID SCORING (Vector + Tags + Category)
    const transformedMatches = matches.map((match) => {
      const serviceTags = match.ai_tags || [];

      // Calculate HYBRID match score using advanced MatchingEngine
      const hybridScore = MatchingEngine.calculateHybridScore(
        match.distance,
        inspirationTags,
        serviceTags,
        match.category_name || 'general'
      );

      // Extract intelligent matching tags (with synonym expansion)
      const matchingTags = MatchingEngine.extractMatchingTags(inspirationTags, serviceTags);

      // Debug first match only
      if (match === matches[0]) {
        console.log('\n   📊 Top Match (Hybrid Scoring):');
        console.log(`      Service: ${match.service_title}`);
        console.log(`      Category: ${match.category_name}`);
        console.log(`      Provider: ${match.provider_business_name}`);
        console.log(`      Distance: ${match.distance.toFixed(4)}`);
        console.log(`      Final Score: ${hybridScore.finalScore}%`);
        console.log(`      Breakdown: ${hybridScore.breakdown}`);
        console.log(`      Matching Tags: ${matchingTags.slice(0, 5).join(', ')}`);
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
        matchScore: hybridScore.finalScore, // Hybrid score (vector + tags)
        vectorScore: hybridScore.vectorScore, // Pure vector score
        tagScore: hybridScore.tagScore, // Tag overlap score
        distance: match.distance, // Raw distance for debugging
        matchingTags: matchingTags, // Intelligent matching tags
        aiTags: match.ai_tags, // All AI tags for display
        finalScore: hybridScore.finalScore, // For re-ranking
      };
    });

    // Re-rank matches using advanced algorithm
    const rankedMatches = MatchingEngine.reRankMatches(transformedMatches, {
      minScore: 40,
      diversityBoost: true, // Reduce clustering of very similar results
    });

    console.log(`   ✅ Matches after re-ranking: ${rankedMatches.length}`);
    if (rankedMatches.length > 0) {
      console.log(
        `   Top 3 scores: ${rankedMatches
          .slice(0, 3)
          .map((m) => `${m.matchScore}% (V:${m.vectorScore}% T:${m.tagScore}%)`)
          .join(', ')}`
      );
    }

    sendSuccess<MatchInspirationResponse>(res, {
      message: rankedMatches.length > 0 ? 'Matches found' : 'No matches found',
      matches: rankedMatches,
      totalMatches: rankedMatches.length,
    });
  } catch (error) {
    console.error('❌ Match inspiration error:', error);
    next(error);
  }
}
