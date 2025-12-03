/**
 * Admin Routes
 * Endpoints for system administration and monitoring
 */

import { Router, Response } from 'express';
import { authenticate } from '../middleware/authenticate';
import { mediaProcessorService } from '../services/media-processor.service';
import * as subscriptionConfigController from '../controllers/subscription-config.controller';
import type { AuthRequest } from '../types';

const router = Router();

// All admin routes require authentication
router.use(authenticate);

/**
 * GET /api/v1/admin/media-processor/stats
 * Get media processing statistics
 */
router.get('/media-processor/stats', async (_req: AuthRequest, res: Response) => {
  try {
    // TODO: Add admin role check
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({ success: false, error: 'Admin access required' });
    // }

    const stats = await mediaProcessorService.getProcessingStats();

    res.json({
      success: true,
      data: {
        ...stats,
        health: stats.processing > 10 ? 'warning' : 'healthy', // Alert if too many stuck in processing
      },
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get processing stats',
    });
  }
});

/**
 * POST /api/v1/admin/media-processor/recover
 * Manually trigger recovery of stuck/pending media
 */
router.post('/media-processor/recover', async (_req: AuthRequest, res: Response) => {
  try {
    // TODO: Add admin role check
    // if (req.user?.role !== 'admin') {
    //   return res.status(403).json({ success: false, error: 'Admin access required' });
    // }

    console.log('🔧 Manual recovery triggered by admin');
    const result = await mediaProcessorService.recoverStuckMedia();

    res.json({
      success: true,
      data: result,
      message: `Recovered ${result.recovered} media items`,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to recover stuck media',
    });
  }
});

/**
 * GET /api/v1/admin/media-processor/queue
 * Get current queue status
 */
router.get('/media-processor/queue', async (_req: AuthRequest, res: Response) => {
  try {
    // TODO: Add admin role check

    const queueStatus = mediaProcessorService.getQueueStatus();

    res.json({
      success: true,
      data: queueStatus,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get queue status',
    });
  }
});

/**
 * GET /api/v1/admin/health
 * Comprehensive health check for monitoring
 */
router.get('/health', async (_req: AuthRequest, res: Response) => {
  try {
    const stats = await mediaProcessorService.getProcessingStats();
    const queueStatus = mediaProcessorService.getQueueStatus();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      mediaProcessor: {
        ...stats,
        ...queueStatus,
        health: stats.processing > 10 ? 'warning' : 'healthy',
      },
    };

    // Warning if too many stuck in processing
    if (stats.processing > 10) {
      health.status = 'warning';
    }

    res.json({
      success: true,
      data: health,
    });
  } catch (error: unknown) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Health check failed',
      status: 'unhealthy',
    });
  }
});

/**
 * GET /api/v1/admin/subscription-config
 * Get subscription configuration (trial settings)
 */
router.get('/subscription-config', subscriptionConfigController.getSubscriptionConfig);

/**
 * PUT /api/v1/admin/subscription-config
 * Update subscription configuration (admin only)
 */
router.put('/subscription-config', subscriptionConfigController.updateSubscriptionConfig);

export default router;
