/**
 * Finance Management Types
 *
 * Types for provider financial management including earnings, payouts,
 * and platform commission tracking.
 *
 * @module shared-types/finance
 *
 * **Backend Usage:**
 * - `backend/src/controllers/finance.controller.ts`
 * - `backend/src/services/finance.service.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.finance)
 * - `frontend/src/app/provider/(dashboard)/finance/`
 */

// ================================
// Payout Types
// ================================

export type PayoutStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';

export interface Payout {
  id: string;
  providerId: string;
  amount: number;
  currency: string;
  paymentProvider: 'STRIPE' | 'PAYSTACK';
  status: PayoutStatus;
  paidAt: string | null;
  referenceId: string | null;
  bookingIds: string[];
  createdAt: string;
  updatedAt: string;
}

// ================================
// Finance Dashboard Types
// ================================

export interface FinanceSummary {
  // Earnings
  totalEarnings: number;
  monthlyEarnings: number;
  weeklyEarnings: number;

  // Deposits
  totalDepositsReceived: number;
  pendingDeposits: number;

  // Balance
  balanceOwed: number; // Amount clients owe (balance after deposit)
  cashCollected: number; // Cash payments recorded

  // Platform fees
  totalServiceFees: number; // Fees charged to clients (platform revenue)

  // Payouts
  totalPayouts: number;
  pendingPayouts: number;

  // Booking counts
  totalBookings: number;
  completedBookings: number;

  // Currency
  currency: string;
}

export interface EarningsBreakdown {
  date: string; // YYYY-MM-DD format
  earnings: number;
  bookingCount: number;
  depositAmount: number;
  serviceFees: number;
}

export interface PayoutHistory {
  payouts: Payout[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface BookingFinancialDetail {
  id: string;
  bookingDate: string;
  clientName: string;
  serviceName: string;
  servicePrice: number;
  depositAmount: number;
  balanceOwed: number;
  serviceFee: number;
  totalAmount: number;
  paymentStatus: string;
  bookingStatus: string;
  currency: string;
  paidAt: string | null;
  completedAt: string | null;
}

// ================================
// Request Types
// ================================

export interface GetFinanceSummaryRequest {
  startDate?: string; // ISO date string
  endDate?: string; // ISO date string
}

export interface GetEarningsBreakdownRequest {
  startDate: string; // ISO date string
  endDate: string; // ISO date string
  interval?: 'day' | 'week' | 'month';
}

export interface GetPayoutHistoryRequest {
  page?: number;
  limit?: number;
  status?: PayoutStatus;
}

export interface GetBookingFinancialsRequest {
  page?: number;
  limit?: number;
  startDate?: string;
  endDate?: string;
  paymentStatus?: string;
  bookingStatus?: string;
}

export interface CreatePayoutRequest {
  amount: number;
  bookingIds: string[];
}

// ================================
// Response Types
// ================================

export interface GetFinanceSummaryResponse {
  message: string;
  summary: FinanceSummary;
}

export interface GetEarningsBreakdownResponse {
  message: string;
  breakdown: EarningsBreakdown[];
  total: number;
}

export interface GetPayoutHistoryResponse {
  message: string;
  data: PayoutHistory;
}

export interface GetBookingFinancialsResponse {
  message: string;
  bookings: BookingFinancialDetail[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  summary: {
    totalEarnings: number;
    totalDeposits: number;
    totalBalance: number;
    totalServiceFees: number;
  };
}

export interface CreatePayoutResponse {
  message: string;
  payout: Payout;
}

export interface ExportFinancialReportRequest {
  startDate: string;
  endDate: string;
  format: 'csv' | 'pdf';
}

export interface ExportFinancialReportResponse {
  message: string;
  downloadUrl: string;
}
