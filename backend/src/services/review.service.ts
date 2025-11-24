/**
 * Review Service
 * Handles review creation, updates, and management
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import type {
  CreateReviewRequest,
  UpdateReviewRequest,
  Review,
  GetReviewsResponse,
  RatingDistribution,
} from '../../../shared-types';

class ReviewService {
  /**
   * Create a review for a completed booking
   */
  async createReview(userId: string, data: CreateReviewRequest): Promise<Review> {
    // Verify booking exists and belongs to user
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        client: { select: { id: true, firstName: true, lastName: true } },
        service: { select: { providerId: true } },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.clientId !== userId) {
      throw new AppError(403, 'Not authorized to review this booking');
    }

    if (booking.bookingStatus !== 'COMPLETED') {
      throw new AppError(400, 'Can only review completed bookings');
    }

    // Enforce 7-day review window (per requirements C.6)
    const completedAt = booking.completedAt;
    if (completedAt) {
      const daysSinceCompletion = (Date.now() - completedAt.getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceCompletion > 7) {
        throw new AppError(400, 'Review period has expired (7 days after completion)');
      }
    }

    // Check if review already exists
    const existingReview = await prisma.review.findUnique({
      where: { bookingId: data.bookingId },
    });

    if (existingReview) {
      throw new AppError(400, 'Review already exists for this booking');
    }

    // Validate ratings
    if (
      data.overallRating < 1 ||
      data.overallRating > 5 ||
      (data.qualityRating && (data.qualityRating < 1 || data.qualityRating > 5)) ||
      (data.timelinessRating && (data.timelinessRating < 1 || data.timelinessRating > 5)) ||
      (data.professionalismRating &&
        (data.professionalismRating < 1 || data.professionalismRating > 5))
    ) {
      throw new AppError(400, 'Ratings must be between 1 and 5');
    }

    // Create review with media in a transaction
    const review = await prisma.$transaction(async (tx) => {
      const newReview = await tx.review.create({
        data: {
          bookingId: data.bookingId,
          clientId: userId,
          providerId: booking.service.providerId,
          overallRating: data.overallRating,
          qualityRating: data.qualityRating,
          timelinessRating: data.timelinessRating,
          professionalismRating: data.professionalismRating,
          reviewText: data.reviewText,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          reviewMedia: true,
        },
      });

      // Add media if provided
      if (data.mediaFiles && data.mediaFiles.length > 0) {
        await tx.reviewMedia.createMany({
          data: data.mediaFiles.map((fileUrl, index) => ({
            reviewId: newReview.id,
            mediaType: fileUrl.match(/\.(mp4|mov|avi)$/i) ? 'video' : 'image',
            fileUrl,
            displayOrder: index,
          })),
        });
      }

      return newReview;
    });

    // Update provider rating asynchronously
    this.updateProviderRating(booking.service.providerId).catch((err) => {
      console.error('Failed to update provider rating:', err);
    });

    return this.formatReview(review);
  }

  /**
   * Get reviews for a provider with pagination and filtering
   */
  async getReviewsByProvider(
    providerId: string,
    page: number = 1,
    limit: number = 10,
    userId?: string
  ): Promise<GetReviewsResponse> {
    const skip = (page - 1) * limit;

    // Get reviews with helpful status if user is authenticated
    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          providerId,
          isVisible: true,
        },
        include: {
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          reviewMedia: {
            orderBy: { displayOrder: 'asc' },
          },
          helpfulMarks: userId
            ? {
                where: { userId },
                select: { id: true },
              }
            : false,
        },
        orderBy: [{ isFeatured: 'desc' }, { createdAt: 'desc' }],
        skip,
        take: limit,
      }),
      prisma.review.count({
        where: {
          providerId,
          isVisible: true,
        },
      }),
    ]);

    // Calculate average rating and distribution
    const allReviews = await prisma.review.findMany({
      where: {
        providerId,
        isVisible: true,
      },
      select: { overallRating: true },
    });

    const averageRating =
      allReviews.length > 0
        ? allReviews.reduce((sum, r) => sum + r.overallRating, 0) / allReviews.length
        : 0;

    const ratingDistribution: RatingDistribution = {
      5: allReviews.filter((r) => r.overallRating === 5).length,
      4: allReviews.filter((r) => r.overallRating === 4).length,
      3: allReviews.filter((r) => r.overallRating === 3).length,
      2: allReviews.filter((r) => r.overallRating === 2).length,
      1: allReviews.filter((r) => r.overallRating === 1).length,
    };

    const formattedReviews = reviews.map((review) => {
      const formatted = this.formatReview(review);
      if (userId && 'helpfulMarks' in review) {
        formatted.isHelpful = (review.helpfulMarks as { id: string }[]).length > 0;
      }
      return formatted;
    });

    return {
      message: 'Reviews retrieved successfully',
      reviews: formattedReviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
      averageRating: Math.round(averageRating * 100) / 100,
      ratingDistribution,
    };
  }

  /**
   * Get reviews created by a specific client
   */
  async getReviewsByClient(
    clientId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<{
    reviews: Review[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      prisma.review.findMany({
        where: { clientId },
        include: {
          booking: {
            include: {
              service: { select: { id: true, title: true } },
              provider: { select: { id: true, businessName: true, slug: true } },
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              avatarUrl: true,
            },
          },
          reviewMedia: {
            orderBy: { displayOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.review.count({ where: { clientId } }),
    ]);

    return {
      reviews: reviews.map((r) => ({
        ...this.formatReview(r),
        provider: { businessName: r.booking.provider.businessName, slug: r.booking.provider.slug },
        service: { title: r.booking.service.title },
      })) as Review[],
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Get single review by ID
   */
  async getReviewById(reviewId: string, userId?: string): Promise<Review> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        reviewMedia: {
          orderBy: { displayOrder: 'asc' },
        },
        helpfulMarks: userId
          ? {
              where: { userId },
              select: { id: true },
            }
          : false,
      },
    });

    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    const formatted = this.formatReview(review);
    if (userId && 'helpfulMarks' in review) {
      formatted.isHelpful = (review.helpfulMarks as { id: string }[]).length > 0;
    }

    return formatted;
  }

  /**
   * Update a review (client only)
   */
  async updateReview(reviewId: string, userId: string, data: UpdateReviewRequest): Promise<Review> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    if (review.clientId !== userId) {
      throw new AppError(403, 'Not authorized to update this review');
    }

    // Enforce 24-hour edit window (per requirements C.6)
    const hoursSinceCreation = (Date.now() - review.createdAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceCreation > 24) {
      throw new AppError(400, 'Reviews can only be edited within 24 hours of posting');
    }

    // Validate ratings if provided
    if (
      (data.overallRating && (data.overallRating < 1 || data.overallRating > 5)) ||
      (data.qualityRating && (data.qualityRating < 1 || data.qualityRating > 5)) ||
      (data.timelinessRating && (data.timelinessRating < 1 || data.timelinessRating > 5)) ||
      (data.professionalismRating &&
        (data.professionalismRating < 1 || data.professionalismRating > 5))
    ) {
      throw new AppError(400, 'Ratings must be between 1 and 5');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        overallRating: data.overallRating,
        qualityRating: data.qualityRating,
        timelinessRating: data.timelinessRating,
        professionalismRating: data.professionalismRating,
        reviewText: data.reviewText,
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        reviewMedia: true,
      },
    });

    // Update provider rating if overall rating changed
    if (data.overallRating && data.overallRating !== review.overallRating) {
      this.updateProviderRating(review.providerId).catch((err) => {
        console.error('Failed to update provider rating:', err);
      });
    }

    return this.formatReview(updatedReview);
  }

  /**
   * Delete a review (client only)
   */
  async deleteReview(reviewId: string, userId: string): Promise<void> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    if (review.clientId !== userId) {
      throw new AppError(403, 'Not authorized to delete this review');
    }

    await prisma.review.delete({
      where: { id: reviewId },
    });

    // Update provider rating asynchronously
    this.updateProviderRating(review.providerId).catch((err) => {
      console.error('Failed to update provider rating:', err);
    });
  }

  /**
   * Add provider response to review
   */
  async addProviderResponse(
    reviewId: string,
    providerId: string,
    response: string
  ): Promise<Review> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    if (review.providerId !== providerId) {
      throw new AppError(403, 'Not authorized to respond to this review');
    }

    if (!response || response.trim().length === 0) {
      throw new AppError(400, 'Response cannot be empty');
    }

    const updatedReview = await prisma.review.update({
      where: { id: reviewId },
      data: {
        providerResponse: response,
        providerResponseDate: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
        reviewMedia: true,
      },
    });

    return this.formatReview(updatedReview);
  }

  /**
   * Toggle helpful mark on review
   */
  async toggleHelpful(
    reviewId: string,
    userId: string
  ): Promise<{ helpful: boolean; helpfulCount: number }> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new AppError(404, 'Review not found');
    }

    // Check if user already marked as helpful
    const existingMark = await prisma.reviewHelpful.findUnique({
      where: {
        reviewId_userId: {
          reviewId,
          userId,
        },
      },
    });

    let helpful: boolean;
    let helpfulCount: number;

    if (existingMark) {
      // Remove helpful mark
      await prisma.$transaction([
        prisma.reviewHelpful.delete({
          where: { id: existingMark.id },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { decrement: 1 } },
        }),
      ]);
      helpful = false;
      helpfulCount = review.helpfulCount - 1;
    } else {
      // Add helpful mark
      await prisma.$transaction([
        prisma.reviewHelpful.create({
          data: {
            reviewId,
            userId,
          },
        }),
        prisma.review.update({
          where: { id: reviewId },
          data: { helpfulCount: { increment: 1 } },
        }),
      ]);
      helpful = true;
      helpfulCount = review.helpfulCount + 1;
    }

    return { helpful, helpfulCount };
  }

  /**
   * Update provider average rating and total reviews
   */
  async updateProviderRating(providerId: string): Promise<void> {
    const reviews = await prisma.review.findMany({
      where: {
        providerId,
        isVisible: true,
      },
      select: { overallRating: true },
    });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0 ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / totalReviews : 0;

    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        totalReviews,
        averageRating,
      },
    });
  }

  /**
   * Format review for API response
   */
  private formatReview(review: {
    id: string;
    bookingId: string;
    clientId: string;
    providerId: string;
    overallRating: number;
    qualityRating: number | null;
    timelinessRating: number | null;
    professionalismRating: number | null;
    reviewText: string | null;
    providerResponse: string | null;
    providerResponseDate: Date | null;
    isVerified: boolean;
    isVisible: boolean;
    isFeatured: boolean;
    helpfulCount: number;
    createdAt: Date;
    updatedAt: Date;
    client: {
      id: string;
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
    reviewMedia?: Array<{
      id: string;
      mediaType: string;
      fileUrl: string;
      thumbnailUrl: string | null;
      displayOrder: number;
    }>;
  }): Review {
    return {
      id: review.id,
      bookingId: review.bookingId,
      clientId: review.clientId,
      clientName: `${review.client.firstName} ${review.client.lastName}`,
      clientAvatarUrl: review.client.avatarUrl || undefined,
      providerId: review.providerId,
      overallRating: review.overallRating,
      qualityRating: review.qualityRating || undefined,
      timelinessRating: review.timelinessRating || undefined,
      professionalismRating: review.professionalismRating || undefined,
      reviewText: review.reviewText || undefined,
      providerResponse: review.providerResponse || undefined,
      providerResponseDate: review.providerResponseDate
        ? review.providerResponseDate.toISOString()
        : undefined,
      isVerified: review.isVerified,
      isVisible: review.isVisible,
      isFeatured: review.isFeatured,
      helpfulCount: review.helpfulCount,
      media: review.reviewMedia
        ? review.reviewMedia.map((m) => ({
            id: m.id,
            mediaType: m.mediaType,
            fileUrl: m.fileUrl,
            thumbnailUrl: m.thumbnailUrl || undefined,
            displayOrder: m.displayOrder,
          }))
        : [],
      createdAt: review.createdAt.toISOString(),
      updatedAt: review.updatedAt.toISOString(),
    };
  }
}

export const reviewService = new ReviewService();
