'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, Clock } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import type { OnboardingStatusResponse } from '@/../../shared-types/onboarding.types';

interface OnboardingGuardProps {
  children: React.ReactNode;
}

const STEP_LABELS: Record<string, string> = {
  accountType: 'Account Type',
  businessDetails: 'Business Details',
  profileMedia: 'Profile Media',
  brandCustomization: 'Brand Customization',
  policies: 'Business Policies',
  paymentSetup: 'Payment Setup',
  serviceCreated: 'Create Service',
  availabilitySet: 'Set Availability',
};

export function OnboardingGuard({ children }: OnboardingGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatusResponse | null>(null);

  // Routes that are allowed even if onboarding is not complete
  const allowedRoutes = [
    '/onboarding',
    '/onboarding/business-details',
    '/onboarding/profile-media',
    '/onboarding/brand-customization',
    '/onboarding/policies',
    '/onboarding/services',
    '/onboarding/availability',
    '/onboarding/payment-setup',
    '/onboarding/complete',
  ];

  const isOnboardingRoute = allowedRoutes.some((route) => pathname?.includes(route));

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const checkOnboardingStatus = async () => {
    try {
      const response = await api.onboarding.getStatus();
      setOnboardingStatus(response.data);

      // If onboarding not complete and not on onboarding route, redirect
      if (!response.data.status.completed && !isOnboardingRoute) {
        router.push('/onboarding');
        return;
      }

      // If onboarding complete but user is on onboarding route (except complete page), redirect to dashboard
      if (
        response.data.status.completed &&
        isOnboardingRoute &&
        !pathname?.includes('/onboarding/complete')
      ) {
        router.push('/dashboard');
        return;
      }

      setIsChecking(false);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setIsChecking(false);
    }
  };

  if (isChecking) {
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
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span>{STEP_LABELS[stepKey] || stepKey}</span>
                  </div>
                ))}
              </div>
            </div>

            <Button onClick={() => router.push('/onboarding')} className="w-full" size="lg">
              Continue Onboarding
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
