/**
 * Shared Auth Types
 *
 * Used by both frontend and backend for authentication and authorization.
 *
 * @module shared-types/auth
 *
 * **Backend Usage:**
 * - `backend/src/controllers/auth.controller.ts`
 * - `backend/src/services/auth.service.ts`
 *
 * **Frontend Usage:**
 * - `frontend/src/lib/api.ts` (api.auth)
 * - `frontend/src/contexts/AuthContext.tsx`
 * - `frontend/src/components/auth/`
 */

/**
 * User role enum
 * @enum {string}
 */
export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN';

// ================================
// Auth Request Types
// ================================

/**
 * Request body for user registration
 * @interface
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

/**
 * Request body for user login
 * @interface
 */
export interface LoginRequest {
  /** User's email address */
  email: string;
  /** User's password */
  password: string;
}

/**
 * Request body for password reset initiation
 * @interface
 */
export interface ForgotPasswordRequest {
  /** Email address to send password reset link */
  email: string;
}

/**
 * Request body for password reset completion
 * @interface
 */
export interface ResetPasswordRequest {
  /** New password */
  password: string;
  /** Password confirmation (must match password) */
  confirmPassword: string;
}

// ================================
// Auth Response Types
// ================================

/**
 * Authenticated user object returned after login/registration
 * @interface
 */
export interface AuthUser {
  id: string;
  email: string;
  phone?: string | null;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified?: boolean;
  emailNotifications?: boolean;
  smsNotifications?: boolean;
  avatarUrl?: string | null;
  bio?: string | null;
  hairType?: string | null;
  hairTexture?: string | null;
  hairPreferences?: string | null;
  regionCode?: string | null;
}

/**
 * Authentication response returned after login/registration
 * @interface
 */
export interface AuthResponse {
  /** Authenticated user data */
  user: AuthUser;
  /** Success message */
  message: string;
  /** Whether the user's email is verified */
  emailVerified?: boolean;
}

/**
 * JWT token payload structure
 * @interface
 */
export interface TokenPayload {
  /** User ID */
  userId: string;
  /** User email */
  email: string;
  /** User role */
  role: UserRole;
  /** Issued at timestamp */
  iat?: number;
  /** Expiration timestamp */
  exp?: number;
}
