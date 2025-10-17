import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { instagramService } from '../lib/instagram';
import { prisma } from '../config/database';

/**
 * Initiate Instagram OAuth flow
 */
export async function connectInstagram(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Use userId as state to verify callback
    const authUrl = instagramService.getAuthorizationUrl(userId);

    sendSuccess(res, {
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
  req: Request,
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

    // Save Instagram connection to provider profile
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
    res.redirect(`${frontendUrl}/onboarding/profile-media?instagram=connected`);
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
 * Import Instagram media
 */
export async function importMedia(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    if (!profile.instagramAccessToken) {
      throw new AppError(400, 'Instagram not connected');
    }

    // Check if token is expired
    if (profile.instagramTokenExpiry && profile.instagramTokenExpiry < new Date()) {
      throw new AppError(400, 'Instagram token expired. Please reconnect.');
    }

    // Fetch media from Instagram
    const media = await instagramService.getUserMedia(profile.instagramAccessToken, 25);

    // Filter only images
    const imageMedia = media.filter((item) => item.media_type === 'IMAGE');

    sendSuccess(res, {
      message: 'Instagram media fetched successfully',
      media: imageMedia,
      total: imageMedia.length,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Disconnect Instagram
 */
export async function disconnectInstagram(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Remove Instagram connection
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        instagramAccessToken: null,
        instagramUserId: null,
        instagramTokenExpiry: null,
      },
    });

    sendSuccess(res, {
      message: 'Instagram disconnected successfully',
    });
  } catch (error) {
    next(error);
  }
}
