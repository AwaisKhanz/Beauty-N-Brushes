'use client';

import { useEffect, useState } from 'react';
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
  const { user, loading, isAuthenticated, checkAuth } = useAuth();
  const router = useRouter();
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  useEffect(() => {
    // If we haven't attempted auth yet and we're not loading, try to check auth
    if (!hasAttemptedAuth && !loading) {
      setHasAttemptedAuth(true);
      // Give a small delay to ensure auth context has time to initialize
      setTimeout(() => {
        if (!isAuthenticated) {
          checkAuth();
        }
      }, 100);
    }
  }, [hasAttemptedAuth, loading, isAuthenticated, checkAuth]);

  useEffect(() => {
    // Don't do anything while still loading or haven't attempted auth
    if (loading || !hasAttemptedAuth) return;

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
  }, [loading, isAuthenticated, user, requiredRole, router, redirectTo, hasAttemptedAuth]);

  // Show loading while checking authentication
  if (loading || !hasAttemptedAuth) {
    return <GuardLoading message="Checking authentication..." />;
  }

  // If not authenticated, show loading while redirect is happening
  if (!isAuthenticated) {
    return <GuardLoading message="Redirecting to login..." />;
  }

  // If wrong role, show loading while redirect is happening
  if (requiredRole && user?.role !== requiredRole) {
    return <GuardLoading message="Redirecting..." />;
  }

  return <>{children}</>;
}
