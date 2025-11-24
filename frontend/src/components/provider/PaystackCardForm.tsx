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
      // Calculate subscription amount in local currency
      // Solo: $19 USD = ~₵237.50 GHS or ~₦29,450 NGN
      // Salon: $49 USD = ~₵612.50 GHS or ~₦75,975 NGN
      const baseAmount = subscriptionTier === 'solo' ? 19 : 49;
      const exchangeRate = regionCode === 'GH' ? 12.5 : 1550; // GHS:NGN exchange rates
      const amount = baseAmount * exchangeRate;

      // Initialize Paystack transaction to collect payment and authorization
      // Currency is determined by backend from regionCode
      const initResponse = await api.payment.initializePaystack({
        email: user.email,
        amount,
        subscriptionTier,
        regionCode: regionCode as 'GH' | 'NG',
        currency: regionCode === 'GH' ? 'GHS' : 'NGN', // Required by API type but backend uses regionCode
      });

      // Redirect to Paystack checkout
      if (initResponse.data.authorizationUrl) {
        window.location.href = initResponse.data.authorizationUrl;
      } else {
        throw new Error('Failed to get payment URL from Paystack');
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to initialize payment. Please try again.';
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
          {/* PAYMENT NOTICE */}
          <div className="bg-primary/20 text-muted-foreground p-4 rounded-lg border border-primary/20 text-sm space-y-2">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              <p className="font-medium">Secure Payment Setup</p>
            </div>
            <p>
              Complete payment to start your 2-month free trial. Your card will be charged after
              the trial period ends.
            </p>
            <p className="text-xs mt-2 text-muted-foreground">
              Secure payment powered by Paystack. Cancel anytime.
            </p>
          </div>

          {error && (
            <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20 text-sm">
              {error}
            </div>
          )}

          <div className="border-t pt-6">
            <div className="space-y-2 text-sm text-muted-foreground mb-6">
              <p>• 2-month free trial period</p>
              <p>• Payment method required for setup</p>
              <p>• Charged after trial ends</p>
              <p>• Cancel anytime during trial</p>
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
                  'Continue to Payment'
                )}
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
