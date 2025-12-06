import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { settingsService } from '../services/settings.service';
import { AppError } from '../middleware/errorHandler';
import { stripe } from '../lib/stripe';
import { prisma } from '../config/database';
import { z } from 'zod';
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
  BrandingSettingsResponse,
  UpdateBrandingRequest,
  LocationSettingsResponse,
  UpdateLocationRequest,
  BusinessDetailsResponse,
  UpdateBusinessDetailsSettingsRequest,
  GoogleCalendarConnectionResponse,
  ChangeTierRequest,
  ChangeTierResponse,
  CancelSubscriptionRequest,
  CancelSubscriptionResponse,
} from '../../../shared-types';

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
      profilePhotoUrl: z.string().url().optional().nullable(),
      coverPhotoUrl: z.string().url().optional().nullable(),
      // Business Details
      businessType: z.string().optional().nullable(),
      timezone: z.string().optional().nullable(),
      // Business Address
      addressLine1: z.string().optional().nullable(),
      addressLine2: z.string().optional().nullable(),
      city: z.string().optional().nullable(),
      state: z.string().optional().nullable(),
      zipCode: z.string().optional().nullable(),
      country: z.string().optional().nullable(),
      businessPhone: z.string().optional().nullable(),
      businessEmail: z.string().email().optional().nullable(),
      // Google Places
      placeId: z.string().optional().nullable(),
      formattedAddress: z.string().optional().nullable(),
      addressComponents: z.any().optional().nullable(),
      latitude: z.number().optional().nullable(),
      longitude: z.number().optional().nullable(),
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
 * Create SetupIntent for provider payment method
 * POST /api/v1/settings/payment-method/setup-intent
 */
export async function createSetupIntent(
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
      select: {
        id: true,
        paymentProvider: true,
        stripeCustomerId: true,
        regionCode: true,
        user: {
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const regionCode = profile.regionCode as 'NA' | 'EU' | 'GH' | 'NG';
    const isStripe = regionCode === 'NA' || regionCode === 'EU';

    if (!isStripe) {
      throw new AppError(400, 'SetupIntent only available for Stripe regions');
    }

    let stripeCustomerId = profile.stripeCustomerId;

    // Check if customer ID is a trial placeholder (starts with 'trial_customer_')
    const isTrialPlaceholder = stripeCustomerId?.startsWith('trial_customer_');

    // Create real Stripe customer if doesn't exist or is a trial placeholder
    if (!stripeCustomerId || isTrialPlaceholder) {
      const customer = await stripe.customers.create({
        email: profile.user.email,
        name: `${profile.user.firstName} ${profile.user.lastName}`,
        metadata: {
          providerId: profile.id,
          userId: userId,
          type: 'provider',
        },
      });
      stripeCustomerId = customer.id;

      // Update profile with real customer ID
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: { stripeCustomerId },
      });
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    sendSuccess(res, {
      message: 'SetupIntent created successfully',
      clientSecret: setupIntent.client_secret || '',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update payment method
 * POST /api/v1/settings/payment-method
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

/**
 * Get branding settings
 */
export async function getBrandingSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const branding = await settingsService.getBrandingSettings(userId);

    sendSuccess<BrandingSettingsResponse>(res, {
      message: 'Branding settings retrieved',
      branding: branding as BrandingSettingsResponse['branding'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update branding settings
 */
export async function updateBrandingSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      logoUrl: z.string().url().optional().nullable(),
      brandColorPrimary: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional()
        .nullable(),
      brandColorSecondary: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional()
        .nullable(),
      brandColorAccent: z
        .string()
        .regex(/^#[0-9A-F]{6}$/i)
        .optional()
        .nullable(),
      brandFontHeading: z.string().max(100).optional().nullable(),
      brandFontBody: z.string().max(100).optional().nullable(),
    });

    const data = schema.parse(req.body) as UpdateBrandingRequest;

    const branding = await settingsService.updateBrandingSettings(userId, data);

    sendSuccess<BrandingSettingsResponse>(res, {
      message: 'Branding settings updated successfully',
      branding: branding as BrandingSettingsResponse['branding'],
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
 * Get location settings
 */
export async function getLocationSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const location = await settingsService.getLocationSettings(userId);

    sendSuccess<LocationSettingsResponse>(res, {
      message: 'Location settings retrieved',
      location: location as LocationSettingsResponse['location'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update location settings
 */
export async function updateLocationSettings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      addressLine1: z.string().max(255).optional(),
      addressLine2: z.string().max(255).optional().nullable(),
      city: z.string().max(100).optional(),
      state: z.string().max(50).optional(),
      zipCode: z.string().max(20).optional(),
      country: z.string().max(50).optional(),
      businessPhone: z.string().max(20).optional(),
      latitude: z.number().min(-90).max(90).optional().nullable(),
      longitude: z.number().min(-180).max(180).optional().nullable(),
    });

    const data = schema.parse(req.body) as UpdateLocationRequest;

    const location = await settingsService.updateLocationSettings(userId, data);

    sendSuccess<LocationSettingsResponse>(res, {
      message: 'Location settings updated successfully',
      location: location as LocationSettingsResponse['location'],
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
 * Get business details
 */
export async function getBusinessDetails(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const details = await settingsService.getBusinessDetails(userId);

    sendSuccess<BusinessDetailsResponse>(res, {
      message: 'Business details retrieved',
      details: details as BusinessDetailsResponse['details'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update business details
 */
export async function updateBusinessDetails(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      businessPhone: z.string().max(20).optional(),
      businessType: z.string().max(50).optional(),
      licenseNumber: z.string().max(100).optional().nullable(),
      timezone: z.string().max(100).optional(),
    });

    const data = schema.parse(req.body) as UpdateBusinessDetailsSettingsRequest;

    const details = await settingsService.updateBusinessDetails(userId, data);

    sendSuccess<BusinessDetailsResponse>(res, {
      message: 'Business details updated successfully',
      details: details as BusinessDetailsResponse['details'],
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
 * Get Google Calendar connection status
 */
export async function getGoogleCalendarStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const status = await settingsService.getGoogleCalendarStatus(userId);

    sendSuccess<GoogleCalendarConnectionResponse>(res, status);
  } catch (error) {
    next(error);
  }
}

/**
 * Change subscription tier
 */
export async function changeSubscriptionTier(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      newTier: z.enum(['solo', 'salon']),
    });

    const data = schema.parse(req.body) as ChangeTierRequest;

    const result = await settingsService.changeSubscriptionTier(userId, data);

    sendSuccess<ChangeTierResponse>(res, result);
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
 * Cancel subscription
 */
export async function cancelSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      reason: z.string().optional(),
      feedback: z.string().optional(),
    });

    const data = schema.parse(req.body) as CancelSubscriptionRequest;

    const result = await settingsService.cancelSubscription(userId, data);

    sendSuccess<CancelSubscriptionResponse>(res, result);
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
 * Resume subscription
 */
export async function resumeSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const result = await settingsService.resumeSubscription(userId);

    sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
