/**
 * Re-export shared auth types
 */
export type {
  UserRole,
  RegisterRequest,
  LoginRequest,
  AuthUser,
  AuthResponse,
  TokenPayload,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/shared-types/auth.types';

/**
 * Cookie configuration types
 */
export interface CookieOptions {
  httpOnly: boolean;
  secure: boolean;
  sameSite: 'strict' | 'lax' | 'none';
  maxAge: number;
  path: string;
  domain?: string;
}
