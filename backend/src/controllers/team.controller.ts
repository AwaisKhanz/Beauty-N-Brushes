/**
 * Team Management Controller
 * Handles salon team member operations
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { teamService } from '../services/team.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type {
  GetTeamMembersResponse,
  GetTeamMemberResponse,
  InviteTeamMemberRequest,
  InviteTeamMemberResponse,
  UpdateTeamMemberRequest,
  UpdateTeamMemberResponse,
  DeleteTeamMemberResponse,
  GetTeamAnalyticsResponse,
} from '../../../shared-types';
import { z } from 'zod';

/**
 * Get all team members
 */
export async function getTeamMembers(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const result = await teamService.getTeamMembers(userId);

    sendSuccess<GetTeamMembersResponse>(res, {
      message: 'Team members retrieved',
      teamMembers: result.teamMembers as unknown as GetTeamMembersResponse['teamMembers'],
      limit: result.limit || 999,
      currentCount: result.currentCount,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get single team member
 */
export async function getTeamMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { memberId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!memberId) throw new AppError(400, 'Member ID required');

    const teamMember = await teamService.getTeamMember(userId, memberId);

    sendSuccess<GetTeamMemberResponse>(res, {
      message: 'Team member retrieved',
      teamMember: teamMember as unknown as GetTeamMemberResponse['teamMember'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Invite team member
 */
export async function inviteTeamMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const schema = z.object({
      email: z.string().email(),
      role: z.enum(['stylist', 'manager', 'assistant']),
      displayName: z.string().min(2).max(255),
      specializations: z.array(z.string()).optional(),
      canManageBookings: z.boolean().optional(),
      canManageServices: z.boolean().optional(),
      canViewFinances: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as InviteTeamMemberRequest;

    const invitation = await teamService.inviteTeamMember(userId, data);

    sendSuccess<InviteTeamMemberResponse>(
      res,
      {
        message: 'Team member invitation sent',
        invitation: {
          id: invitation.id,
          email: invitation.email,
          role: invitation.role || 'stylist',
          invitedAt: invitation.invitedAt,
        },
      },
      201
    );
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
 * Update team member
 */
export async function updateTeamMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { memberId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!memberId) throw new AppError(400, 'Member ID required');

    const schema = z.object({
      role: z.enum(['stylist', 'manager', 'assistant']).optional(),
      status: z.enum(['active', 'inactive']).optional(),
      displayName: z.string().min(2).max(255).optional(),
      specializations: z.array(z.string()).optional(),
      bio: z.string().optional().nullable(),
      profilePhotoUrl: z.string().url().optional().nullable(),
      commissionRate: z.number().min(0).max(100).optional().nullable(),
      canManageBookings: z.boolean().optional(),
      canManageServices: z.boolean().optional(),
      canViewFinances: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as UpdateTeamMemberRequest;

    const teamMember = await teamService.updateTeamMember(userId, memberId, data);

    sendSuccess<UpdateTeamMemberResponse>(res, {
      message: 'Team member updated successfully',
      teamMember: teamMember as unknown as UpdateTeamMemberResponse['teamMember'],
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
 * Delete team member
 */
export async function deleteTeamMember(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { memberId } = req.params;

    if (!userId) throw new AppError(401, 'Unauthorized');
    if (!memberId) throw new AppError(400, 'Member ID required');

    await teamService.deleteTeamMember(userId, memberId);

    sendSuccess<DeleteTeamMemberResponse>(res, {
      message: 'Team member removed successfully',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get team analytics
 */
export async function getTeamAnalytics(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const analytics = await teamService.getTeamAnalytics(userId);

    sendSuccess<GetTeamAnalyticsResponse>(res, {
      message: 'Team analytics retrieved',
      analytics: analytics as unknown as GetTeamAnalyticsResponse['analytics'],
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get invitation details (public - no auth required)
 */
export async function getInvitation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { invitationId } = req.params;

    if (!invitationId) throw new AppError(400, 'Invitation ID required');

    const invitation = await teamService.getInvitationDetails(invitationId);

    sendSuccess(res, {
      message: 'Invitation retrieved',
      invitation,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Accept team invitation
 */
export async function acceptInvitation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    const { invitationId } = req.params;

    if (!userId) throw new AppError(401, 'You must be logged in to accept invitations');
    if (!invitationId) throw new AppError(400, 'Invitation ID required');

    const teamMember = await teamService.acceptInvitation(userId, invitationId);

    sendSuccess(res, {
      message: 'Invitation accepted successfully',
      teamMember,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Decline team invitation
 */
export async function declineInvitation(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { invitationId } = req.params;

    if (!invitationId) throw new AppError(400, 'Invitation ID required');

    await teamService.declineInvitation(invitationId);

    sendSuccess(res, {
      message: 'Invitation declined',
    });
  } catch (error) {
    next(error);
  }
}
