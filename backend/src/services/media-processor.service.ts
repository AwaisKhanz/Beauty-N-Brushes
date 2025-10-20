/**
 * Background Media Processing Service
 * Handles AI analysis of service images asynchronously to avoid blocking user experience
 */

import { prisma } from '../config/database';
import { aiService } from '../lib/ai';

interface MediaProcessingJob {
  id: string;
  serviceId: string;
  mediaId: string;
  mediaUrl: string;
  category: string;
  serviceContext: string;
  retryCount: number;
}

class MediaProcessorService {
  private queue: MediaProcessingJob[] = [];
  private isProcessing = false;
  private readonly MAX_RETRIES = 3;
  private readonly RATE_LIMIT_DELAY_MS = 500;

  /**
   * Add media to processing queue
   */
  async enqueueMedia(
    serviceId: string,
    mediaId: string,
    mediaUrl: string,
    category: string,
    serviceContext: string
  ): Promise<void> {
    const job: MediaProcessingJob = {
      id: `${mediaId}-${Date.now()}`,
      serviceId,
      mediaId,
      mediaUrl,
      category,
      serviceContext,
      retryCount: 0,
    };

    this.queue.push(job);
    console.log(`📥 Queued media for AI processing: ${mediaId} (Queue size: ${this.queue.length})`);

    // Start processing if not already running
    if (!this.isProcessing) {
      this.startProcessing();
    }
  }

  /**
   * Add multiple media items to queue
   */
  async enqueueBatch(
    serviceId: string,
    mediaItems: Array<{ mediaId: string; mediaUrl: string }>,
    category: string,
    serviceContext: string
  ): Promise<void> {
    for (const item of mediaItems) {
      await this.enqueueMedia(serviceId, item.mediaId, item.mediaUrl, category, serviceContext);
    }
  }

  /**
   * Start processing queue
   */
  private async startProcessing(): Promise<void> {
    if (this.isProcessing) {
      return;
    }

    this.isProcessing = true;
    console.log('🚀 Starting background media processing...');

    while (this.queue.length > 0) {
      const job = this.queue.shift();
      if (!job) continue;

      try {
        await this.processJob(job);

        // Rate limiting between jobs
        if (this.queue.length > 0) {
          await this.delay(this.RATE_LIMIT_DELAY_MS);
        }
      } catch (error: any) {
        console.error(`❌ Failed to process job ${job.id}:`, error.message);

        // Retry logic
        if (job.retryCount < this.MAX_RETRIES) {
          job.retryCount++;
          this.queue.push(job); // Re-queue for retry
          console.log(
            `🔄 Re-queuing job ${job.id} (attempt ${job.retryCount}/${this.MAX_RETRIES})`
          );
        } else {
          // Mark as failed after max retries
          await this.markAsFailed(job.mediaId, error.message);
        }
      }
    }

    this.isProcessing = false;
    console.log('✅ Background media processing completed');
  }

  /**
   * Process a single media item
   */
  private async processJob(job: MediaProcessingJob): Promise<void> {
    console.log(`\n🤖 Processing media: ${job.mediaId}`);

    // Update status to processing
    await prisma.serviceMedia.update({
      where: { id: job.mediaId },
      data: { processingStatus: 'processing' },
    });

    try {
      // Fetch the image
      const imageResponse = await fetch(job.mediaUrl);
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.statusText}`);
      }

      const imageArrayBuffer = await imageResponse.arrayBuffer();
      const imageBuffer = Buffer.from(imageArrayBuffer);
      const base64Image = imageBuffer.toString('base64');

      // STAGE 1: AI Vision Analysis - Extract visual features
      console.log(`   📊 Analyzing visual features (${job.category})...`);
      const analysis = await aiService.analyzeImageFromBase64(base64Image, job.category);

      // STAGE 2: Generate ENRICHED MULTIMODAL Embedding
      console.log(`   🧠 Generating multimodal embedding...`);
      const enrichedContext = [job.serviceContext, ...analysis.tags.slice(0, 5)]
        .filter(Boolean)
        .join(' ')
        .substring(0, 800);

      const embedding = await aiService.generateMultimodalEmbedding(imageBuffer, enrichedContext);

      // Format embedding for PostgreSQL vector type
      const embeddingStr = `[${embedding.join(',')}]`;

      // Update media with analysis results using raw SQL (for vector type)
      await prisma.$executeRawUnsafe(
        `
        UPDATE "ServiceMedia"
        SET 
          "aiTags" = $1,
          "aiEmbedding" = $2::vector,
          "colorPalette" = $3::jsonb,
          "processingStatus" = 'completed',
          "updatedAt" = NOW()
        WHERE "id" = $4
      `,
        analysis.tags,
        embeddingStr,
        JSON.stringify(analysis.dominantColors || []),
        job.mediaId
      );

      console.log(`   ✅ Media processed successfully!`);
      console.log(`      Tags: ${analysis.tags.slice(0, 8).join(', ')}`);
      console.log(`      Embedding: ${embedding.length}-dim vector`);
    } catch (error: any) {
      console.error(`   ❌ Processing failed:`, error.message);
      throw error;
    }
  }

  /**
   * Mark media as failed
   */
  private async markAsFailed(mediaId: string, errorMessage: string): Promise<void> {
    await prisma.serviceMedia.update({
      where: { id: mediaId },
      data: {
        processingStatus: 'failed',
        aiTags: ['processing-failed'],
      },
    });

    console.error(`❌ Media ${mediaId} marked as failed: ${errorMessage}`);
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    queueSize: number;
    isProcessing: boolean;
  } {
    return {
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Recovery: Re-queue stuck or pending media
   * Call this on server startup or manually via admin endpoint
   */
  async recoverStuckMedia(): Promise<{
    recovered: number;
    pending: number;
    stuck: number;
    messages: string[];
  }> {
    const messages: string[] = [];

    try {
      // Find media in 'pending' state (never processed)
      const pendingMedia = await prisma.serviceMedia.findMany({
        where: {
          processingStatus: 'pending',
          mediaType: 'image',
        },
        include: {
          service: {
            include: {
              category: true,
              subcategory: true,
            },
          },
        },
        take: 50, // Limit to prevent overwhelming the queue
      });

      // Find media stuck in 'processing' state (older than 5 minutes)
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      const stuckMedia = await prisma.serviceMedia.findMany({
        where: {
          processingStatus: 'processing',
          mediaType: 'image',
          updatedAt: {
            lt: fiveMinutesAgo,
          },
        },
        include: {
          service: {
            include: {
              category: true,
              subcategory: true,
            },
          },
        },
        take: 50,
      });

      const totalToRecover = pendingMedia.length + stuckMedia.length;

      if (totalToRecover === 0) {
        messages.push('✅ No media needs recovery');
        return { recovered: 0, pending: 0, stuck: 0, messages };
      }

      messages.push(`🔍 Found ${pendingMedia.length} pending + ${stuckMedia.length} stuck media`);

      // Reset stuck media to pending
      if (stuckMedia.length > 0) {
        await prisma.serviceMedia.updateMany({
          where: {
            id: { in: stuckMedia.map((m) => m.id) },
          },
          data: { processingStatus: 'pending' },
        });
        messages.push(`♻️  Reset ${stuckMedia.length} stuck media to pending`);
      }

      // Re-queue all media for processing
      const allMedia = [...pendingMedia, ...stuckMedia];
      for (const media of allMedia) {
        // Build service context
        const serviceContext = [
          media.service.title,
          media.service.description?.substring(0, 150),
          media.service.category.name,
          media.service.subcategory?.name,
        ]
          .filter(Boolean)
          .join(' - ')
          .substring(0, 200);

        // Re-queue
        await this.enqueueMedia(
          media.serviceId,
          media.id,
          media.fileUrl,
          media.service.category.name,
          serviceContext
        );
      }

      messages.push(`🚀 Re-queued ${totalToRecover} media for processing`);

      return {
        recovered: totalToRecover,
        pending: pendingMedia.length,
        stuck: stuckMedia.length,
        messages,
      };
    } catch (error: any) {
      console.error('❌ Recovery failed:', error);
      messages.push(`❌ Recovery error: ${error.message}`);
      return { recovered: 0, pending: 0, stuck: 0, messages };
    }
  }

  /**
   * Get processing statistics
   */
  async getProcessingStats(): Promise<{
    pending: number;
    processing: number;
    completed: number;
    failed: number;
    queueSize: number;
    isProcessing: boolean;
  }> {
    const [pending, processing, completed, failed] = await Promise.all([
      prisma.serviceMedia.count({
        where: { processingStatus: 'pending', mediaType: 'image' },
      }),
      prisma.serviceMedia.count({
        where: { processingStatus: 'processing', mediaType: 'image' },
      }),
      prisma.serviceMedia.count({
        where: { processingStatus: 'completed', mediaType: 'image' },
      }),
      prisma.serviceMedia.count({
        where: { processingStatus: 'failed', mediaType: 'image' },
      }),
    ]);

    return {
      pending,
      processing,
      completed,
      failed,
      queueSize: this.queue.length,
      isProcessing: this.isProcessing,
    };
  }

  /**
   * Helper: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

// Singleton instance
export const mediaProcessorService = new MediaProcessorService();
