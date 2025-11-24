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
  slug: string | null;
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

// ================================
// Client Dashboard Types
// ================================

export interface ClientDashboardStats {
  totalBookings: number;
  upcomingBookings: number;
  completedBookings: number;
  favoriteProviders: number;
  unreadMessages: number;
}

export interface ClientDashboardBooking {
  id: string;
  providerName: string;
  businessName: string;
  service: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled_by_client' | 'cancelled_by_provider';
  depositAmount: number;
  totalAmount: number;
  currency: string;
  providerSlug: string;
  providerAvatar: string | null;
}

export interface GetClientDashboardStatsResponse {
  stats: ClientDashboardStats;
  message: string;
}

export interface GetClientRecentBookingsResponse {
  bookings: ClientDashboardBooking[];
  message: string;
}
