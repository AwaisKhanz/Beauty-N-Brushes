/**
 * Regenerate AI tags for all service images using new Gemini Vision analysis
 * This script updates existing service images to use the improved hairstyle-specific tags
 *
 * Run with: npx tsx src/scripts/regenerate-service-tags.ts
 */

import { prisma } from '../config/database';
import { aiService } from '../lib/ai';

async function regenerateServiceTags() {
  try {
    console.log('🚀 Starting service image tag regeneration...\n');

    // Get all service media with images
    const serviceMedia = await prisma.$queryRaw<
      Array<{
        id: string;
        fileUrl: string;
        aiTags: string[];
      }>
    >`
      SELECT id::text, "fileUrl", "aiTags"
      FROM "ServiceMedia"
      WHERE "fileUrl" IS NOT NULL
      ORDER BY "createdAt" DESC
    `;

    console.log(`📊 Found ${serviceMedia.length} service images to process\n`);

    let successCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    for (let i = 0; i < serviceMedia.length; i++) {
      const media = serviceMedia[i];
      const progress = `[${i + 1}/${serviceMedia.length}]`;

      console.log(`${progress} Processing: ${media.fileUrl.substring(0, 80)}...`);

      try {
        // Fetch the image
        const imageResponse = await fetch(media.fileUrl);
        if (!imageResponse.ok) {
          console.log(`   ⚠️  Failed to fetch image: ${imageResponse.statusText}`);
          skippedCount++;
          continue;
        }

        const imageArrayBuffer = await imageResponse.arrayBuffer();
        const imageBuffer = Buffer.from(imageArrayBuffer);

        // Analyze with new Gemini Vision
        const base64Image = imageBuffer.toString('base64');
        const analysis = await aiService.analyzeImageFromBase64(base64Image);

        // Update database with new tags
        await prisma.$executeRaw`
          UPDATE "ServiceMedia"
          SET "aiTags" = ${analysis.tags}::text[]
          WHERE "id"::text = ${media.id}
        `;

        console.log(`   ✅ Updated tags:`, analysis.tags.slice(0, 8).join(', '));
        successCount++;

        // Rate limiting - wait 500ms between requests
        if (i < serviceMedia.length - 1) {
          await new Promise((resolve) => setTimeout(resolve, 500));
        }
      } catch (error: any) {
        console.log(`   ❌ Error:`, error.message);
        errorCount++;
      }

      console.log(''); // Empty line for readability
    }

    console.log('\n✅ Regeneration complete!');
    console.log(`   Success: ${successCount}`);
    console.log(`   Errors: ${errorCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log(`   Total: ${serviceMedia.length}`);
  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
regenerateServiceTags()
  .then(() => {
    console.log('\n👋 Done!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed:', error);
    process.exit(1);
  });
