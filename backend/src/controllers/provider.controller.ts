import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { providerService } from '../services/provider.service';
import type { AuthRequest } from '../types';
import type {
  PauseProfileRequest,
  PauseProfileResponse,
  ResumeProfileResponse,
  GetPublicProviderProfileResponse,
} from '../../../shared-types';
import { z } from 'zod';

/**
 * Pause provider profile
 */
export async function pauseProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      reason: z.string().optional(),
    });

    const data = schema.parse(req.body) as PauseProfileRequest;

    const profile = await providerService.pauseProfile(userId, data.reason);

    sendSuccess<PauseProfileResponse>(res, {
      message: 'Profile paused successfully. New bookings are now disabled.',
      profile: {
        id: profile.id,
        isPaused: profile.profilePaused || false,
        pausedAt: profile.pausedAt?.toISOString() || new Date().toISOString(),
        pauseReason: profile.pauseReason || undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message === 'Profile is already paused') {
        return next(new AppError(400, error.message));
      }
    }
    next(error);
  }
}

/**
 * Resume provider profile
 */
export async function resumeProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await providerService.resumeProfile(userId);

    sendSuccess<ResumeProfileResponse>(res, {
      message: 'Profile resumed successfully. You can now accept new bookings.',
      profile: {
        id: profile.id,
        isPaused: profile.profilePaused || false,
        resumedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message === 'Profile is not paused') {
        return next(new AppError(400, error.message));
      }
    }
    next(error);
  }
}

/**
 * Deactivate provider (Admin only)
 */
export async function deactivateProvider(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const { providerId } = req.params;
    const { reason } = req.body;

    if (!providerId) {
      throw new AppError(400, 'Provider ID required');
    }

    if (!reason) {
      throw new AppError(400, 'Reason for deactivation required');
    }

    const result = await providerService.deactivateProvider(providerId, reason);

    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Reactivate provider (Admin only)
 */
export async function reactivateProvider(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userRole = req.user?.role;

    if (userRole !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const { providerId } = req.params;

    if (!providerId) {
      throw new AppError(400, 'Provider ID required');
    }

    const result = await providerService.reactivateProvider(providerId);

    sendSuccess(res, result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * PUBLIC: Get provider public profile by slug
 */
export async function getPublicProfile(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { slug } = req.params;

    if (!slug) {
      throw new AppError(400, 'Provider slug required');
    }

    const result = await providerService.getPublicProfile(slug);

    sendSuccess<GetPublicProviderProfileResponse>(res, result);
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider not found') {
      return next(new AppError(404, 'Provider not found'));
    }
    next(error);
  }
}
