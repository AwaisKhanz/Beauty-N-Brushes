'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    // Not authenticated
    if (!isAuthenticated) {
      router.push(redirectTo || ROUTES.LOGIN);
      return;
    }

    // Check role if required
    if (requiredRole && user?.role !== requiredRole) {
      // Redirect to appropriate dashboard based on user role
      if (user) {
        router.push(getDashboardRoute(user.role));
      }
      return;
    }

    setIsChecking(false);
  }, [loading, isAuthenticated, user, requiredRole, router, redirectTo]);

  if (loading || isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-4/6" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
