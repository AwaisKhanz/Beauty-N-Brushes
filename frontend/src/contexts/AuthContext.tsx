'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { RegionDetection } from '@/lib/region-detection';
import type { RegionCode } from '../../../shared-constants';
import type {
  AuthUser,
  LoginRequest,
  RegisterRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
} from '@/types';

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  isAuthenticated: boolean;
  regionCode: RegionCode;
  regionLoading: boolean;
  login: (data: LoginRequest) => Promise<AuthUser>;
  register: (data: RegisterRequest) => Promise<AuthUser>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  resendVerification: (email: string) => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (token: string, data: ResetPasswordRequest) => Promise<void>;
  validateResetToken: (token: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [regionCode, setRegionCode] = useState<RegionCode>('NA');
  const [regionLoading, setRegionLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const hasCheckedAuth = useRef(false);

  // Initialize region whenever user changes
  useEffect(() => {
    initializeRegion();
  }, [user]);

  useEffect(() => {
    // Only check auth once on mount
    if (hasCheckedAuth.current) return;

    // Always check auth to ensure header displays correct state
    checkAuth();

    hasCheckedAuth.current = true;
  }, [pathname]);

  /**
   * Initialize region detection
   * Priority: user.regionCode > localStorage cache > API detection > fallback
   */
  const initializeRegion = async () => {
    try {
      setRegionLoading(true);
      const detectedRegion = await RegionDetection.getUserRegion(
        user ? { regionCode: user.regionCode || undefined } : null
      );
      setRegionCode(detectedRegion);
    } catch (error) {
      console.error('Failed to initialize region:', error);
      // Fallback to NA
      setRegionCode('NA');
    } finally {
      setRegionLoading(false);
    }
  };

  const checkAuth = async () => {
    try {
      setLoading(true);
      const response = await api.auth.me();
      setUser(response.data.user as AuthUser);
    } catch (error) {
      // Silent fail - user is not authenticated, which is fine
      // This could be due to expired tokens, no tokens, or network issues
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (data: LoginRequest): Promise<AuthUser> => {
    try {
      const response = await api.auth.login(data);
      const { user: authUser } = response.data;

      setUser(authUser as AuthUser);

      return authUser;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  };

  const register = async (data: RegisterRequest): Promise<AuthUser> => {
    try {
      const response = await api.auth.register(data);
      const { user: authUser } = response.data;

      setUser(authUser as AuthUser);

      return authUser;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  };

  const logout = async () => {
    try {
      // Call backend logout to clear cookies and revoke refresh token
      await api.auth.logout();
    } catch (error) {
      console.error('Logout error:', error);
      // Even if logout API fails, continue with client cleanup
    } finally {
      setUser(null);
      // Clear region cache on logout
      RegionDetection.clearCache();
      router.push('/login');
    }
  };

  const resendVerification = async (email: string) => {
    try {
      await api.auth.resendVerification(email);
    } catch (error) {
      console.error('Resend verification failed:', error);
      throw error;
    }
  };

  const forgotPassword = async (data: ForgotPasswordRequest) => {
    try {
      await api.auth.forgotPassword(data.email);
    } catch (error) {
      console.error('Forgot password failed:', error);
      throw error;
    }
  };

  const resetPassword = async (token: string, data: ResetPasswordRequest) => {
    try {
      await api.auth.resetPassword(token, data.password, data.confirmPassword);
    } catch (error) {
      console.error('Reset password failed:', error);
      throw error;
    }
  };

  const validateResetToken = async (token: string): Promise<boolean> => {
    try {
      await api.auth.validateResetToken(token);
      return true;
    } catch (error) {
      console.error('Token validation failed:', error);
      return false;
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: !!user,
    regionCode,
    regionLoading,
    login,
    register,
    logout,
    checkAuth,
    resendVerification,
    forgotPassword,
    resetPassword,
    validateResetToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
