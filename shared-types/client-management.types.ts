/**
 * Client Management Types
 *
 * Types for provider client management including client profiles,
 * notes, booking history, and preferences.
 *
 * @module shared-types/client-management
 *
 * **Backend Usage:**
 * - `backend/src/controllers/client-management.controller.ts`
 * - `backend/src/services/client-management.service.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.clients)
 * - `frontend/src/app/provider/(dashboard)/clients/`
 */

// ================================
// Client Profile Types
// ================================

export interface ClientProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string | null;
  avatarUrl: string | null;
  hairType: string | null;
  hairTexture: string | null;
  hairPreferences: string | null;

  // Statistics
  totalBookings: number;
  completedBookings: number;
  totalSpent: number;
  averageRating: number | null;

  // Dates
  firstBookingDate: string | null;
  lastBookingDate: string | null;
  createdAt: string;
}

export interface ClientWithNotes extends ClientProfile {
  notes: ClientNote[];
  recentBookings: Array<{
    id: string;
    serviceTitle: string;
    appointmentDate: string;
    status: string;
    totalAmount: number;
  }>;
}

export interface ClientNote {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

// ================================
// Request Types
// ================================

export interface GetClientsRequest {
  page?: number;
  limit?: number;
  search?: string; // Search by name or email
  sortBy?: 'name' | 'bookings' | 'lastBooking' | 'totalSpent';
  sortOrder?: 'asc' | 'desc';
}

export interface GetClientDetailRequest {
  clientId: string;
}

export interface CreateClientNoteRequest {
  clientId: string;
  note: string;
}

export interface UpdateClientNoteRequest {
  note: string;
}

// ================================
// Response Types
// ================================

export interface GetClientsResponse {
  message: string;
  clients: ClientProfile[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GetClientDetailResponse {
  message: string;
  client: ClientWithNotes;
}

export interface CreateClientNoteResponse {
  message: string;
  note: ClientNote;
}

export interface UpdateClientNoteResponse {
  message: string;
  note: ClientNote;
}
