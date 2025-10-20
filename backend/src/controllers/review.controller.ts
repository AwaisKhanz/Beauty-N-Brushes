/**
 * Review Controller
 * Handles HTTP requests for review operations
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { reviewService } from '../services/review.service';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';
import type {
  CreateReviewRequest,
  CreateReviewResponse,
  GetReviewsResponse,
  GetReviewResponse,
  UpdateReviewRequest,
  UpdateReviewResponse,
  DeleteReviewResponse,
  ProviderResponseRequest,
  AddProviderResponseResponse,
  MarkReviewHelpfulResponse,
} from '../../../shared-types';

/**
 * Create a new review
 * POST /api/v1/reviews
 */
export async function create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const data: CreateReviewRequest = req.body;

    if (!data.bookingId || !data.overallRating) {
      throw new AppError(400, 'Missing required fields');
    }

    const review = await reviewService.createReview(userId, data);

    sendSuccess<CreateReviewResponse>(
      res,
      {
        message: 'Review created successfully',
        review,
      },
      201
    );
  } catch (error) {
    next(error);
  }
}

/**
 * Get reviews for a provider
 * GET /api/v1/reviews/provider/:providerId
 */
export async function getByProvider(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { providerId } = req.params;
    const userId = req.user?.id; // Optional - for helpful status
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    if (!providerId) {
      throw new AppError(400, 'Provider ID required');
    }

    const result = await reviewService.getReviewsByProvider(providerId, page, limit, userId);

    sendSuccess<GetReviewsResponse>(res, result);
  } catch (error) {
    next(error);
  }
}

/**
 * Get single review by ID
 * GET /api/v1/reviews/:reviewId
 */
export async function getById(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { reviewId } = req.params;
    const userId = req.user?.id; // Optional - for helpful status

    if (!reviewId) {
      throw new AppError(400, 'Review ID required');
    }

    const review = await reviewService.getReviewById(reviewId, userId);

    sendSuccess<GetReviewResponse>(res, {
      message: 'Review retrieved successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update a review
 * PUT /api/v1/reviews/:reviewId
 */
export async function update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { reviewId } = req.params;
    const data: UpdateReviewRequest = req.body;

    if (!reviewId) {
      throw new AppError(400, 'Review ID required');
    }

    const review = await reviewService.updateReview(reviewId, userId, data);

    sendSuccess<UpdateReviewResponse>(res, {
      message: 'Review updated successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a review
 * DELETE /api/v1/reviews/:reviewId
 */
export async function remove(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { reviewId } = req.params;

    if (!reviewId) {
      throw new AppError(400, 'Review ID required');
    }

    await reviewService.deleteReview(reviewId, userId);

    sendSuccess<DeleteReviewResponse>(res, {
      message: 'Review deleted successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add provider response to review
 * POST /api/v1/reviews/:reviewId/response
 */
export async function addResponse(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Verify user is a provider
    const providerProfile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!providerProfile) {
      throw new AppError(403, 'Only providers can respond to reviews');
    }

    const { reviewId } = req.params;
    const { providerResponse }: ProviderResponseRequest = req.body;

    if (!reviewId) {
      throw new AppError(400, 'Review ID required');
    }

    if (!providerResponse) {
      throw new AppError(400, 'Response text required');
    }

    const review = await reviewService.addProviderResponse(
      reviewId,
      providerProfile.id,
      providerResponse
    );

    sendSuccess<AddProviderResponseResponse>(res, {
      message: 'Response added successfully',
      review,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Toggle helpful mark on review
 * POST /api/v1/reviews/:reviewId/helpful
 */
export async function toggleHelpful(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { reviewId } = req.params;

    if (!reviewId) {
      throw new AppError(400, 'Review ID required');
    }

    const result = await reviewService.toggleHelpful(reviewId, userId);

    sendSuccess<MarkReviewHelpfulResponse>(res, {
      message: result.helpful ? 'Marked as helpful' : 'Removed helpful mark',
      helpful: result.helpful,
      helpfulCount: result.helpfulCount,
    });
  } catch (error) {
    next(error);
  }
}
