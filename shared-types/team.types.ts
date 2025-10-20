/**
 * Team Management Types
 * Types for salon team member management
 */

// ================================
// Team Member Types
// ================================

export interface TeamMember {
  id: string;
  salonId: string;
  userId: string;
  role: 'stylist' | 'manager' | 'assistant';
  status: 'active' | 'inactive' | 'pending';
  displayName: string;
  specializations: string[];
  bio: string | null;
  avatarUrl: string | null;
  commissionRate: number | null;
  canManageBookings: boolean;
  canManageServices: boolean;
  canViewFinances: boolean;
  invitedEmail: string | null;
  invitedAt: string | null;
  acceptedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
    avatarUrl: string | null;
  };
}

// ================================
// Request Types
// ================================

export interface InviteTeamMemberRequest {
  email: string;
  role: 'stylist' | 'manager' | 'assistant';
  displayName: string;
  specializations?: string[];
  canManageBookings?: boolean;
  canManageServices?: boolean;
  canViewFinances?: boolean;
}

export interface UpdateTeamMemberRequest {
  role?: 'stylist' | 'manager' | 'assistant';
  status?: 'active' | 'inactive';
  displayName?: string;
  specializations?: string[];
  bio?: string | null;
  avatarUrl?: string | null;
  commissionRate?: number | null;
  canManageBookings?: boolean;
  canManageServices?: boolean;
  canViewFinances?: boolean;
}

export interface AcceptTeamInvitationRequest {
  invitationId: string;
  bio?: string;
  specializations?: string[];
}

// ================================
// Response Types
// ================================

export interface InviteTeamMemberResponse {
  message: string;
  invitation: {
    id: string;
    email: string;
    role: string;
    invitedAt: string;
  };
}

export interface GetTeamMembersResponse {
  message: string;
  teamMembers: TeamMember[];
  limit: number;
  currentCount: number;
}

export interface GetTeamMemberResponse {
  message: string;
  teamMember: TeamMember;
}

export interface UpdateTeamMemberResponse {
  message: string;
  teamMember: TeamMember;
}

export interface DeleteTeamMemberResponse {
  message: string;
}

export interface AcceptInvitationResponse {
  message: string;
  teamMember: TeamMember;
}

// ================================
// Team Analytics
// ================================

export interface TeamMemberStats {
  memberId: string;
  displayName: string;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
}

export interface GetTeamAnalyticsResponse {
  message: string;
  analytics: {
    totalMembers: number;
    activeMembers: number;
    totalBookings: number;
    totalRevenue: number;
    memberStats: TeamMemberStats[];
  };
}
