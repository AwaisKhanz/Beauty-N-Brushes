import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { subscriptionService } from '../services/subscription.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type {
  SubscriptionConfigResponse,
  UpdateSubscriptionConfigRequest,
} from '../../../shared-types';
import { z } from 'zod';

/**
 * Get subscription configuration
 * Public endpoint - anyone can view trial settings
 */
export async function getSubscriptionConfig(
  _req: AuthRequest,
  res: Response<{ config: SubscriptionConfigResponse }>,
  next: NextFunction
): Promise<void> {
  try {
    const config = await subscriptionService.getSubscriptionConfig();

    sendSuccess<{ config: SubscriptionConfigResponse }>(res, { config });
  } catch (error) {
    next(error);
  }
}

/**
 * Update subscription configuration
 * Admin-only endpoint
 */
export async function updateSubscriptionConfig(
  req: AuthRequest,
  res: Response<{ config: SubscriptionConfigResponse }>,
  next: NextFunction
): Promise<void> {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      throw new AppError(403, 'Admin access required');
    }

    const schema = z.object({
      trialEnabled: z.boolean().optional(),
      trialDurationDays: z.number().int().min(1).max(365).optional(),
    });

    const data = schema.parse(req.body) as UpdateSubscriptionConfigRequest;

    if (Object.keys(data).length === 0) {
      throw new AppError(400, 'At least one field must be provided');
    }

    const config = await subscriptionService.updateSubscriptionConfig(data);

    sendSuccess<{ config: SubscriptionConfigResponse }>(res, {
      config,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}
