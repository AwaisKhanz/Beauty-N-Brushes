import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import type { AuthRequest } from '../types';
import type {
  GetClientDashboardStatsResponse,
  GetClientRecentBookingsResponse,
  ClientDashboardBooking,
} from '../../../shared-types';

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
          where: { active: true },
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

    // Get bookings count
    const allBookings = await prisma.booking.count({
      where: { providerId: profile.id },
    });

    const upcoming = await prisma.booking.count({
      where: {
        providerId: profile.id,
        appointmentDate: { gte: new Date() },
        bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    // Calculate revenue from completed bookings
    const completedBookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
        bookingStatus: 'COMPLETED',
      },
      select: {
        servicePrice: true,
      },
    });

    const revenue = completedBookings.reduce((sum, b) => sum + Number(b.servicePrice), 0);

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
        totalBookings: allBookings,
        upcomingBookings: upcoming,
        totalRevenue: revenue,
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

    // Get recent bookings with team member info
    const recentBookings = await prisma.booking.findMany({
      where: { providerId: profile.id },
      include: {
        client: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        service: {
          select: {
            title: true,
          },
        },
        assignedTeamMember: {
          select: {
            id: true,
            displayName: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
      take: 10,
    });

    const bookings = recentBookings.map((b) => ({
      id: b.id,
      clientName: `${b.client.firstName} ${b.client.lastName}`,
      service: b.service.title,
      date: b.appointmentDate.toISOString().split('T')[0],
      time: b.appointmentTime,
      status: b.bookingStatus.toLowerCase() as 'pending' | 'confirmed' | 'completed' | 'cancelled',
      // Team member info
      assignedTeamMemberId: b.assignedTeamMemberId,
      assignedTeamMemberName: b.assignedTeamMember?.displayName || null,
      anyAvailableStylist: b.anyAvailableStylist,
    }));

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

// ================================
// Client Dashboard Controllers
// ================================

/**
 * Get client dashboard statistics
 */
export async function getClientDashboardStats(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get total bookings count
    const totalBookings = await prisma.booking.count({
      where: { clientId: userId },
    });

    // Get upcoming bookings
    const upcomingBookings = await prisma.booking.count({
      where: {
        clientId: userId,
        bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
        appointmentDate: { gte: new Date() },
      },
    });

    // Get completed bookings
    const completedBookings = await prisma.booking.count({
      where: {
        clientId: userId,
        bookingStatus: 'COMPLETED',
      },
    });

    // Get favorite providers count
    const favoriteProviders = await prisma.favorite.count({
      where: { clientId: userId },
    });

    // Get unread messages count
    const unreadMessages = await prisma.message.count({
      where: {
        conversation: { clientId: userId },
        senderId: { not: userId },
        isRead: false,
      },
    });

    sendSuccess<GetClientDashboardStatsResponse>(res, {
      message: 'Stats retrieved',
      stats: {
        totalBookings,
        upcomingBookings,
        completedBookings,
        favoriteProviders,
        unreadMessages,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get recent bookings for client
 */
export async function getClientRecentBookings(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const limit = parseInt(req.query.limit as string) || 5;

    // Get recent bookings
    const recentBookings = await prisma.booking.findMany({
      where: { clientId: userId },
      include: {
        service: {
          select: {
            title: true,
          },
        },
        provider: {
          select: {
            businessName: true,
            slug: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
                avatarUrl: true,
              },
            },
          },
        },
      },
      orderBy: [{ appointmentDate: 'desc' }, { appointmentTime: 'desc' }],
      take: limit,
    });

    const bookings: ClientDashboardBooking[] = recentBookings.map((b) => ({
      id: b.id,
      providerName: `${b.provider.user.firstName} ${b.provider.user.lastName}`,
      businessName: b.provider.businessName || '',
      service: b.service.title,
      date: b.appointmentDate.toISOString(),
      time: b.appointmentTime,
      status: b.bookingStatus as
        | 'pending'
        | 'confirmed'
        | 'completed'
        | 'cancelled_by_client'
        | 'cancelled_by_provider',
      depositAmount: Number(b.depositAmount),
      totalAmount: Number(b.totalAmount),
      currency: b.currency,
      providerSlug: b.provider.slug,
      providerAvatar: b.provider.user.avatarUrl,
    }));

    sendSuccess<GetClientRecentBookingsResponse>(res, {
      message: 'Bookings retrieved',
      bookings,
    });
  } catch (error) {
    next(error);
  }
}
