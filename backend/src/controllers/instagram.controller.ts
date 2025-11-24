import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { instagramService } from '../lib/instagram';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';
import type {
  ConnectInstagramResponse,
  ImportInstagramMediaResponse,
  DisconnectInstagramResponse,
  InstagramMedia,
} from '../../../shared-types';

/**
 * Initiate Instagram OAuth flow
 */
export async function connectInstagram(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Use userId as state to verify callback
    const authUrl = instagramService.getAuthorizationUrl(userId);

    sendSuccess<ConnectInstagramResponse>(res, {
      authUrl,
      message: 'Redirect user to Instagram authorization',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle Instagram OAuth callback
 */
export async function handleCallback(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { code, state } = req.query;

    if (!code || typeof code !== 'string') {
      throw new AppError(400, 'Authorization code required');
    }

    if (!state || typeof state !== 'string') {
      throw new AppError(400, 'Invalid state parameter');
    }

    const userId = state; // State contains userId

    // Exchange code for access token
    const authResponse = await instagramService.exchangeCodeForToken(code);

    // Get long-lived token
    const longLivedToken = await instagramService.getLongLivedToken(authResponse.access_token);

    // Calculate expiry date (60 days from now)
    const expiryDate = new Date();
    expiryDate.setSeconds(expiryDate.getSeconds() + longLivedToken.expires_in);

    // Find provider profile
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Create or update Instagram connection
    const existingConnection = await prisma.instagramConnection.findUnique({
      where: { providerId: profile.id },
    });

    if (existingConnection) {
      await prisma.instagramConnection.update({
        where: { id: existingConnection.id },
        data: {
          instagramUserId: authResponse.user_id.toString(),
          instagramUsername: authResponse.username || 'unknown',
          accessToken: longLivedToken.access_token,
          tokenExpiresAt: expiryDate,
          syncStatus: 'connected',
        },
      });
    } else {
      await prisma.instagramConnection.create({
        data: {
          providerId: profile.id,
          instagramUserId: authResponse.user_id.toString(),
          instagramUsername: authResponse.username || 'unknown',
          accessToken: longLivedToken.access_token,
          tokenExpiresAt: expiryDate,
          syncStatus: 'connected',
        },
      });
    }

    // Also update legacy fields in ProviderProfile for backward compatibility
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        instagramAccessToken: longLivedToken.access_token,
        instagramUserId: authResponse.user_id.toString(),
        instagramTokenExpiry: expiryDate,
      },
    });

    // Redirect to success page
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    res.redirect(`${frontendUrl}/provider/settings/profile?instagram=connected`);
  } catch (error) {
    if (error instanceof Error) {
      console.error('Instagram OAuth error:', error.message);
      // Redirect to error page
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      res.redirect(`${frontendUrl}/onboarding/profile-media?instagram=error`);
    } else {
      next(error);
    }
  }
}

/**
 * Get Instagram media (fetch from Instagram, don't save yet)
 */
export async function getMedia(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        instagramConnection: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const connection = profile.instagramConnection;

    if (!connection) {
      throw new AppError(400, 'Instagram not connected');
    }

    // Check if token is expired
    if (connection.tokenExpiresAt < new Date()) {
      throw new AppError(400, 'Instagram token expired. Please reconnect.');
    }

    // Fetch media from Instagram
    const media = await instagramService.getUserMedia(connection.accessToken, 25);

    // Filter images and videos
    const validMedia = media.filter(
      (item) => item.media_type === 'IMAGE' || item.media_type === 'VIDEO'
    ) as InstagramMedia[];

    sendSuccess<ImportInstagramMediaResponse>(res, {
      message: 'Instagram media fetched successfully',
      media: validMedia,
      total: validMedia.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Import selected Instagram media to platform
 */
export async function importMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { mediaIds } = req.body;

    if (!mediaIds || !Array.isArray(mediaIds) || mediaIds.length === 0) {
      throw new AppError(400, 'Media IDs required');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        instagramConnection: true,
      },
    });

    if (!profile || !profile.instagramConnection) {
      throw new AppError(404, 'Instagram not connected');
    }

    const connection = profile.instagramConnection;

    // Fetch media details from Instagram
    const media = await instagramService.getUserMedia(connection.accessToken, 50);
    const selectedMedia = media.filter((m) => mediaIds.includes(m.id));

    // Import media to database
    const imported = await Promise.all(
      selectedMedia.map(async (item) => {
        // Check if already imported
        const existing = await prisma.instagramMediaImport.findUnique({
          where: { instagramMediaId: item.id },
        });

        if (existing) {
          return existing;
        }

        return prisma.instagramMediaImport.create({
          data: {
            connectionId: connection.id,
            providerId: profile.id,
            instagramMediaId: item.id,
            mediaUrl: item.media_url,
            mediaType: item.media_type.toLowerCase(),
            thumbnailUrl: item.thumbnail_url,
            caption: item.caption,
          },
        });
      })
    );

    // Update last sync time
    await prisma.instagramConnection.update({
      where: { id: connection.id },
      data: { lastSyncAt: new Date() },
    });

    sendSuccess(res, {
      message: 'Media imported successfully',
      imported: imported.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get imported Instagram media from database
 */
export async function getImportedMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const importedMedia = await prisma.instagramMediaImport.findMany({
      where: { providerId: profile.id },
      orderBy: { importedAt: 'desc' },
      include: {
        service: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    sendSuccess(res, {
      message: 'Imported media retrieved successfully',
      media: importedMedia.map((m) => ({
        id: m.id,
        instagramMediaId: m.instagramMediaId,
        mediaUrl: m.mediaUrl,
        mediaType: m.mediaType,
        thumbnailUrl: m.thumbnailUrl,
        caption: m.caption,
        linkedToServiceId: m.linkedToServiceId,
        linkedToPortfolio: m.linkedToPortfolio,
        service: m.service ? { id: m.service.id, title: m.service.title } : null,
        importedAt: m.importedAt.toISOString(),
      })),
      total: importedMedia.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Link Instagram media to service
 */
export async function linkMediaToService(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { mediaId, serviceId } = req.body;

    if (!mediaId || !serviceId) {
      throw new AppError(400, 'Media ID and Service ID required');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Verify media and service belong to provider
    const [media, service] = await Promise.all([
      prisma.instagramMediaImport.findUnique({
        where: { id: mediaId },
      }),
      prisma.service.findUnique({
        where: { id: serviceId },
      }),
    ]);

    if (!media || media.providerId !== profile.id) {
      throw new AppError(404, 'Media not found or access denied');
    }

    if (!service || service.providerId !== profile.id) {
      throw new AppError(404, 'Service not found or access denied');
    }

    // Link media to service
    await prisma.instagramMediaImport.update({
      where: { id: mediaId },
      data: {
        linkedToServiceId: serviceId,
        linkedToPortfolio: true,
      },
    });

    sendSuccess(res, {
      message: 'Media linked to service successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Disconnect Instagram
 */
export async function disconnectInstagram(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Delete Instagram connection (cascade will delete media imports)
    await prisma.instagramConnection.deleteMany({
      where: { providerId: profile.id },
    });

    // Also clear legacy fields in ProviderProfile
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        instagramAccessToken: null,
        instagramUserId: null,
        instagramTokenExpiry: null,
      },
    });

    sendSuccess<DisconnectInstagramResponse>(res, {
      message: 'Instagram disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
}
