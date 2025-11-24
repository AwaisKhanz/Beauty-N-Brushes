/**
 * Analytics Types
 *
 * Types for provider analytics dashboard including booking trends,
 * revenue tracking, and performance metrics.
 *
 * @module shared-types/analytics
 *
 * **Backend Usage:**
 * - `backend/src/controllers/analytics.controller.ts`
 * - `backend/src/services/analytics.service.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.analytics)
 * - `frontend/src/app/provider/(dashboard)/analytics/`
 */

// ================================
// Analytics Summary Types
// ================================

export interface AnalyticsSummary {
  // Time period
  dateRange: {
    startDate: string;
    endDate: string;
  };

  // Bookings
  totalBookings: number;
  confirmedBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;

  // Revenue
  totalRevenue: number;
  averageBookingValue: number;
  monthOverMonthGrowth: number; // Percentage change from previous period

  // Client metrics
  totalClients: number;
  newClients: number;
  returningClients: number;
  clientRetentionRate: number; // Percentage

  // Performance
  averageRating: number;
  totalReviews: number;
  profileViews: number;
  conversionRate: number; // (bookings / profile views) * 100

  // Popular items
  topService: {
    id: string;
    title: string;
    bookingCount: number;
  } | null;
}

// ================================
// Booking Trends Types
// ================================

export interface BookingTrend {
  date: string; // YYYY-MM-DD format
  bookingCount: number;
  revenue: number;
  confirmedCount: number;
  completedCount: number;
  cancelledCount: number;
}

export interface BookingTrendsByDay {
  dayOfWeek: number; // 0 = Sunday, 6 = Saturday
  dayName: string;
  bookingCount: number;
  averageRevenue: number;
}

export interface BookingTrendsByHour {
  hour: number; // 0-23
  bookingCount: number;
  peakDay: string | null;
}

// ================================
// Service Performance Types
// ================================

export interface ServicePerformance {
  id: string;
  title: string;
  category: string;
  bookingCount: number;
  revenue: number;
  averagePrice: number;
  averageRating: number;
  reviewCount: number;
  conversionRate: number; // (bookings / views) * 100
}

// ================================
// Client Demographics Types
// ================================

export interface ClientDemographics {
  // By service category
  byCategory: Array<{
    category: string;
    clientCount: number;
    percentage: number;
  }>;

  // New vs returning
  newClientsCount: number;
  returningClientsCount: number;
  repeatClientRate: number; // Percentage

  // Top clients
  topClients: Array<{
    id: string;
    name: string;
    bookingCount: number;
    totalSpent: number;
    lastBookingDate: string;
  }>;
}

// ================================
// Revenue Analytics Types
// ================================

export interface RevenueBreakdown {
  totalRevenue: number;
  depositRevenue: number;
  balanceRevenue: number;
  tipsRevenue: number;
  serviceFeesPaid: number; // By clients, not provider

  // By payment method
  byPaymentMethod: Array<{
    method: string;
    amount: number;
    percentage: number;
  }>;

  // By service category
  byCategory: Array<{
    category: string;
    revenue: number;
    percentage: number;
  }>;
}

// ================================
// Request Types
// ================================

export interface GetAnalyticsSummaryRequest {
  startDate?: string; // Default: 30 days ago
  endDate?: string; // Default: today
}

export interface GetBookingTrendsRequest {
  startDate: string;
  endDate: string;
  interval?: 'day' | 'week' | 'month';
}

export interface GetServicePerformanceRequest {
  startDate?: string;
  endDate?: string;
  sortBy?: 'bookings' | 'revenue' | 'rating';
  limit?: number;
}

export interface GetClientDemographicsRequest {
  startDate?: string;
  endDate?: string;
}

export interface GetRevenueBreakdownRequest {
  startDate?: string;
  endDate?: string;
}

// ================================
// Response Types
// ================================

export interface GetAnalyticsSummaryResponse {
  message: string;
  summary: AnalyticsSummary;
}

export interface GetBookingTrendsResponse {
  message: string;
  trends: BookingTrend[];
  byDay: BookingTrendsByDay[];
  byHour: BookingTrendsByHour[];
}

export interface GetServicePerformanceResponse {
  message: string;
  services: ServicePerformance[];
  total: number;
}

export interface GetClientDemographicsResponse {
  message: string;
  demographics: ClientDemographics;
}

export interface GetRevenueBreakdownResponse {
  message: string;
  breakdown: RevenueBreakdown;
}

// ================================
// Chart Data Types
// ================================

export interface ChartDataPoint {
  label: string;
  value: number;
  additionalData?: Record<string, unknown>;
}

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
  label?: string;
}
