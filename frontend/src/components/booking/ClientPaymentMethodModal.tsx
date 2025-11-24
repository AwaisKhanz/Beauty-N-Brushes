'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard, Loader2 } from 'lucide-react';
import { extractErrorMessage } from '@/lib/error-utils';
import { api } from '@/lib/api';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface ClientPaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  regionCode: 'NA' | 'EU' | 'GH' | 'NG';
  onSuccess: () => void;
}

export function ClientPaymentMethodModal({
  open,
  onOpenChange,
  regionCode,
  onSuccess,
}: ClientPaymentMethodModalProps) {
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loadingSetupIntent, setLoadingSetupIntent] = useState(false);

  const paymentProvider = regionCode === 'NA' || regionCode === 'EU' ? 'stripe' : 'paystack';

  // Reset state when region changes (even if modal is open)
  useEffect(() => {
    if (open) {
      // Reset all state when region changes
      setClientSecret('');
      setError('');
      setLoadingSetupIntent(false);
    }
  }, [regionCode, open]);

  // Load SetupIntent when modal opens for Stripe or when region changes
  useEffect(() => {
    // Reset state when modal closes
    if (!open) {
      setClientSecret('');
      setError('');
      setLoadingSetupIntent(false);
      return;
    }

    // Load SetupIntent for Stripe regions
    if (paymentProvider === 'stripe') {
      loadSetupIntent();
    }
    // For Paystack, we initialize on button click (redirects to Paystack)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, regionCode, paymentProvider]);

  async function loadSetupIntent() {
    try {
      setLoadingSetupIntent(true);
      setError('');
      const res = await api.users.createSetupIntent();
      setClientSecret(res.data.clientSecret);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to initialize payment form');
    } finally {
      setLoadingSetupIntent(false);
    }
  }

  async function handlePaystackPayment() {
    try {
      setError('');
      setLoadingSetupIntent(true);

      // Initialize Paystack transaction via backend API
      const initRes = await api.users.initializePaystackPaymentMethod();

      // Store reference in localStorage for fallback if Paystack doesn't include it in redirect
      if (initRes.data.reference) {
        localStorage.setItem('paystack_payment_method_reference', initRes.data.reference);
      }

      // Redirect user to Paystack authorization page
      // This will open in a new window/tab, and user will be redirected back after authorization
      window.location.href = initRes.data.authorizationUrl;
    } catch (err: unknown) {
      const errorMsg = extractErrorMessage(err) || 'Failed to initialize payment authorization';
      setError(errorMsg);
      console.error('Error in handlePaystackPayment:', err);
      setLoadingSetupIntent(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            {paymentProvider === 'stripe' ? 'Add' : 'Update'} Payment Method
          </DialogTitle>
          <DialogDescription>
            {paymentProvider === 'stripe' ? (
              <>
                Add or replace your credit or debit card for faster checkout
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  Only one payment method is allowed per account.
                </span>
              </>
            ) : (
              <>
                Add or replace your card or mobile money account for faster checkout
                <br />
                <span className="text-xs text-muted-foreground mt-1 block">
                  Only one payment method is allowed per account.
                </span>
                <br />
                <span className="text-xs text-amber-600 dark:text-amber-400 mt-1 block font-medium">
                  Note: A minimal authorization charge of {regionCode === 'GH' ? '₵1.00' : '₦1.00'}{' '}
                  is required to securely save your payment method. This is a one-time verification
                  charge.
                </span>
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Payment Provider Info */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <p className="text-sm font-medium mb-2">Payment Provider:</p>
            <p className="text-sm text-muted-foreground">
              {paymentProvider === 'stripe'
                ? `Stripe (${regionCode === 'NA' ? 'North America' : 'Europe'})`
                : `Paystack (${regionCode === 'GH' ? 'Ghana' : 'Nigeria'})`}
            </p>
          </div>

          {/* Stripe Payment Form */}
          {paymentProvider === 'stripe' && (
            <>
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
                      theme: document.documentElement.classList.contains('dark')
                        ? 'night'
                        : 'stripe',
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
                    onSuccess={() => {
                      onSuccess();
                      onOpenChange(false);
                    }}
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
            </>
          )}

          {/* Paystack Info */}
          {paymentProvider === 'paystack' && (
            <div className="space-y-4">
              <div className="p-6 border rounded-lg text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mb-2">
                  Click the button below to securely add your payment method
                </p>
                <p className="text-xs text-muted-foreground mb-4">
                  Supports: Card, Mobile Money, Bank Transfer, USSD
                </p>
              </div>

              {/* Important Notice */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-xs">
                  <strong>Important:</strong> To save your payment method, Paystack requires a
                  minimal authorization charge of{' '}
                  {regionCode === 'GH' ? '₵1.00 (GHS)' : '₦1.00 (NGN)'}. This is a one-time
                  verification charge to securely save your card for future payments. You will be
                  redirected to Paystack's secure checkout page to complete this.
                </AlertDescription>
              </Alert>
            </div>
          )}
        </div>

        {paymentProvider === 'paystack' && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handlePaystackPayment} disabled={loadingSetupIntent}>
              {loadingSetupIntent ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Initializing...
                </>
              ) : (
                'Add Payment Method'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Stripe Payment Form Component
function StripePaymentForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
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

        // Send to backend to save
        try {
          await api.users.addPaymentMethod({
            paymentMethodId,
          });

          onSuccess();
        } catch (err: unknown) {
          onError(extractErrorMessage(err) || 'Failed to save payment method');
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
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <PaymentElement />
      </div>

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={!stripe || processing}>
          {processing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Payment Method'
          )}
        </Button>
      </div>
    </form>
  );
}
