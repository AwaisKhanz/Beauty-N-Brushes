'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Logo } from '@/components/shared/Logo';
import { toast } from 'sonner';
import { ROUTES } from '@/constants';

export default function ClientOnboardingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // TODO: Add client onboarding API call
      // For now, just redirect to dashboard
      toast.success('Welcome to Beauty N Brushes!', {
        description: 'Your account is ready',
      });
      router.push(ROUTES.CLIENT.DASHBOARD);
    } catch (error) {
      toast.error('Setup failed', {
        description: 'Please try again',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
      <div className="container mx-auto px-4 py-12">
        <div className="flex justify-center mb-8">
          <Logo size="lg" />
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Welcome, {user?.firstName}!</h1>
            <p className="text-lg text-muted-foreground">
              Let's set up your client profile to start booking beauty services
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Client Profile Setup</CardTitle>
              <CardDescription>
                Complete your profile to discover and book with beauty professionals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="phone">Phone Number (Optional)</Label>
                  <Input id="phone" type="tel" placeholder="Your phone number" />
                </div>

                <div>
                  <Label htmlFor="location">Preferred Location</Label>
                  <Input id="location" placeholder="City or area" />
                </div>

                <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                  <h3 className="font-medium text-primary mb-2">What's Next?</h3>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>✨ Discover top-rated beauty professionals</li>
                    <li>📅 Book appointments instantly</li>
                    <li>💳 Secure payment processing</li>
                    <li>⭐ Rate and review services</li>
                  </ul>
                </div>
              </div>

              <Button onClick={handleComplete} disabled={isLoading} className="w-full">
                {isLoading ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
