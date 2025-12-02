/**
 * Booking Types
 *
 * Types for booking creation, management, and team member assignment.
 * Supports both solo providers and salon team member bookings.
 *
 * @module shared-types/booking
 *
 * **Backend Usage:**
 * - `backend/src/controllers/booking.controller.ts`
 * - `backend/src/services/booking.service.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.bookings)
 * - `frontend/src/components/booking/`
 */

// ================================
// Status Types
// ================================

/**
 * Booking status enum
 * @enum {string}
 */
export type BookingStatus =
  | 'pending'
  | 'confirmed'
  | 'cancelled_by_client'
  | 'cancelled_by_provider'
  | 'completed'
  | 'no_show'
  | 'rescheduled';

/**
 * Payment status enum
 * @enum {string}
 */
export type PaymentStatus =
  | 'pending'
  | 'deposit_paid'
  | 'fully_paid'
  | 'refunded'
  | 'partially_refunded';

// ================================
// Booking Request Types
// ================================

/**
 * Request to create a new booking
 * Includes support for service add-ons and salon team member selection
 * @interface
 */
export interface CreateBookingRequest {
  serviceId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  appointmentEndTime?: string; // HH:mm (calculated from service duration)

  // Contact Information (Required per requirements Lines 430-432)
  contactEmail: string;
  contactPhone: string;

  specialRequests?: string;
  referencePhotoUrls?: string[]; // Array of S3 URLs for reference photos

  // Add-ons
  selectedAddonIds?: string[]; // Array of addon IDs to include

  // Home service request
  homeServiceRequested?: boolean; // True if client wants home/mobile service

  // Salon-specific team member selection
  assignedTeamMemberId?: string; // Specific stylist ID (salon bookings)
  anyAvailableStylist?: boolean; // True if client wants any available stylist

  // Payment
  paymentMethodId?: string; // Stripe/Paystack payment method ID
}

export interface UpdateBookingRequest {
  appointmentDate?: string;
  appointmentTime?: string;
  appointmentEndTime?: string;
  specialRequests?: string;
  internalNotes?: string; // Provider only
  assignedTeamMemberId?: string; // Salon admin can reassign
}

export interface CancelBookingRequest {
  reason: string;
  cancelledBy?: 'client' | 'provider';
}

export interface RescheduleBookingRequest {
  newDate: string; // YYYY-MM-DD
  newTime: string; // HH:mm
  reason?: string;
}

export interface RescheduleBookingResponse {
  message: string;
  booking: BookingDetails;
}

export interface CompleteBookingRequest {
  tipAmount?: number;
  notes?: string;
  balancePaymentMethod?: 'online' | 'cash' | 'card_at_venue';
}

export interface PayTipRequest {
  bookingId: string;
  tipAmount: number;
  paymentMethodId?: string;
}

export interface RequestRescheduleRequest {
  newDate: string; // YYYY-MM-DD
  newTime: string; // HH:mm
  reason: string;
}

export interface RequestRescheduleResponse {
  message: string;
  rescheduleRequest: {
    id: string;
    bookingId: string;
    newDate: string;
    newTime: string;
    reason: string;
    status: 'pending' | 'approved' | 'denied';
    requestedAt: string;
    respondedAt: string | null;
  };
}

export interface RespondToRescheduleRequest {
  approved: boolean;
  reason?: string;
}

export interface RespondToRescheduleResponse {
  message: string;
  booking: BookingDetails;
}

// ================================
// Booking Response Types
// ================================

export interface BookingDetails {
  id: string;
  clientId: string;
  providerId: string;
  serviceId: string;

  // Team member (salon only)
  assignedTeamMemberId: string | null;
  assignedTeamMember: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    specializations: string[];
  } | null;
  anyAvailableStylist: boolean;

  // Appointment
  appointmentDate: string;
  appointmentTime: string;
  appointmentEndTime: string;

  // Pricing
  servicePrice: number; // ✅ Total service + add-ons (base price client pays for service)
  depositAmount: number; // ✅ Deposit paid upfront
  serviceFee: number; // ✅ Platform fee (calculated on total servicePrice)
  totalAmount: number; // ✅ Total paid at booking (deposit + serviceFee)
  balanceDue: number; // ✅ ADD THIS - Remaining amount (servicePrice - depositAmount)
  tipAmount: number;
  currency: string;

  // Add-ons - ADD THIS
  addons?: Array<{
    id: string;
    addonName: string;
    addonPrice: number;
  }>;

  // Home service tracking
  homeServiceRequested: boolean;
  homeServiceFee: number;

  // Payment
  paymentProvider: 'stripe' | 'paystack';
  paymentStatus: PaymentStatus;
  paymentMethod: string | null;
  paidAt: string | null;
  balancePaymentMethod: string | null; // 'online', 'cash', 'card_at_venue'

  // Status
  bookingStatus: BookingStatus;
  bookingType: 'instant' | 'request';

  // Details
  specialRequests: string | null;
  referencePhotoUrls: string[];
  internalNotes: string | null;

  // Photos
  photos?: Array<{
    id: string;
    photoType: 'BEFORE' | 'AFTER' | 'REFERENCE';
    imageUrl: string;
    caption: string | null;
    createdAt: string;
  }>;

  // Cancellation
  cancelledAt: string | null;
  cancellationReason: string | null;
  cancellationFee: number | null;
  rescheduleCount: number;

  // Timestamps
  createdAt: string;
  updatedAt: string;

  // Related data
  service?: {
    id: string;
    title: string;
    durationMinutes: number;
    categoryName: string;
  };

  provider?: {
    id: string;
    businessName: string;
    slug: string;
    businessPhone: string | null;
    addressLine1: string | null;
    city: string;
    state: string;
    isSalon: boolean;
    cancellationWindowHours: number | null;
    cancellationFeePercentage: number | null;
    cancellationPolicy: string | null;
    locations?: Array<{
      id: string;
      addressLine1: string;
      city: string;
      state: string;
      isPrimary: boolean;
    }>;
  };

  client?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string | null;
  };
}

export interface CreateBookingResponse {
  message: string;
  booking: BookingDetails;
}

export interface GetBookingResponse {
  message: string;
  booking: BookingDetails;
}

export interface GetBookingsResponse {
  message: string;
  bookings: BookingDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UpdateBookingResponse {
  message: string;
  booking: BookingDetails;
}

export interface CancelBookingResponse {
  message: string;
  refundAmount: number;
  refundStatus: string;
}

export interface RescheduleBookingResponse {
  message: string;
  booking: BookingDetails;
}

export interface CompleteBookingResponse {
  message: string;
  booking: BookingDetails;
}

// ================================
// Salon-Specific Booking Types
// ================================

export interface AssignTeamMemberRequest {
  teamMemberId: string;
}

export interface AssignTeamMemberResponse {
  message: string;
  booking: BookingDetails;
}

/**
 * Stylist information for salon team member bookings
 * @interface
 */
export interface AvailableStylist {
  id: string;
  displayName: string;
  avatarUrl: string | null;
  specializations: string[];
  isAvailable: boolean;
  nextAvailableSlot: string | null;
}

/**
 * Response containing available stylists for a booking slot
 * @interface
 */
export interface GetAvailableStylists {
  message: string;
  stylists: AvailableStylist[];
}

// ================================
// Available Time Slots Types
// ================================

export interface TimeSlot {
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  available: boolean;
}

export interface GetAvailableSlotsResponse {
  message: string;
  date: string; // YYYY-MM-DD
  slots: TimeSlot[];
}
