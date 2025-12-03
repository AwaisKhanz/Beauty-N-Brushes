'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { CheckCircle, Sparkles, ArrowRight } from 'lucide-react';
import { ROUTES } from '@/constants';
import { useSubscriptionConfig } from '@/hooks/useSubscriptionConfig';

export default function OnboardingCompletePage() {
  const router = useRouter();
  const { config: trialConfig } = useSubscriptionConfig();

  // Calculate trial duration display
  const trialDuration = trialConfig?.trialDurationDays || 60;
  const trialMonths = Math.floor(trialDuration / 30);
  const trialDays = trialDuration % 30;
  const trialDisplay = trialMonths > 0 
    ? `${trialMonths}-month${trialMonths > 1 ? 's' : ''}${trialDays > 0 ? ` ${trialDays} days` : ''}`
    : `${trialDays} days`;

  useEffect(() => {
    // Auto-redirect after 5 seconds
    const timer = setTimeout(() => {
      router.push(ROUTES.PROVIDER.DASHBOARD);
    }, 5000);

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="flex justify-center mb-8">
          <Logo size="xl" />
        </div>

        <Card className="border-primary/20">
          <CardHeader className="text-center space-y-4 pb-8">
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full"></div>
                <CheckCircle className="h-20 w-20 text-primary relative" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold">🎉 Onboarding Complete!</CardTitle>
            <CardDescription className="text-lg">
              Your Beauty N Brushes account is ready to go
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Sparkles className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg">What's Next?</h3>
              </div>
              <ul className="space-y-3 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  {trialConfig?.trialEnabled 
                    ? `Your ${trialDisplay} free trial has started`
                    : 'Your account is now active'
                  }
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Your profile is live and discoverable
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Clients can now book your services
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  Start managing bookings from your dashboard
                </li>
              </ul>
            </div>

            <div className="flex flex-col gap-3">
              <Button
                onClick={() => router.push(ROUTES.PROVIDER.DASHBOARD)}
                className="w-full gap-2"
                size="lg"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Redirecting automatically in 5 seconds...
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
