/**
 * Dashboard Types
 * Shared between frontend and backend
 */

export interface DashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  unreadMessages: number;
  totalServices: number;
}

export interface DashboardProfile {
  businessName: string | null;
  profileCompleted: boolean;
  isPaused: boolean;
  subscriptionStatus: string | null;
  subscriptionTier: string | null;
}

export interface GetDashboardStatsResponse {
  stats: DashboardStats;
  onboardingProgress: number;
  profile: DashboardProfile;
}

export interface DashboardBooking {
  id: string;
  clientName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';

  // Team member info (salon bookings)
  assignedTeamMemberId?: string | null;
  assignedTeamMemberName?: string | null;
  anyAvailableStylist?: boolean;
}

export interface GetRecentBookingsResponse {
  bookings: DashboardBooking[];
  message: string;
}
