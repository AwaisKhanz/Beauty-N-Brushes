'use client';

import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/api';

interface PaystackCardFormProps {
  regionCode: string;
  subscriptionTier: 'solo' | 'salon';
  onSuccess: () => void;
  onBack: () => void;
}

export default function PaystackCardForm({
  regionCode,
  subscriptionTier,
  onSuccess,
  onBack,
}: PaystackCardFormProps) {
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);

  const handlePaystackSetup = async () => {
    if (!user?.email) {
      setError('User email not found. Please try logging in again.');
      return;
    }

    setProcessing(true);
    setError(null);

    try {
      // TRIAL MODE: Start free trial without payment collection
      // Payment will be collected later when trial ends
      await api.onboarding.setupPayment({
        regionCode: regionCode as 'NA' | 'EU' | 'GH' | 'NG',
        subscriptionTier,
        paymentMethodId: 'paystack_trial', // Placeholder for trial mode
      });

      // Success - proceed to next step
      onSuccess();
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to start trial. Please try again.';
      setError(errorMessage);
      setProcessing(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Setup - Paystack
        </CardTitle>
        <CardDescription>Start your free trial with Paystack</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* TRIAL NOTICE */}
          <div className="bg-primary/20 text-muted-foreground p-4 rounded-lg border border-primary/20 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <p className="font-medium">Free Trial - No Payment Required</p>
            </div>
            <p>Start your 2-month free trial now. No payment required to get started.</p>
            <p className="text-xs mt-2 text-muted-foreground">
              Full access to all features during your trial.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20 text-sm">
              {error}
            </div>
          )}

          <div className="border-t pt-6">
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>• Start free trial immediately</p>
              <p>• 2-month free trial period</p>
              <p>• No payment required now</p>
              <p>• Full access to all features</p>
            </div>

            <div className="flex justify-between">
              <Button type="button" variant="outline" onClick={onBack} className="gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>

              <Button
                onClick={handlePaystackSetup}
                disabled={processing || !user}
                className="gap-2 min-w-[200px]"
              >
                {processing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
