'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { GuardLoading } from '@/components/auth/GuardLoading';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { OnboardingStatusResponse } from '@/../../shared-types/onboarding.types';
import { STEP_LABELS, getDashboardRoute, getOnboardingRoute } from '@/constants';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusResponse | null>(null);

  // Determine role-specific routes using centralized functions
  const onboardingRoute = user?.role ? getOnboardingRoute(user.role) : '/';
  const dashboardRoute = user?.role ? getDashboardRoute(user.role) : '/';

  const isOnboardingRoute = pathname?.startsWith(onboardingRoute);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await api.onboarding.getStatus();
      setOnboardingStatus(response.data);

      // If onboarding not complete and not on onboarding route, redirect
      if (!response.data.status.completed && !isOnboardingRoute) {
        router.push(onboardingRoute);
        return;
      }

      // If onboarding complete but user is on onboarding route (except complete page), redirect to dashboard
      if (response.data.status.completed && isOnboardingRoute && !pathname?.includes('/complete')) {
        router.push(dashboardRoute);
        return;
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setIsChecking(false);
    }
  };

  if (isChecking) {
    return <GuardLoading message="Checking onboarding status..." />;
  }

  // If onboarding is not complete and user is trying to access protected pages
  if (onboardingStatus && !onboardingStatus.status.completed && !isOnboardingRoute) {
    // Calculate completed and incomplete steps from the steps object
    const stepsArray = Object.entries(onboardingStatus.status.steps);
    const completedSteps = stepsArray.filter(([, completed]) => completed);
    const incompleteSteps = stepsArray.filter(([, completed]) => !completed);

    const completedCount = completedSteps.length;
    const totalSteps = stepsArray.length;
    const progressPercentage = (completedCount / totalSteps) * 100;

    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30 py-12 px-4">
        <Card className="max-w-2xl w-full">
          <CardHeader className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-primary/10 mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle className="text-2xl font-bold">Complete Your Onboarding</CardTitle>
            <CardDescription>
              Finish setting up your profile to access your dashboard
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Progress</span>
                <span className="font-medium text-primary">
                  {completedCount} of {totalSteps} steps completed
                </span>
              </div>
              <Progress value={progressPercentage} className="h-2" />
            </div>

            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium text-foreground">Steps Remaining:</p>
              <div className="grid gap-2">
                {incompleteSteps.map(([stepKey]) => (
                  <div key={stepKey} className="flex items-center gap-2 text-sm">
                    <AlertCircle className="h-4 w-4 text-warning" />
                    <span>{STEP_LABELS[stepKey as keyof typeof STEP_LABELS] || stepKey}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => router.push(onboardingRoute)} className="w-full" size="lg">
              Continue Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
