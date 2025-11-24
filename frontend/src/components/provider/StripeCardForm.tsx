'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CreditCard, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { extractErrorMessage } from '@/lib/error-utils';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface StripeCardFormProps {
  regionCode: string;
  subscriptionTier: 'solo' | 'salon';
  onSuccess: () => void;
  onBack: () => void;
}

export default function StripeCardForm({
  regionCode,
  subscriptionTier,
  onSuccess,
  onBack,
}: StripeCardFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingSetupIntent, setLoadingSetupIntent] = useState(false);

  // Load SetupIntent on mount
  useEffect(() => {
    loadSetupIntent();
  }, []);

  const loadSetupIntent = async () => {
    try {
      setLoadingSetupIntent(true);
      setError(null);

      const res = await api.settings.createSetupIntent();
      setClientSecret(res.data.clientSecret);
    } catch (err: unknown) {
      const errorMessage =
        extractErrorMessage(err) || 'Failed to load payment form. Please try again.';
      setError(errorMessage);
    } finally {
      setLoadingSetupIntent(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Payment Setup - Stripe
        </CardTitle>
        <CardDescription>Start your free trial with Stripe</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* PAYMENT NOTICE */}
        <div className="bg-primary/20 text-muted-foreground p-4 rounded-lg border border-primary/20 text-sm space-y-2">
          <div className="flex items-center gap-2">
            <CreditCard className="h-4 w-4" />
            <p className="font-medium">Secure Payment Setup</p>
          </div>
          <p>
            Complete payment setup to start your 2-month free trial. Your card will be charged after
            the trial period ends.
          </p>
          <p className="text-xs mt-2 text-muted-foreground">
            Secure payment powered by Stripe. Cancel anytime.
          </p>
        </div>

        {error && (
          <div className="bg-destructive/10 text-destructive p-4 rounded-lg border border-destructive/20 text-sm">
            {error}
          </div>
        )}

        {/* Stripe Payment Form */}
        {loadingSetupIntent ? (
          <div className="p-6 border rounded-lg text-center">
            <Loader2 className="h-8 w-8 mx-auto mb-4 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Loading payment form...</p>
          </div>
        ) : clientSecret ? (
          <Elements
            stripe={stripePromise}
            options={{
              clientSecret,
              appearance: {
                theme: document.documentElement.classList.contains('dark') ? 'night' : 'stripe',
                variables: {
                  colorPrimary: '#B06F64',
                  colorBackground: document.documentElement.classList.contains('dark')
                    ? '#1a1a1a'
                    : '#ffffff',
                  colorText: document.documentElement.classList.contains('dark')
                    ? '#ffffff'
                    : '#2A3F4D',
                  colorDanger: '#EF4444',
                  fontFamily: 'system-ui, sans-serif',
                  borderRadius: '8px',
                  spacingUnit: '4px',
                },
                rules: {
                  '.Input': {
                    backgroundColor: document.documentElement.classList.contains('dark')
                      ? '#2a2a2a'
                      : '#f8f9fa',
                    border: '1px solid #B06F64',
                    borderRadius: '8px',
                    color: document.documentElement.classList.contains('dark')
                      ? '#ffffff'
                      : '#2A3F4D',
                    fontSize: '16px',
                    padding: '12px',
                  },
                  '.Input:focus': {
                    borderColor: '#B06F64',
                    boxShadow: '0 0 0 2px rgba(176, 111, 100, 0.2)',
                  },
                  '.Label': {
                    color: document.documentElement.classList.contains('dark')
                      ? '#ffffff'
                      : '#2A3F4D',
                    fontSize: '14px',
                    fontWeight: '500',
                  },
                },
              },
            }}
          >
            <StripePaymentForm
              regionCode={regionCode}
              subscriptionTier={subscriptionTier}
              onSuccess={onSuccess}
              onBack={onBack}
              onError={(err) => setError(err)}
            />
          </Elements>
        ) : (
          <div className="p-6 border rounded-lg text-center">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Failed to load payment form. Please try again.
            </p>
            <Button onClick={loadSetupIntent} variant="outline" size="sm">
              Retry
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Stripe Payment Form Component
function StripePaymentForm({
  regionCode,
  subscriptionTier,
  onSuccess,
  onBack,
  onError,
}: {
  regionCode: string;
  subscriptionTier: 'solo' | 'salon';
  onSuccess: () => void;
  onBack: () => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setProcessing(true);
      onError('');

      // Confirm SetupIntent
      const { error, setupIntent } = await stripe.confirmSetup({
        elements,
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Failed to save payment method');
        return;
      }

      if (setupIntent && setupIntent.payment_method) {
        // Get payment method ID
        const paymentMethodId =
          typeof setupIntent.payment_method === 'string'
            ? setupIntent.payment_method
            : setupIntent.payment_method.id;

        // Create subscription with payment method
        try {
          await api.onboarding.setupPayment({
            regionCode: regionCode as 'NA' | 'EU' | 'GH' | 'NG',
            subscriptionTier,
            paymentMethodId, // Use actual payment method ID
          });

          onSuccess();
        } catch (err: unknown) {
          onError(extractErrorMessage(err) || 'Failed to setup payment. Please try again.');
        }
      } else {
        onError('No payment method was saved');
      }
    } catch (err: unknown) {
      onError(extractErrorMessage(err) || 'Failed to save payment method');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 border rounded-lg">
        <PaymentElement />
      </div>

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
            type="submit"
            disabled={!stripe || processing}
            className="gap-2 min-w-[200px] bg-button-dark hover:bg-button-dark/90 text-white"
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
    </form>
  );
}
