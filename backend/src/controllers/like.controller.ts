/**
 * Like Controller
 * Handles HTTP requests for like operations
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { likeService } from '../services/like.service';
import type { AuthRequest } from '../types';
import type {
  ToggleLikeRequest,
  ToggleLikeResponse,
  GetLikesResponse,
  CheckLikeStatusResponse,
} from '../../../shared-types';

/**
 * Toggle like (provider or service)
 * POST /api/v1/likes
 */
export async function toggle(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { targetId, targetType }: ToggleLikeRequest = req.body;

    if (!targetId || !targetType) {
      throw new AppError(400, 'Missing required fields');
    }

    if (targetType !== 'provider' && targetType !== 'service') {
      throw new AppError(400, 'Invalid target type. Must be "provider" or "service"');
    }

    let result: { liked: boolean; likeCount: number };

    if (targetType === 'provider') {
      result = await likeService.toggleProviderLike(userId, targetId);
    } else {
      result = await likeService.toggleServiceLike(userId, targetId);
    }

    sendSuccess<ToggleLikeResponse>(res, {
      message: result.liked ? 'Liked successfully' : 'Unliked successfully',
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get user's liked items
 * GET /api/v1/likes/my-likes
 */
export async function getMyLikes(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await likeService.getUserLikes(userId, page, limit);

    sendSuccess<GetLikesResponse>(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Check like status for a specific target
 * GET /api/v1/likes/status/:targetType/:targetId
 */
export async function checkStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { targetType, targetId } = req.params;

    if (!targetType || !targetId) {
      throw new AppError(400, 'Missing required parameters');
    }

    if (targetType !== 'provider' && targetType !== 'service') {
      throw new AppError(400, 'Invalid target type. Must be "provider" or "service"');
    }

    const result = await likeService.checkLikeStatus(
      userId,
      targetId,
      targetType as 'provider' | 'service'
    );

    sendSuccess<CheckLikeStatusResponse>(res, {
      message: 'Like status retrieved',
      liked: result.liked,
      likeCount: result.likeCount,
    });
  } catch (error) {
    next(error);
  }
}
