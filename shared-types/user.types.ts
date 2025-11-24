/**
 * User Profile Types
 *
 * Types for user profile and settings operations.
 *
 * @module shared-types/user
 *
 * **Backend Usage:**
 * - `backend/src/controllers/user.controller.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.users)
 * - `frontend/src/components/client/ProfileForm.tsx`
 */

import type { AuthUser } from './auth.types';

// ================================
// User Profile Request Types
// ================================

/**
 * Request to update user profile information
 * @interface
 */
export interface UpdateUserProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  // Client-specific fields
  hairType?: string;
  hairTexture?: string;
  hairPreferences?: string;
}

/**
 * Request to update user password
 * @interface
 */
export interface UpdatePasswordRequest {
  /** Current password for verification */
  currentPassword: string;
  /** New password (min 8 characters) */
  newPassword: string;
}

/**
 * Request to update notification preferences
 * @interface
 */
export interface UpdateUserNotificationSettingsRequest {
  /** Enable/disable email notifications */
  emailNotificationsEnabled?: boolean;
  /** Enable/disable SMS notifications */
  smsNotificationsEnabled?: boolean;
}

// ================================
// User Profile Response Types
// ================================

/**
 * Response after updating user profile
 * @interface
 */
export interface UpdateUserProfileResponse {
  /** Success message */
  message: string;
  /** Updated user data */
  user: AuthUser;
}

/**
 * Response after updating password
 * @interface
 */
export interface UpdatePasswordResponse {
  /** Success message */
  message: string;
}

/**
 * Response after updating notification settings
 * @interface
 */
export interface UpdateUserNotificationSettingsResponse {
  /** Success message */
  message: string;
  /** Updated notification settings */
  user: {
    id: string;
    emailNotifications: boolean;
    smsNotifications: boolean;
  };
}

/**
 * Response after deactivating account
 * @interface
 */
export interface DeactivateAccountResponse {
  /** Success message */
  message: string;
}

/**
 * Response after deleting account
 * @interface
 */
export interface DeleteAccountResponse {
  /** Success message */
  message: string;
}
