import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { settingsService } from '../services/settings.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type {
  ProviderSettingsResponse,
  ProviderPoliciesResponse,
  SubscriptionInfoResponse,
  NotificationSettingsResponse,
  UpdateProfileSettingsRequest,
  UpdateBookingSettingsRequest,
  UpdatePoliciesRequest,
  UpdateNotificationSettingsRequest,
  UpdateAccountRequest,
  UpdatePaymentMethodRequest,
} from '../../../shared-types';
import { z } from 'zod';

/**
 * Get profile settings
 */
export async function getProfileSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const profile = await settingsService.getProfileSettings(userId);

    sendSuccess<ProviderSettingsResponse>(res, {
      message: 'Profile settings retrieved',
      profile: profile as ProviderSettingsResponse['profile'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update profile settings
 */
export async function updateProfileSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      businessName: z.string().min(2).max(255).optional(),
      tagline: z.string().max(255).optional().nullable(),
      description: z.string().optional().nullable(),
      yearsExperience: z.number().int().min(0).max(99).optional().nullable(),
      websiteUrl: z.string().url().optional().nullable(),
      instagramHandle: z.string().max(100).optional().nullable(),
      tiktokHandle: z.string().max(100).optional().nullable(),
      facebookUrl: z.string().url().optional().nullable(),
    });

    const data = schema.parse(req.body) as UpdateProfileSettingsRequest;

    const profile = await settingsService.updateProfileSettings(userId, data);

    sendSuccess<ProviderSettingsResponse>(res, {
      message: 'Profile settings updated successfully',
      profile: profile as ProviderSettingsResponse['profile'],
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

/**
 * Get booking settings
 */
export async function getBookingSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const profile = await settingsService.getBookingSettings(userId);

    sendSuccess<ProviderSettingsResponse>(res, {
      message: 'Booking settings retrieved',
      profile: profile as ProviderSettingsResponse['profile'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update booking settings
 */
export async function updateBookingSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      instantBookingEnabled: z.boolean().optional(),
      acceptsNewClients: z.boolean().optional(),
      mobileServiceAvailable: z.boolean().optional(),
      advanceBookingDays: z.number().int().min(1).max(365).optional(),
      minAdvanceHours: z.number().int().min(0).max(168).optional(),
      bookingBufferMinutes: z.number().int().min(0).max(120).optional(),
      sameDayBookingEnabled: z.boolean().optional(),
      parkingAvailable: z.boolean().optional().nullable(),
      wheelchairAccessible: z.boolean().optional().nullable(),
    });

    const data = schema.parse(req.body) as UpdateBookingSettingsRequest;

    const profile = await settingsService.updateBookingSettings(userId, data);

    sendSuccess<ProviderSettingsResponse>(res, {
      message: 'Booking settings updated successfully',
      profile: profile as ProviderSettingsResponse['profile'],
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

/**
 * Get policies
 */
export async function getPolicies(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const policies = await settingsService.getPolicies(userId);

    sendSuccess<ProviderPoliciesResponse>(res, {
      message: 'Policies retrieved',
      policies: policies as unknown as ProviderPoliciesResponse['policies'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update policies
 */
export async function updatePolicies(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      cancellationWindowHours: z.number().int().min(0).max(168).optional(),
      cancellationFeePercentage: z.number().min(0).max(100).optional(),
      cancellationPolicyText: z.string().optional().nullable(),
      lateGracePeriodMinutes: z.number().int().min(0).max(60).optional(),
      lateCancellationAfterMinutes: z.number().int().min(0).max(60).optional(),
      latePolicyText: z.string().optional().nullable(),
      noShowFeePercentage: z.number().min(0).max(100).optional(),
      noShowPolicyText: z.string().optional().nullable(),
      rescheduleAllowed: z.boolean().optional(),
      rescheduleWindowHours: z.number().int().min(0).max(168).optional(),
      maxReschedules: z.number().int().min(0).max(10).optional(),
      reschedulePolicyText: z.string().optional().nullable(),
      refundPolicyText: z.string().optional().nullable(),
      consultationRequired: z.boolean().optional(),
      requiresClientProducts: z.boolean().optional(),
      touchUpPolicyText: z.string().optional().nullable(),
    });

    const data = schema.parse(req.body) as UpdatePoliciesRequest;

    const policies = await settingsService.updatePolicies(userId, data);

    sendSuccess<ProviderPoliciesResponse>(res, {
      message: 'Policies updated successfully',
      policies: policies as unknown as ProviderPoliciesResponse['policies'],
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

/**
 * Get subscription info
 */
export async function getSubscriptionInfo(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const subscription = await settingsService.getSubscriptionInfo(userId);

    sendSuccess<SubscriptionInfoResponse>(res, subscription);
  } catch (error) {
    next(error);
  }
}

/**
 * Update payment method
 */
export async function updatePaymentMethod(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      paymentMethodId: z.string().min(1),
      region: z.enum(['NA', 'EU', 'GH', 'NG']),
    });

    const data = schema.parse(req.body) as UpdatePaymentMethodRequest;

    await settingsService.updatePaymentMethod(userId, data.paymentMethodId, data.region);

    sendSuccess(res, {
      message: 'Payment method updated successfully',
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

/**
 * Get notification settings
 */
export async function getNotificationSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const settings = await settingsService.getNotificationSettings(userId);

    sendSuccess<NotificationSettingsResponse>(res, settings);
  } catch (error) {
    next(error);
  }
}

/**
 * Update notification settings
 */
export async function updateNotificationSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      emailNotifications: z.boolean().optional(),
      smsNotifications: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as UpdateNotificationSettingsRequest;

    await settingsService.updateNotificationSettings(userId, data);

    sendSuccess(res, {
      message: 'Notification settings updated successfully',
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

/**
 * Update account settings
 */
export async function updateAccount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z
      .object({
        email: z.string().email().optional(),
        phone: z.string().optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(8).optional(),
      })
      .refine(
        (data) => {
          // If newPassword is provided, currentPassword must also be provided
          if (data.newPassword && !data.currentPassword) {
            return false;
          }
          return true;
        },
        {
          message: 'Current password required when updating password',
          path: ['currentPassword'],
        }
      );

    const data = schema.parse(req.body) as UpdateAccountRequest;

    await settingsService.updateAccount(userId, data);

    sendSuccess(res, {
      message: 'Account updated successfully',
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

/**
 * Deactivate account
 */
export async function deactivateAccount(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    await settingsService.deactivateAccount(userId);

    sendSuccess(res, {
      message: 'Account deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
}
