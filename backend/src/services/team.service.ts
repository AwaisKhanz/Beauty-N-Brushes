/**
 * Team Management Service
 * Handles salon team member operations
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { emailService } from '../lib/email';
import type { InviteTeamMemberRequest, UpdateTeamMemberRequest } from '../../../shared-types';

class TeamService {
  /**
   * Get all team members for a salon
   */
  async getTeamMembers(userId: string) {
    const salon = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        isSalon: true,
        teamMemberLimit: true,
      },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (!salon.isSalon) {
      throw new AppError(403, 'This feature is only available for salon accounts');
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { providerId: salon.id },
      orderBy: { createdAt: 'desc' },
    });

    const limit = salon.teamMemberLimit || 999; // Default limit if not set
    return {
      teamMembers,
      limit: limit,
      currentCount: teamMembers.length,
    };
  }

  /**
   * Get single team member
   */
  async getTeamMember(userId: string, memberId: string) {
    const salon = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true, isSalon: true },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (!salon.isSalon) {
      throw new AppError(403, 'This feature is only available for salon accounts');
    }

    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        providerId: salon.id,
      },
    });

    if (!teamMember) {
      throw new AppError(404, 'Team member not found');
    }

    return teamMember;
  }

  /**
   * Invite team member
   */
  async inviteTeamMember(userId: string, data: InviteTeamMemberRequest) {
    const salon = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        isSalon: true,
        teamMemberLimit: true,
        businessName: true,
        teamMembers: true,
      },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (!salon.isSalon) {
      throw new AppError(403, 'This feature is only available for salon accounts');
    }

    // Check team member limit
    const limit = salon.teamMemberLimit || 999;
    if (salon.teamMembers.length >= limit) {
      throw new AppError(400, `Team member limit reached (${limit})`);
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    // Check if already a team member
    if (existingUser) {
      const existingMember = await prisma.teamMember.findFirst({
        where: {
          providerId: salon.id,
          email: data.email,
        },
      });

      if (existingMember) {
        throw new AppError(400, 'User is already a team member');
      }
    }

    // Create invitation
    const invitation = await prisma.teamMember.create({
      data: {
        providerId: salon.id,
        displayName: data.displayName,
        role: data.role,
        email: data.email,
        specializations: data.specializations || [],
        isActive: false, // Will be activated when they accept
        invitationEmail: data.email,
        invitationSentAt: new Date(),
      },
    });

    // Send invitation email
    try {
      await emailService.sendTeamInvitation({
        to: data.email,
        salonName: salon.businessName || 'Beauty Salon',
        role: data.role,
        invitationId: invitation.id,
      });
    } catch (error) {
      console.error('Failed to send invitation email:', error);
      // Continue anyway - invitation is created
    }

    return {
      id: invitation.id,
      email: data.email,
      role: invitation.role,
      invitedAt: invitation.invitationSentAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Update team member
   */
  async updateTeamMember(userId: string, memberId: string, data: UpdateTeamMemberRequest) {
    const salon = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true, isSalon: true },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (!salon.isSalon) {
      throw new AppError(403, 'This feature is only available for salon accounts');
    }

    // Verify team member belongs to this salon
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        providerId: salon.id,
      },
    });

    if (!teamMember) {
      throw new AppError(404, 'Team member not found or access denied');
    }

    const updated = await prisma.teamMember.update({
      where: { id: memberId },
      data: {
        ...(data.role !== undefined && { role: data.role }),
        ...(data.displayName !== undefined && { displayName: data.displayName }),
        ...(data.specializations !== undefined && { specializations: data.specializations }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Delete team member
   */
  async deleteTeamMember(userId: string, memberId: string) {
    const salon = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true, isSalon: true },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (!salon.isSalon) {
      throw new AppError(403, 'This feature is only available for salon accounts');
    }

    // Verify team member belongs to this salon
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: memberId,
        providerId: salon.id,
      },
    });

    if (!teamMember) {
      throw new AppError(404, 'Team member not found or access denied');
    }

    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    return { success: true };
  }

  /**
   * Get team analytics
   */
  async getTeamAnalytics(userId: string) {
    const salon = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        isSalon: true,
        teamMembers: {
          include: {
            bookings: {
              where: {
                bookingStatus: { in: ['CONFIRMED', 'COMPLETED'] },
              },
              select: {
                id: true,
                bookingStatus: true,
                servicePrice: true,
                currency: true,
              },
            },
          },
        },
      },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (!salon.isSalon) {
      throw new AppError(403, 'This feature is only available for salon accounts');
    }

    const activeMembers = salon.teamMembers.filter((m) => m.isActive);

    // Calculate real stats from bookings
    const memberStats = await Promise.all(
      salon.teamMembers.map(async (member) => {
        const totalBookings = member.bookings.length;
        const completedBookings = member.bookings.filter(
          (b) => b.bookingStatus === 'COMPLETED'
        ).length;

        // Calculate total revenue from completed bookings
        const totalRevenue = member.bookings
          .filter((b) => b.bookingStatus === 'COMPLETED')
          .reduce((sum, b) => sum + Number(b.servicePrice), 0);

        // Get reviews for this team member's bookings
        const reviews = await prisma.review.findMany({
          where: {
            booking: {
              assignedTeamMemberId: member.id,
            },
          },
          select: {
            overallRating: true,
          },
        });

        const averageRating =
          reviews.length > 0
            ? reviews.reduce((sum, r) => sum + r.overallRating, 0) / reviews.length
            : 0;

        return {
          memberId: member.id,
          displayName: member.displayName,
          totalBookings,
          completedBookings,
          totalRevenue: Math.round(totalRevenue * 100) / 100,
          averageRating: Math.round(averageRating * 10) / 10,
          totalReviews: reviews.length,
        };
      })
    );

    // Calculate salon-wide totals
    const totalBookings = memberStats.reduce((sum, m) => sum + m.totalBookings, 0);
    const totalRevenue = memberStats.reduce((sum, m) => sum + m.totalRevenue, 0);

    return {
      totalMembers: salon.teamMembers.length,
      activeMembers: activeMembers.length,
      totalBookings,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      memberStats,
    };
  }
}

export const teamService = new TeamService();
