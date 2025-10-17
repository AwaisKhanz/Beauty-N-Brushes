/**
 * Shared Auth Types
 * Used by both frontend and backend
 */

export type UserRole = 'CLIENT' | 'PROVIDER' | 'ADMIN';

// Auth Request Types
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  password: string;
  confirmPassword: string;
}

// Auth Response Types
export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  emailVerified?: boolean;
}

export interface AuthResponse {
  user: AuthUser;
  message: string;
  emailVerified?: boolean;
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}
