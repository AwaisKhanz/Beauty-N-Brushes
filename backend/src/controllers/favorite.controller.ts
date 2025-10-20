/**
 * Favorite Controller
 * Handles client favorites operations
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';
import type {
  ToggleFavoriteRequest,
  ToggleFavoriteResponse,
  GetFavoritesResponse,
  FavoriteProvider,
} from '../../../shared-types';
import { z } from 'zod';

/**
 * Toggle favorite provider
 */
export async function toggleFavorite(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      providerId: z.string().uuid(),
    });

    const { providerId } = schema.parse(req.body) as ToggleFavoriteRequest;

    // Check if provider exists
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
    });

    if (!provider) {
      throw new AppError(404, 'Provider not found');
    }

    // Check if already favorited
    const existingFavorite = await prisma.favorite.findUnique({
      where: {
        clientId_providerId: {
          clientId: userId,
          providerId,
        },
      },
    });

    let isFavorited: boolean;

    if (existingFavorite) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existingFavorite.id },
      });
      isFavorited = false;
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: {
          clientId: userId,
          providerId,
        },
      });
      isFavorited = true;
    }

    sendSuccess<ToggleFavoriteResponse>(
      res,
      {
        message: isFavorited ? 'Provider added to favorites' : 'Provider removed from favorites',
        isFavorited,
      },
      200
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Get all favorites for client
 */
export async function getFavorites(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const favorites = await prisma.favorite.findMany({
      where: { clientId: userId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            logoUrl: true,
            averageRating: true,
            totalReviews: true,
            city: true,
            state: true,
            serviceSpecializations: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const favoritesData: FavoriteProvider[] = favorites.map((f: any) => ({
      id: f.id,
      providerId: f.provider.id,
      businessName: f.provider.businessName || '',
      slug: f.provider.slug,
      logoUrl: f.provider.logoUrl,
      averageRating: Number(f.provider.averageRating),
      totalReviews: f.provider.totalReviews,
      city: f.provider.city,
      state: f.provider.state,
      specializations: f.provider.serviceSpecializations,
      addedAt: f.createdAt.toISOString(),
    }));

    sendSuccess<GetFavoritesResponse>(res, {
      message: 'Favorites retrieved',
      favorites: favoritesData,
      total: favoritesData.length,
    });
  } catch (error) {
    next(error);
  }
}
