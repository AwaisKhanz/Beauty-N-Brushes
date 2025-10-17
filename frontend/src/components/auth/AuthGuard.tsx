'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { GuardLoading } from '@/components/auth/GuardLoading';
import type { UserRole } from '@/types';
import { ROUTES, getDashboardRoute } from '@/constants';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  redirectTo?: string;
}

export function AuthGuard({ children, requiredRole, redirectTo }: AuthGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Don't do anything while still loading
    if (loading) return;

    // Not authenticated - redirect immediately
    if (!isAuthenticated) {
      router.replace(redirectTo || ROUTES.LOGIN);
      return;
    }

    // Check role if required
    if (requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard based on user role
      if (user) {
        router.replace(getDashboardRoute(user.role));
      }
      return;
    }
  }, [loading, isAuthenticated, user, requiredRole, router, redirectTo]);

  // Show loading while checking authentication
  if (loading) {
    return <GuardLoading message="Checking authentication..." />;
  }

  // If not authenticated, show nothing (redirect is happening)
  if (!isAuthenticated) {
    return null;
  }

  // If wrong role, show nothing (redirect is happening)
  if (requiredRole && user?.role !== requiredRole) {
    return null;
  }

  return <>{children}</>;
}
