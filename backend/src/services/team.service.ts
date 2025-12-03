/**
 * Team Management Service
 * Handles salon team member operations
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { emailService } from '../lib/email';
import { notificationService } from './notification.service';
import { emitTeamUpdate } from '../config/socket.server';
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
        subscriptionTier: true,
        teamMemberLimit: true,
      },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    // Check subscription tier (allows upgraded solo accounts)
    if (salon.subscriptionTier !== 'SALON') {
      throw new AppError(403, 'This feature is only available for salon subscription tier');
    }

    const teamMembers = await prisma.teamMember.findMany({
      where: { providerId: salon.id },
      orderBy: { createdAt: 'desc' },
    });

    // Map database fields to match shared types
    const mappedMembers = teamMembers.map((member) => ({
      ...member,
      status: !member.invitationAccepted
        ? ('pending' as const)
        : member.isActive
        ? ('active' as const)
        : ('inactive' as const),
      salonId: member.providerId,
      invitedEmail: member.invitationEmail,
      invitedAt: member.invitationSentAt?.toISOString() || null,
      acceptedAt: member.invitationAcceptedAt?.toISOString() || null,
    }));

    const limit = salon.teamMemberLimit || 999; // Default limit if not set
    return {
      teamMembers: mappedMembers,
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
      select: { id: true, subscriptionTier: true },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (salon.subscriptionTier !== 'SALON') {
      throw new AppError(403, 'This feature is only available for salon subscription tier');
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
        subscriptionTier: true,
        teamMemberLimit: true,
        businessName: true,
        teamMembers: true,
      },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (salon.subscriptionTier !== 'SALON') {
      throw new AppError(403, 'This feature is only available for salon subscription tier');
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
      select: { id: true, subscriptionTier: true },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (salon.subscriptionTier !== 'SALON') {
      throw new AppError(403, 'This feature is only available for salon subscription tier');
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

    // Update team member
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

    // Send notification if role changed
    if (data.role && data.role !== teamMember.role) {
      try {
        if (!teamMember.userId) {
          console.warn('Team member has no userId, skipping notification');
          return;
        }
        
        const memberUser = await prisma.user.findUnique({
          where: { id: teamMember.userId },
          select: { id: true },
        });

        const providerProfile = await prisma.providerProfile.findUnique({
          where: { id: salon.id },
          select: { businessName: true },
        });

        if (memberUser && providerProfile && providerProfile.businessName && teamMember.role) {
          await notificationService.createTeamRoleChangedNotification(
            memberUser.id,
            teamMember.role,
            data.role,
            providerProfile.businessName
          );

          emitTeamUpdate(memberUser.id, {
            type: 'team_role_changed',
            oldRole: teamMember.role,
            newRole: data.role,
          });
        }
      } catch (err) {
        console.error('Failed to send role changed notification:', err);
      }
    }

    return updated;
  }

  /**
   * Delete team member
   */
  async deleteTeamMember(userId: string, memberId: string) {
    const salon = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true, subscriptionTier: true },
    });

    if (!salon) {
      throw new AppError(404, 'Salon profile not found');
    }

    if (salon.subscriptionTier !== 'SALON') {
      throw new AppError(403, 'This feature is only available for salon subscription tier');
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

    // Delete team member
    await prisma.teamMember.delete({
      where: { id: memberId },
    });

    // Send notification to removed team member
    try {
      if (!teamMember.userId) {
        console.warn('Team member has no userId, skipping notification');
        return;
      }
      
      const memberUser = await prisma.user.findUnique({
        where: { id: teamMember.userId }, // Use teamMember.userId here
        select: { id: true },
      });

      const providerProfile = await prisma.providerProfile.findUnique({
        where: { id: salon.id }, // Use salon.id here
        select: { businessName: true },
      });

      if (memberUser && providerProfile && providerProfile.businessName) {
        await notificationService.createTeamMemberRemovedNotification(
          memberUser.id,
          providerProfile.businessName
        );

        emitTeamUpdate(memberUser.id, {
          type: 'team_member_removed',
          providerName: providerProfile.businessName,
        });
      }
    } catch (err) {
      console.error('Failed to send team member removed notification:', err);
    }

    return {
      message: 'Team member removed successfully',
    };
  }

  /**
   * Get team analytics
   */
  async getTeamAnalytics(userId: string) {
    const salon = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        subscriptionTier: true,
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

    if (salon.subscriptionTier !== 'SALON') {
      throw new AppError(403, 'This feature is only available for salon subscription tier');
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

  /**
   * Get invitation details (public)
   */
  async getInvitationDetails(invitationId: string) {
    const invitation = await prisma.teamMember.findUnique({
      where: { id: invitationId },
      include: {
        provider: {
          select: {
            businessName: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new AppError(404, 'Invitation not found');
    }

    if (invitation.invitationAccepted) {
      throw new AppError(400, 'This invitation has already been accepted');
    }

    return {
      id: invitation.id,
      salonName: invitation.provider.businessName || 'Salon',
      role: invitation.role,
      invitedEmail: invitation.invitationEmail || invitation.email,
      invitedAt: invitation.invitationSentAt?.toISOString() || new Date().toISOString(),
    };
  }

  /**
   * Accept team invitation
   */
  async acceptInvitation(userId: string, invitationId: string) {
    const invitation = await prisma.teamMember.findUnique({
      where: { id: invitationId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
    });

    if (!invitation) {
      throw new AppError(404, 'Invitation not found');
    }

    if (invitation.invitationAccepted) {
      throw new AppError(400, 'This invitation has already been accepted');
    }

    // SECURITY: Verify the logged-in user's email matches the invitation email
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, role: true },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const invitationEmail = invitation.invitationEmail || invitation.email;
    if (!invitationEmail) {
      throw new AppError(400, 'Invitation email not found');
    }

    if (user.email.toLowerCase() !== invitationEmail.toLowerCase()) {
      throw new AppError(
        403,
        'This invitation was sent to a different email address. Please log in with the invited email or create an account with that email.'
      );
    }

    // Update both TeamMember and User in transaction
    const [teamMember] = await prisma.$transaction([
      // Update team member with user ID and activate
      prisma.teamMember.update({
        where: { id: invitationId },
        data: {
          userId,
          invitationAccepted: true,
          invitationAcceptedAt: new Date(),
          isActive: true,
        },
      }),
      // Update user role to PROVIDER so they can access provider dashboard
      prisma.user.update({
        where: { id: userId },
        data: {
          role: 'PROVIDER',
        },
      }),
    ]);

    // Return team member with provider context
    return {
      teamMember,
      provider: invitation.provider,
      message: `Welcome to ${invitation.provider.businessName}!`,
      redirectUrl: '/provider/dashboard',
    };
  }

  /**
   * Decline team invitation
   */
  async declineInvitation(invitationId: string) {
    const invitation = await prisma.teamMember.findUnique({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new AppError(404, 'Invitation not found');
    }

    // Delete the invitation
    await prisma.teamMember.delete({
      where: { id: invitationId },
    });

    return { message: 'Invitation declined' };
  }

  /**
   * Get team member context for a user
   * Returns provider info and permissions for team members
   */
  async getTeamMemberContext(userId: string) {
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            slug: true,
            city: true,
            state: true,
            subscriptionTier: true,
          },
        },
      },
    });

    if (!teamMember) {
      return null;
    }

    return {
      teamMemberId: teamMember.id,
      providerId: teamMember.provider.id,
      providerName: teamMember.provider.businessName,
      providerSlug: teamMember.provider.slug,
      role: teamMember.role,
      displayName: teamMember.displayName,
      isTeamMember: true,
      canManageBookings: true,
      canManageServices: true,
    };
  }
}

export const teamService = new TeamService();
