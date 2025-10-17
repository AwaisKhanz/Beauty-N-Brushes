'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
import { getDashboardRoute } from '@/constants';

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export function GuestGuard({ children, redirectTo }: GuestGuardProps) {
  const { user, loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (loading) return;

    // If authenticated, redirect to appropriate dashboard
    if (isAuthenticated && user) {
      const defaultRedirect = redirectTo || getDashboardRoute(user.role);
      router.push(defaultRedirect);
      return;
    }

    setIsChecking(false);
  }, [loading, isAuthenticated, user, router, redirectTo]);

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
