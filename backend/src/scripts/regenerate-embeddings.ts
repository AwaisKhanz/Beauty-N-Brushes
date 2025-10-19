/**
 * Migration Script: Regenerate Image Embeddings with 1408-dim Multimodal Fusion
 *
 * This script regenerates all image embeddings in the database using:
 * - Google Cloud Vertex AI Multimodal Embeddings API
 * - 1408 dimensions (upgraded from 512)
 * - Image + text context fusion for better semantic matching
 *
 * Usage:
 *   npm run regenerate-embeddings
 *   npm run regenerate-embeddings -- --limit=10
 *
 * Options:
 *   --limit=N                 Only process N images (for testing)
 *   --skip=N                  Skip first N images
 *   --service-media           Only regenerate ServiceMedia embeddings
 *   --inspiration             Only regenerate InspirationImage embeddings
 */

import { prisma } from '../config/database';
import { aiService } from '../lib/ai';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

interface Args {
  limit?: number;
  skip?: number;
  serviceMedia?: boolean;
  inspiration?: boolean;
}

async function parseArgs(): Promise<Args> {
  const args: Args = {};
  const cliArgs = process.argv.slice(2);

  for (const arg of cliArgs) {
    if (arg.startsWith('--limit=')) {
      args.limit = parseInt(arg.split('=')[1], 10);
    } else if (arg.startsWith('--skip=')) {
      args.skip = parseInt(arg.split('=')[1], 10);
    } else if (arg === '--service-media') {
      args.serviceMedia = true;
    } else if (arg === '--inspiration') {
      args.inspiration = true;
    }
  }

  return args;
}

/**
 * Helper function to load image from URL or local file
 */
async function loadImageBuffer(imageUrl: string): Promise<Buffer> {
  // Check if it's a localhost URL that might fail
  if (imageUrl.startsWith('http://localhost')) {
    // Convert URL to local file path
    // Example: http://localhost:8000/uploads/services/file.jpeg
    //       -> uploads/services/file.jpeg
    const urlPath = new URL(imageUrl).pathname;
    const localPath = path.join(process.cwd(), urlPath.substring(1)); // Remove leading /

    // Try to read from local file first
    if (fs.existsSync(localPath)) {
      console.log(`   Reading from local file: ${localPath}`);
      return fs.readFileSync(localPath);
    } else {
      console.log(`   File not found locally: ${localPath}`);
      console.log(`   Attempting to fetch from URL: ${imageUrl}`);
    }
  }

  // Fetch from URL
  const imageResponse = await fetch(imageUrl);
  if (!imageResponse.ok) {
    throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
  }

  const imageArrayBuffer = await imageResponse.arrayBuffer();
  return Buffer.from(imageArrayBuffer);
}

async function regenerateServiceMediaEmbeddings(args: Args) {
  console.log('\n📸 Regenerating ServiceMedia embeddings with MULTIMODAL fusion...\n');

  // Get all service media with service context for multimodal embeddings
  const offsetSql = args.skip ? Prisma.sql`OFFSET ${args.skip}` : Prisma.empty;
  const limitSql = args.limit ? Prisma.sql`LIMIT ${args.limit}` : Prisma.empty;

  const serviceMedia = await prisma.$queryRaw<
    Array<{
      id: string;
      serviceId: string;
      fileUrl: string;
      serviceTitle: string;
      serviceDescription: string;
      categoryName: string;
      subcategoryName: string | null;
    }>
  >(Prisma.sql`
    SELECT
      sm.id::text,
      sm."serviceId"::text,
      sm."fileUrl",
      s.title as "serviceTitle",
      s.description as "serviceDescription",
      sc.name as "categoryName",
      ssc.name as "subcategoryName"
    FROM "ServiceMedia" sm
    INNER JOIN "Service" s ON s.id = sm."serviceId"
    INNER JOIN "ServiceCategory" sc ON sc.id = s."categoryId"
    LEFT JOIN "ServiceSubcategory" ssc ON ssc.id = s."subcategoryId"
    WHERE sm."mediaType" = 'image' AND sm."fileUrl" IS NOT NULL
    ORDER BY sm."createdAt" DESC
    ${offsetSql}
    ${limitSql}
  `);

  console.log(`Found ${serviceMedia.length} service images to process`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < serviceMedia.length; i++) {
    const media = serviceMedia[i];
    const progress = `[${i + 1}/${serviceMedia.length}]`;

    try {
      console.log(`${progress} Processing: ${media.fileUrl.substring(0, 60)}...`);
      console.log(`   Service: "${media.serviceTitle}"`);

      // Load image (from local file or URL)
      const imageBuffer = await loadImageBuffer(media.fileUrl);

      // Build multimodal context from service details
      const serviceContext = [
        media.serviceTitle,
        media.serviceDescription,
        media.categoryName,
        media.subcategoryName,
      ]
        .filter(Boolean)
        .join(' - ');

      // Generate 1408-dim MULTIMODAL embedding (image + text context)
      console.log(`${progress} Generating 1408-dim multimodal embedding...`);
      const embedding = await aiService.generateMultimodalEmbedding(imageBuffer, serviceContext);
      const embeddingStr = `[${embedding.join(',')}]`;

      // Update database using raw SQL (for vector type support)
      await prisma.$executeRaw`
        UPDATE "ServiceMedia"
        SET "aiEmbedding" = ${embeddingStr}::vector
        WHERE "id"::text = ${media.id}
      `;

      console.log(`${progress} ✅ Updated to ${embedding.length}-dim MULTIMODAL vector`);
      console.log(`   Context: "${serviceContext.substring(0, 50)}..."`);
      successCount++;

      // Add delay to avoid rate limiting
      if (i < serviceMedia.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      console.error(`${progress} ❌ Error:`, error.message);
      errorCount++;

      // Continue with next image
      continue;
    }
  }

  console.log(`\n📊 ServiceMedia Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(`   📈 Success Rate: ${((successCount / serviceMedia.length) * 100).toFixed(1)}%`);
}

async function regenerateInspirationEmbeddings(args: Args) {
  console.log('\n💡 Regenerating InspirationImage embeddings with MULTIMODAL fusion...\n');

  // Build query parts
  const offsetSql = args.skip ? Prisma.sql`OFFSET ${args.skip}` : Prisma.empty;
  const limitSql = args.limit ? Prisma.sql`LIMIT ${args.limit}` : Prisma.empty;

  const inspirationImages = await prisma.$queryRaw<
    Array<{
      id: string;
      imageUrl: string;
      aiTags: string[];
      styleDescription: string | null;
      notes: string | null;
    }>
  >(Prisma.sql`
    SELECT
      "id"::text,
      "imageUrl",
      "aiTags",
      "styleDescription",
      "notes"
    FROM "InspirationImage"
    WHERE "imageUrl" IS NOT NULL
    ORDER BY "createdAt" DESC
    ${offsetSql}
    ${limitSql}
  `);

  console.log(`Found ${inspirationImages.length} inspiration images to process`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < inspirationImages.length; i++) {
    const image = inspirationImages[i];
    const progress = `[${i + 1}/${inspirationImages.length}]`;

    try {
      console.log(`${progress} Processing: ${image.imageUrl.substring(0, 60)}...`);

      // Load image (from local file or URL)
      const imageBuffer = await loadImageBuffer(image.imageUrl);

      // Re-analyze image for up-to-date AI tags
      console.log(`${progress} Re-analyzing with Gemini Vision...`);
      const base64Image = imageBuffer.toString('base64');
      const analysis = await aiService.analyzeImageFromBase64(base64Image);

      // Build multimodal context from AI analysis + user notes
      const inspirationContext = [
        ...analysis.tags.slice(0, 10), // Top 10 tags
        image.notes,
      ]
        .filter(Boolean)
        .join(' ');

      // Generate 1408-dim MULTIMODAL embedding (image + text context)
      console.log(`${progress} Generating 1408-dim multimodal embedding...`);
      const embedding = await aiService.generateMultimodalEmbedding(
        imageBuffer,
        inspirationContext
      );
      const embeddingStr = `[${embedding.join(',')}]`;

      // Update database with new embedding AND updated AI tags
      await prisma.$executeRaw`
        UPDATE "InspirationImage"
        SET "aiEmbedding" = ${embeddingStr}::vector,
            "aiTags" = ${analysis.tags}::text[]
        WHERE "id"::text = ${image.id}
      `;

      console.log(`${progress} ✅ Updated to ${embedding.length}-dim MULTIMODAL vector`);
      console.log(`   Tags: ${analysis.tags.slice(0, 5).join(', ')}`);
      console.log(`   Context: "${inspirationContext.substring(0, 50)}..."`);
      successCount++;

      // Add delay to avoid rate limiting
      if (i < inspirationImages.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    } catch (error: any) {
      console.error(`${progress} ❌ Error:`, error.message);
      errorCount++;

      // Continue with next image
      continue;
    }
  }

  console.log(`\n📊 InspirationImage Results:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log(
    `   📈 Success Rate: ${((successCount / inspirationImages.length) * 100).toFixed(1)}%`
  );
}

async function main() {
  console.log('\n🚀 Embedding Regeneration Script - 1408-dim Multimodal Upgrade\n');
  console.log('='.repeat(50));

  const args = await parseArgs();

  console.log(`\n🔧 Using Google Cloud Vertex AI Multimodal Embeddings`);
  console.log(`   - 1408 dimensions (upgraded from 512)`);
  console.log(`   - Image + text context fusion`);
  console.log(`   - Better semantic matching`);

  console.log(`\n⚙️  Options:`);
  if (args.limit) console.log(`   Limit: ${args.limit} images`);
  if (args.skip) console.log(`   Skip: ${args.skip} images`);
  if (args.serviceMedia) console.log(`   Target: ServiceMedia only`);
  if (args.inspiration) console.log(`   Target: InspirationImage only`);

  console.log('\n' + '='.repeat(50));

  try {
    const startTime = Date.now();

    // Determine what to regenerate
    if (args.inspiration) {
      await regenerateInspirationEmbeddings(args);
    } else if (args.serviceMedia) {
      await regenerateServiceMediaEmbeddings(args);
    } else {
      // Default: regenerate both
      await regenerateServiceMediaEmbeddings(args);
      await regenerateInspirationEmbeddings(args);
    }

    const endTime = Date.now();
    const durationSec = ((endTime - startTime) / 1000).toFixed(1);

    console.log('\n' + '='.repeat(50));
    console.log(`\n✅ Migration completed in ${durationSec}s\n`);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
