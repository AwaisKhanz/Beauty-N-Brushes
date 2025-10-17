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
}

export const providerService = new ProviderService();
