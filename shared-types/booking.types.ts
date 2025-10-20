/**
 * Booking Types
 * Types for booking creation and management
 */

// ================================
// Booking Request Types
// ================================

export interface CreateBookingRequest {
  serviceId: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentTime: string; // HH:mm
  appointmentEndTime?: string; // HH:mm (calculated from service duration)
  specialRequests?: string;

  // Add-ons
  selectedAddonIds?: string[]; // Array of addon IDs to include

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
  reason?: string;
  cancelledBy: 'client' | 'provider';
}

export interface RescheduleBookingRequest {
  newDate: string;
  newTime: string;
  reason?: string;
}

export interface CompleteBookingRequest {
  tipAmount?: number;
  notes?: string;
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
  servicePrice: number;
  depositAmount: number;
  serviceFee: number;
  totalAmount: number;
  tipAmount: number;
  currency: string;

  // Payment
  paymentProvider: 'stripe' | 'paystack';
  paymentStatus: 'pending' | 'deposit_paid' | 'fully_paid' | 'refunded' | 'partially_refunded';
  paymentMethod: string | null;
  paidAt: string | null;

  // Status
  bookingStatus:
    | 'pending'
    | 'confirmed'
    | 'cancelled_by_client'
    | 'cancelled_by_provider'
    | 'completed'
    | 'no_show'
    | 'rescheduled';
  bookingType: 'instant' | 'request';

  // Details
  specialRequests: string | null;
  internalNotes: string | null;

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
    businessPhone: string | null;
    addressLine1: string | null;
    city: string;
    state: string;
    isSalon: boolean;
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

export interface GetAvailableStylists {
  message: string;
  stylists: {
    id: string;
    displayName: string;
    avatarUrl: string | null;
    specializations: string[];
    isAvailable: boolean;
    nextAvailableSlot: string | null;
  }[];
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
