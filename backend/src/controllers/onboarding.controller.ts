import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { onboardingService } from '../services/onboarding.service';
import { AppError } from '../middleware/errorHandler';
import { aiService } from '../lib/ai';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';
import type { CreateAccountTypeResponse } from '../../../shared-types';

/**
 * Create provider profile with account type
 */
export async function createAccountType(
  req: AuthRequest,
  res: Response<CreateAccountTypeResponse>,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { accountType } = req.body;

    if (!accountType || !['solo', 'salon'].includes(accountType)) {
      throw new AppError(400, 'Invalid account type. Must be "solo" or "salon"');
    }

    const profile = await onboardingService.createProviderProfile({
      userId,
      accountType,
    });

    sendSuccess<CreateAccountTypeResponse>(
      res,
      {
        message: 'Account type saved successfully',
        profile: {
          id: profile.id,
          isSalon: profile.isSalon,
        },
      },
      200 // Use 200 instead of 201 since it might be an update
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User must have PROVIDER role') {
        return next(new AppError(403, error.message));
      }
    }
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

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const {
      businessName,
      tagline,
      businessType,
      description,
      address,
      city,
      state,
      zipCode,
      country,
      phone,
      email,
      instagramHandle,
      website,
      serviceSpecializations,
      yearsExperience,
      latitude,
      longitude,
      additionalLocations,
    } = req.body;

    // Validate required fields
    if (!businessName || !address || !city || !state || !zipCode || !phone) {
      throw new AppError(400, 'Missing required business details');
    }

    const profile = await onboardingService.updateBusinessDetails(userId, {
      businessName,
      tagline,
      businessType,
      description,
      address,
      city,
      state,
      zipCode,
      country: country || 'US',
      phone,
      businessEmail: email,
      instagramHandle,
      website,
      serviceSpecializations: serviceSpecializations || [],
      yearsExperience,
      latitude,
      longitude,
      additionalLocations,
    });

    sendSuccess(res, {
      message: 'Business details updated successfully',
      profile,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(
        new AppError(
          404,
          'Provider profile not found. Please complete account type selection first.'
        )
      );
    }
    next(error);
  }
}

/**
 * Update brand customization
 */
export async function updateBrandCustomization(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const {
      brandColorPrimary,
      brandColorSecondary,
      brandColorAccent,
      brandFontHeading,
      brandFontBody,
    } = req.body;

    const profile = await onboardingService.updateBrandCustomization(userId, {
      brandColorPrimary,
      brandColorSecondary,
      brandColorAccent,
      brandFontHeading,
      brandFontBody,
    });

    sendSuccess(res, {
      message: 'Brand customization updated successfully',
      profile,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, 'Provider profile not found'));
    }
    next(error);
  }
}

/**
 * Setup payment and create subscription
 */
export async function setupPayment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { regionCode, paymentMethodId } = req.body;

    if (!regionCode || !['NA', 'EU', 'GH', 'NG'].includes(regionCode)) {
      throw new AppError(400, 'Valid region code required (NA, EU, GH, or NG)');
    }

    const result = await onboardingService.setupPayment(userId, regionCode, paymentMethodId);

    sendSuccess(res, {
      message: 'Payment setup completed successfully',
      subscription: result,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message.includes('Payment method ID required')) {
        return next(new AppError(400, error.message));
      }
    }
    next(error);
  }
}

/**
 * Save business policies
 */
export async function savePolicies(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { cancellationPolicy, lateArrivalPolicy, depositRequired, refundPolicy } = req.body;

    // Validate required fields
    if (
      !cancellationPolicy ||
      !lateArrivalPolicy ||
      !refundPolicy ||
      depositRequired === undefined
    ) {
      throw new AppError(400, 'Missing required policy fields');
    }

    // Note: depositType and depositAmount are NOT policy-level fields
    // They are configured per-service when creating services

    const policy = await onboardingService.savePolicies(userId, {
      cancellationPolicy,
      lateArrivalPolicy,
      depositRequired,
      refundPolicy,
    });

    sendSuccess(res, {
      message: 'Policies saved successfully',
      policy,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, 'Provider profile not found'));
    }
    next(error);
  }
}

/**
 * Setup availability schedule
 */
export async function setupAvailability(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const {
      schedule,
      timezone,
      advanceBookingDays,
      minimumNoticeHours,
      bufferMinutes,
      sameDayBooking,
    } = req.body;

    if (!schedule || !Array.isArray(schedule) || schedule.length === 0) {
      throw new AppError(400, 'Schedule required');
    }

    const result = await onboardingService.setupAvailability(userId, {
      schedule,
      timezone: timezone || 'UTC',
      advanceBookingDays: advanceBookingDays || 30,
      minimumNoticeHours: minimumNoticeHours || 24,
      bufferMinutes: bufferMinutes || 0,
      sameDayBooking: sameDayBooking || false,
    });

    sendSuccess(res, {
      message: result.message,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message === 'At least one day must be available') {
        return next(new AppError(400, error.message));
      }
    }
    next(error);
  }
}

/**
 * Get onboarding status
 */
export async function getOnboardingStatus(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const status = await onboardingService.getOnboardingStatus(userId);

    sendSuccess(res, { status });
  } catch (error) {
    next(error);
  }
}

/**
 * Complete onboarding
 */
export async function completeOnboarding(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await onboardingService.completeOnboarding(userId);

    sendSuccess(res, {
      message: 'Onboarding completed successfully! Your profile is now live.',
      profile,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Incomplete onboarding steps')) {
      return next(new AppError(400, error.message));
    }
    next(error);
  }
}

/**
 * Generate AI policies
 */
export async function generateAIPolicies(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get provider profile to fetch business details
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(
        404,
        'Provider profile not found. Please complete business details first.'
      );
    }

    // Get service specializations from business details
    const serviceSpecializations = profile.serviceSpecializations || [];

    // Generate policies using AI
    // Note: depositType and depositAmount are NOT needed here
    // Policies are generated based on business type and services only
    const policies = await aiService.generatePolicies({
      businessName: profile.businessName,
      businessType: profile.businessType || undefined,
      serviceTypes: serviceSpecializations,
    });

    sendSuccess(res, {
      message: 'Policies generated successfully',
      policies,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Save profile media URLs
 */
export async function saveProfileMedia(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { profilePhotoUrl, logoUrl, coverPhotoUrl } = req.body;

    if (!profilePhotoUrl) {
      throw new AppError(400, 'Profile photo URL is required');
    }

    // Save URLs to database
    const profile = await onboardingService.updateProfileMedia(userId, {
      profilePhotoUrl,
      logoUrl,
      coverPhotoUrl,
    });

    sendSuccess(res, {
      message: 'Profile media saved successfully',
      profile,
    });
  } catch (error) {
    next(error);
  }
}
