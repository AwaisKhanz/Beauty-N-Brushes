'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { GuardLoading } from '@/components/auth/GuardLoading';
import { getOnboardingRoute } from '@/constants';

interface CompleteOnboardingGuardProps {
  children: React.ReactNode;
}

/**
 * Guard that ensures onboarding IS completed before accessing a route.
 * Use this for completion/success pages that should only be accessible
 * after onboarding is finished.
 */
export function CompleteOnboardingGuard({ children }: CompleteOnboardingGuardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [isVerifying, setIsVerifying] = useState(true);

  useEffect(() => {
    const verifyCompletion = async () => {
      try {
        const response = await api.onboarding.getStatus();

        // If onboarding is NOT completed, redirect back to onboarding
        if (!response.data.status.completed) {
          const onboardingRoute = user?.role ? getOnboardingRoute(user.role) : '/';
          router.push(onboardingRoute);
          return;
        }

        setIsVerifying(false);
      } catch (error) {
        console.error('Failed to verify onboarding status:', error);
        // On error, redirect to onboarding to be safe
        const onboardingRoute = user?.role ? getOnboardingRoute(user.role) : '/';
        router.push(onboardingRoute);
      }
    };

    verifyCompletion();
  }, [router, user?.role]);

  if (isVerifying) {
    return <GuardLoading message="Verifying completion..." />;
  }

  return <>{children}</>;
}
