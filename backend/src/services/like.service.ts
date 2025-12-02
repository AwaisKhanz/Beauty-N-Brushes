/**
 * Like Service
 * Handles provider and service likes
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { notificationService } from './notification.service';
import { emitLikeUpdate } from '../config/socket.server';
import type { LikeItem, GetLikesResponse } from '../../../shared-types';

class LikeService {
  /**
   * Toggle like on a provider
   */
  async toggleProviderLike(
    userId: string,
    providerId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    // Verify provider exists
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: { id: true, likeCount: true },
    });

    if (!provider) {
      throw new AppError(404, 'Provider not found');
    }

    // Check if user already liked
    const existingLike = await prisma.providerLike.findUnique({
      where: {
        providerId_userId: {
          providerId,
          userId,
        },
      },
    });

    let liked: boolean;
    let likeCount: number;

    if (existingLike) {
      // Unlike - remove like and decrement count
      await prisma.$transaction([
        prisma.providerLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.providerProfile.update({
          where: { id: providerId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      liked = false;
      likeCount = provider.likeCount - 1;
    } else {
      // Like - add like and increment count
      await prisma.$transaction([
        prisma.providerLike.create({
          data: {
            providerId,
            userId,
          },
        }),
        prisma.providerProfile.update({
          where: { id: providerId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      liked = true;
      likeCount = provider.likeCount + 1;

      // Send notification to provider about new like
      try {
        const providerUserId = await prisma.providerProfile.findUnique({
          where: { id: providerId },
          select: { userId: true },
        });

        if (providerUserId) {
          await notificationService.createProviderLikedNotification(
            providerUserId.userId,
            1,
            likeCount
          );

          emitLikeUpdate(providerUserId.userId, {
            type: 'provider_liked',
            likeCount: 1,
            totalLikes: likeCount,
          });
        }
      } catch (err) {
        console.error('Failed to send provider like notification:', err);
      }
    }

    return { liked, likeCount };
  }

  /**
   * Toggle like on a service
   */
  async toggleServiceLike(
    userId: string,
    serviceId: string
  ): Promise<{ liked: boolean; likeCount: number }> {
    // Verify service exists
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { id: true, likeCount: true },
    });

    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    // Check if user already liked
    const existingLike = await prisma.serviceLike.findUnique({
      where: {
        serviceId_userId: {
          serviceId,
          userId,
        },
      },
    });

    let liked: boolean;
    let likeCount: number;

    if (existingLike) {
      // Unlike - remove like and decrement count
      await prisma.$transaction([
        prisma.serviceLike.delete({
          where: { id: existingLike.id },
        }),
        prisma.service.update({
          where: { id: serviceId },
          data: { likeCount: { decrement: 1 } },
        }),
      ]);
      liked = false;
      likeCount = service.likeCount - 1;
    } else {
      // Like - add like and increment count
      await prisma.$transaction([
        prisma.serviceLike.create({
          data: {
            serviceId,
            userId,
          },
        }),
        prisma.service.update({
          where: { id: serviceId },
          data: { likeCount: { increment: 1 } },
        }),
      ]);
      liked = true;
      likeCount = service.likeCount + 1;

      // Send notification to provider about service like
      try {
        const serviceWithProvider = await prisma.service.findUnique({
          where: { id: serviceId },
          select: {
            title: true,
            provider: {
              select: { userId: true },
            },
          },
        });

        if (serviceWithProvider) {
          await notificationService.createServiceLikedNotification(
            serviceWithProvider.provider.userId,
            serviceWithProvider.title,
            1,
            serviceId
          );

          emitLikeUpdate(serviceWithProvider.provider.userId, {
            type: 'service_liked',
            serviceName: serviceWithProvider.title,
            serviceId,
            likeCount: 1,
          });
        }
      } catch (err) {
        console.error('Failed to send service like notification:', err);
      }
    }

    return { liked, likeCount };
  }

  /**
   * Get user's liked items (both providers and services)
   */
  async getUserLikes(
    userId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<GetLikesResponse> {
    const skip = (page - 1) * limit;

    // Get provider likes
    const [providerLikes, serviceLikes] = await Promise.all([
      prisma.providerLike.findMany({
        where: { userId },
        include: {
          provider: {
            select: {
              id: true,
              businessName: true,
              logoUrl: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.serviceLike.findMany({
        where: { userId },
        include: {
          service: {
            select: {
              id: true,
              title: true,
              media: {
                where: { isFeatured: true },
                select: { fileUrl: true },
                take: 1,
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Combine and sort all likes
    const allLikes: LikeItem[] = [
      ...providerLikes.map((like) => ({
        id: like.id,
        targetType: 'provider' as const,
        targetId: like.providerId,
        targetName: like.provider.businessName,
        targetImageUrl: like.provider.logoUrl || undefined,
        createdAt: like.createdAt.toISOString(),
      })),
      ...serviceLikes.map((like) => ({
        id: like.id,
        targetType: 'service' as const,
        targetId: like.serviceId,
        targetName: like.service.title,
        targetImageUrl: like.service.media[0]?.fileUrl || undefined,
        createdAt: like.createdAt.toISOString(),
      })),
    ];

    // Sort by createdAt descending
    allLikes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Paginate
    const total = allLikes.length;
    const paginatedLikes = allLikes.slice(skip, skip + limit);

    return {
      message: 'Likes retrieved successfully',
      likes: paginatedLikes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check if user has liked a specific target
   */
  async checkLikeStatus(
    userId: string,
    targetId: string,
    targetType: 'provider' | 'service'
  ): Promise<{ liked: boolean; likeCount: number }> {
    if (targetType === 'provider') {
      const [like, provider] = await Promise.all([
        prisma.providerLike.findUnique({
          where: {
            providerId_userId: {
              providerId: targetId,
              userId,
            },
          },
        }),
        prisma.providerProfile.findUnique({
          where: { id: targetId },
          select: { likeCount: true },
        }),
      ]);

      if (!provider) {
        throw new AppError(404, 'Provider not found');
      }

      return {
        liked: !!like,
        likeCount: provider.likeCount,
      };
    } else {
      const [like, service] = await Promise.all([
        prisma.serviceLike.findUnique({
          where: {
            serviceId_userId: {
              serviceId: targetId,
              userId,
            },
          },
        }),
        prisma.service.findUnique({
          where: { id: targetId },
          select: { likeCount: true },
        }),
      ]);

      if (!service) {
        throw new AppError(404, 'Service not found');
      }

      return {
        liked: !!like,
        likeCount: service.likeCount,
      };
    }
  }
}

export const likeService = new LikeService();
