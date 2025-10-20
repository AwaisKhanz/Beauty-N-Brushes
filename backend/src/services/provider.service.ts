import { prisma } from '../config/database';

export class ProviderService {
  /**
   * Pause provider profile
   */
  async pauseProfile(userId: string, reason?: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    if (profile.profilePaused) {
      throw new Error('Profile is already paused');
    }

    const updatedProfile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        profilePaused: true,
        pausedAt: new Date(),
        pauseReason: reason,
        acceptsNewClients: false, // Disable new bookings
      },
    });

    return updatedProfile;
  }

  /**
   * Resume provider profile
   */
  async resumeProfile(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    if (!profile.profilePaused) {
      throw new Error('Profile is not paused');
    }

    const updatedProfile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        profilePaused: false,
        pausedAt: null,
        pauseReason: null,
        acceptsNewClients: true, // Re-enable new bookings
      },
    });

    return updatedProfile;
  }

  /**
   * Deactivate provider account (Admin only)
   */
  async deactivateProvider(providerId: string, reason: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: {
        user: true,
      },
    });

    if (!profile) {
      throw new Error('Provider not found');
    }

    // Update user status to suspended
    await prisma.user.update({
      where: { id: profile.userId },
      data: {
        status: 'SUSPENDED',
      },
    });

    // Update provider profile
    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        verificationStatus: 'suspended',
        acceptsNewClients: false,
      },
    });

    // Note: Provider deactivation - could send notification email if needed
    console.log(`Provider ${providerId} deactivated. Reason: ${reason}`);

    return { message: 'Provider account deactivated successfully' };
  }

  /**
   * Reactivate provider account (Admin only)
   */
  async reactivateProvider(providerId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: {
        user: true,
      },
    });

    if (!profile) {
      throw new Error('Provider not found');
    }

    // Update user status to active
    await prisma.user.update({
      where: { id: profile.userId },
      data: {
        status: 'ACTIVE',
      },
    });

    // Update provider profile
    await prisma.providerProfile.update({
      where: { id: providerId },
      data: {
        verificationStatus: 'approved',
        acceptsNewClients: true,
      },
    });

    return { message: 'Provider account reactivated successfully' };
  }

  /**
   * Get public provider profile by slug or business name
   */
  async getPublicProfile(slugOrBusinessName: string) {
    console.log('slugOrBusinessName', slugOrBusinessName);
    // Try to find by slug OR business name in a single query
    const profile = await prisma.providerProfile.findFirst({
      where: {
        OR: [
          { slug: slugOrBusinessName },
          {
            businessName: {
              equals: slugOrBusinessName,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            avatarUrl: true,
            status: true,
          },
        },
        services: {
          where: { active: true },
          include: {
            category: true,
            subcategory: true,
            media: {
              where: { isFeatured: true },
              take: 1,
              orderBy: { displayOrder: 'asc' },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!profile) {
      throw new Error('Provider not found');
    }

    // Check if profile is active
    if (profile.user.status !== 'ACTIVE' || profile.verificationStatus !== 'approved') {
      throw new Error('Provider not found');
    }

    // Get reviews (mock for now - we'll need a reviews table)
    const reviews: any[] = [];

    return {
      provider: {
        id: profile.id,
        businessName: profile.businessName,
        slug: profile.slug,
        tagline: profile.tagline,
        description: profile.description,
        logoUrl: profile.logoUrl,
        coverPhotoUrl: profile.coverPhotoUrl,
        city: profile.city,
        state: profile.state,
        address: profile.addressLine1,
        averageRating: profile.averageRating.toNumber(),
        totalReviews: profile.totalReviews,
        isSalon: profile.isSalon,
        acceptsNewClients: profile.acceptsNewClients,
        mobileServiceAvailable: profile.mobileServiceAvailable,
        services: profile.services.map((service) => ({
          id: service.id,
          title: service.title,
          description: service.description,
          priceMin: service.priceMin.toNumber(),
          priceMax: service.priceMax?.toNumber() || null,
          priceType: service.priceType,
          currency: service.currency,
          durationMinutes: service.durationMinutes,
          category: service.category.name,
          subcategory: service.subcategory?.name || null,
          featuredImageUrl: service.media[0]?.fileUrl || null,
          providerId: profile.id,
          providerName: profile.businessName,
          providerSlug: profile.slug,
          providerLogoUrl: profile.logoUrl,
          providerCity: profile.city,
          providerState: profile.state,
          providerRating: profile.averageRating.toNumber(),
          providerReviewCount: profile.totalReviews,
          providerIsSalon: profile.isSalon,
        })),
        portfolioImages: [],
        reviews,
      },
    };
  }
}

export const providerService = new ProviderService();
