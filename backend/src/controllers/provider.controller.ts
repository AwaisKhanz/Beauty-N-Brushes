import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { providerService } from '../services/provider.service';

/**
 * Pause provider profile
 */
export async function pauseProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { reason } = req.body;

    const profile = await providerService.pauseProfile(userId, reason);

    sendSuccess(res, {
      message: 'Profile paused successfully. New bookings are now disabled.',
      profile,
    });
  } catch (error) {
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await providerService.resumeProfile(userId);

    sendSuccess(res, {
      message: 'Profile resumed successfully. You can now accept new bookings.',
      profile,
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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userRole = (req as any).user?.role;

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
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userRole = (req as any).user?.role;

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
