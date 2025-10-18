/**
 * Migration Script: Regenerate Image Embeddings
 *
 * This script regenerates all image embeddings in the database using the
 * new image-based embedding system (instead of text-based).
 *
 * Usage:
 *   npm run regenerate-embeddings
 *   npm run regenerate-embeddings -- --provider=openai
 *   npm run regenerate-embeddings -- --limit=10
 *
 * Options:
 *   --provider=google|openai  Override EMBEDDING_PROVIDER env variable
 *   --limit=N                 Only process N images (for testing)
 *   --skip=N                  Skip first N images
 *   --service-media           Only regenerate ServiceMedia embeddings
 *   --inspiration             Only regenerate InspirationImage embeddings
 */

import { prisma } from '../config/database';
import { aiService } from '../lib/ai';
import { Prisma } from '@prisma/client';

interface Args {
  provider?: 'google' | 'openai';
  limit?: number;
  skip?: number;
  serviceMedia?: boolean;
  inspiration?: boolean;
}

async function parseArgs(): Promise<Args> {
  const args: Args = {};
  const cliArgs = process.argv.slice(2);

  for (const arg of cliArgs) {
    if (arg.startsWith('--provider=')) {
      const value = arg.split('=')[1] as 'google' | 'openai';
      if (value === 'google' || value === 'openai') {
        args.provider = value;
      }
    } else if (arg.startsWith('--limit=')) {
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

async function regenerateServiceMediaEmbeddings(args: Args) {
  console.log('\n📸 Regenerating ServiceMedia embeddings...\n');

  // Get all service media with images
  const serviceMedia = await prisma.serviceMedia.findMany({
    where: {
      mediaType: 'image',
    },
    orderBy: { createdAt: 'desc' },
    skip: args.skip,
    take: args.limit,
  });

  console.log(`Found ${serviceMedia.length} service images to process`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < serviceMedia.length; i++) {
    const media = serviceMedia[i];
    const progress = `[${i + 1}/${serviceMedia.length}]`;

    try {
      console.log(`${progress} Processing: ${media.fileUrl}`);

      // Download image
      const imageResponse = await fetch(media.fileUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);

      // Generate new image-based embedding
      console.log(`${progress} Generating embedding...`);
      const embedding = await aiService.generateImageEmbedding(imageBuffer);
      const embeddingStr = `[${embedding.join(',')}]`;

      // Update database using raw SQL (for vector type support)
      await prisma.$executeRaw`
        UPDATE "ServiceMedia"
        SET "aiEmbedding" = ${embeddingStr}::vector
        WHERE "id"::text = ${media.id}
      `;

      console.log(`${progress} ✅ Success`);
      successCount++;

      // Add delay to avoid rate limiting
      if (i < serviceMedia.length - 1) {
        const delayMs = args.provider === 'openai' ? 2000 : 500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
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
  console.log('\n💡 Regenerating InspirationImage embeddings...\n');

  // Build query parts
  const offsetSql = args.skip ? Prisma.sql`OFFSET ${args.skip}` : Prisma.empty;
  const limitSql = args.limit ? Prisma.sql`LIMIT ${args.limit}` : Prisma.empty;

  const inspirationImages = await prisma.$queryRaw<
    Array<{ id: string; imageUrl: string }>
  >(Prisma.sql`
    SELECT "id"::text, "imageUrl"
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
      console.log(`${progress} Processing: ${image.imageUrl}`);

      // Download image
      const imageResponse = await fetch(image.imageUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);

      // Generate new image-based embedding
      console.log(`${progress} Generating embedding...`);
      const embedding = await aiService.generateImageEmbedding(imageBuffer);
      const embeddingStr = `[${embedding.join(',')}]`;

      // Update database using raw SQL (for vector type support)
      await prisma.$executeRaw`
        UPDATE "InspirationImage"
        SET "aiEmbedding" = ${embeddingStr}::vector
        WHERE "id"::text = ${image.id}
      `;

      console.log(`${progress} ✅ Success`);
      successCount++;

      // Add delay to avoid rate limiting
      if (i < inspirationImages.length - 1) {
        const delayMs = args.provider === 'openai' ? 2000 : 500;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
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
  console.log(`   📈 Success Rate: ${((successCount / inspirationImages.length) * 100).toFixed(1)}%`);
}

async function main() {
  console.log('\n🚀 Embedding Regeneration Script\n');
  console.log('='.repeat(50));

  const args = await parseArgs();

  // Override provider if specified
  if (args.provider) {
    process.env.EMBEDDING_PROVIDER = args.provider;
    console.log(`\n🔧 Using provider: ${args.provider}`);
  } else {
    console.log(`\n🔧 Using provider: ${process.env.EMBEDDING_PROVIDER || 'google'}`);
  }

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
