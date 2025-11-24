/**
 * Provider Management Types
 *
 * Types for provider profile management operations including pause/resume,
 * and admin deactivation/reactivation.
 *
 * @module shared-types/provider
 *
 * **Backend Usage:**
 * - `backend/src/controllers/provider.controller.ts`
 * - `backend/src/services/provider.service.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.providers)
 * - `frontend/src/app/provider/(dashboard)/settings/`
 */

// ================================
// Provider Profile Management
// ================================

/**
 * Request to pause provider profile (stops accepting new bookings)
 * @interface
 */
export interface PauseProfileRequest {
  /** Optional reason for pausing */
  reason?: string;
}

/**
 * Response after pausing provider profile
 * @interface
 */
export interface PauseProfileResponse {
  /** Success message */
  message: string;
  /** Updated profile status */
  profile: {
    id: string;
    isPaused: boolean;
    pausedAt: string;
    pauseReason?: string;
  };
}

/**
 * Response after resuming provider profile
 * @interface
 */
export interface ResumeProfileResponse {
  /** Success message */
  message: string;
  /** Updated profile status */
  profile: {
    id: string;
    isPaused: boolean;
    resumedAt: string;
  };
}

// ================================
// Admin Provider Operations
// ================================

/**
 * Admin request to deactivate a provider (admin only)
 * @interface
 */
export interface DeactivateProviderRequest {
  /** Reason for deactivation (required) */
  reason: string;
}

/**
 * Response after admin deactivates a provider
 * @interface
 */
export interface DeactivateProviderResponse {
  /** Success message */
  message: string;
  /** Updated provider status */
  provider: {
    id: string;
    isActive: boolean;
    deactivatedAt: string;
    deactivationReason: string;
  };
}

/**
 * Response after admin reactivates a provider
 * @interface
 */
export interface ReactivateProviderResponse {
  /** Success message */
  message: string;
  /** Updated provider status */
  provider: {
    id: string;
    isActive: boolean;
    reactivatedAt: string;
  };
}
