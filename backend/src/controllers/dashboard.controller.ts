import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';

/**
 * Get provider dashboard statistics
 */
export async function getProviderDashboardStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get provider profile
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        services: {
          where: { isActive: true },
          select: { id: true },
        },
        _count: {
          select: {
            services: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Get bookings count (when bookings are implemented)
    // For now, return 0
    const totalBookings = 0;
    const upcomingBookings = 0;

    // Calculate revenue (when bookings are implemented)
    const totalRevenue = 0;

    // Get average rating (when reviews are implemented)
    const averageRating = 0;
    const totalReviews = 0;

    // Profile views (when analytics are implemented)
    const profileViews = 0;

    // Unread messages (when messaging is implemented)
    const unreadMessages = 0;

    // Calculate onboarding progress
    const onboardingProgress = calculateOnboardingProgress(profile);

    sendSuccess(res, {
      stats: {
        totalBookings,
        upcomingBookings,
        totalRevenue,
        averageRating,
        totalReviews,
        profileViews,
        unreadMessages,
        totalServices: profile._count.services,
      },
      onboardingProgress,
      profile: {
        businessName: profile.businessName,
        profileCompleted: profile.profileCompleted,
        isPaused: profile.isPaused,
        subscriptionStatus: profile.subscriptionStatus,
        subscriptionTier: profile.subscriptionTier,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent bookings for provider
 */
export async function getRecentBookings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get provider profile
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // TODO: Get real bookings when booking system is implemented
    // For now, return empty array
    const bookings: any[] = [];

    sendSuccess(res, {
      bookings,
      message: 'Recent bookings retrieved successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Calculate onboarding progress percentage
 */
function calculateOnboardingProgress(profile: any): number {
  const steps = {
    accountType: !!profile.isSalon || profile.isSalon === false,
    businessDetails: !!(profile.businessName && profile.address && profile.city),
    profileMedia: !!profile.profilePhotoUrl,
    brandCustomization: !!(profile.primaryColor && profile.secondaryColor),
    policies: !!profile.policiesId,
    paymentSetup: !!(profile.stripeCustomerId || profile.paystackCustomerCode),
    servicesCreated: profile._count && profile._count.services > 0,
    availabilitySet: !!profile.availabilityId,
  };

  const completedSteps = Object.values(steps).filter(Boolean).length;
  const totalSteps = Object.keys(steps).length;

  return Math.round((completedSteps / totalSteps) * 100);
}
