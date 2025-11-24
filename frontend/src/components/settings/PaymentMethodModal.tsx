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
import { useAuth } from '@/contexts/AuthContext';
import type { PaystackResponse, WindowWithPaystack } from '@/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PaymentMethodModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  region: 'NA' | 'EU' | 'GH' | 'NG';
  paymentProvider: 'stripe' | 'paystack';
}

export function PaymentMethodModal({
  open,
  onClose,
  onSuccess,
  region,
  paymentProvider,
}: PaymentMethodModalProps) {
  const { user } = useAuth();
  const [error, setError] = useState('');
  const [paystackLoaded, setPaystackLoaded] = useState(false);
  const [clientSecret, setClientSecret] = useState<string>('');
  const [loadingSetupIntent, setLoadingSetupIntent] = useState(false);

  // Load SetupIntent when modal opens for Stripe
  useEffect(() => {
    if (open && paymentProvider === 'stripe' && !clientSecret) {
      loadSetupIntent();
    } else if (open && paymentProvider === 'paystack' && !paystackLoaded) {
      loadPaystack();
    }

    // Reset when modal closes
    if (!open) {
      setClientSecret('');
      setError('');
    }
  }, [open, paymentProvider, clientSecret, paystackLoaded]);

  async function loadSetupIntent() {
    try {
      setLoadingSetupIntent(true);
      setError('');
      const res = await api.settings.createSetupIntent();
      setClientSecret(res.data.clientSecret);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to initialize payment form');
    } finally {
      setLoadingSetupIntent(false);
    }
  }

  function loadPaystack() {
    if (document.querySelector('script[src*="paystack"]')) {
      setPaystackLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackLoaded(true);
    document.body.appendChild(script);
  }

  async function handlePaystackUpdate() {
    try {
      setError('');

      const windowWithPaystack = window as WindowWithPaystack;

      if (typeof window !== 'undefined' && windowWithPaystack.PaystackPop) {
        if (!user?.email) {
          setError('User email not found');
          return;
        }

        const handler = windowWithPaystack.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
          email: user.email,
          amount: 0, // Authorization only - no charge
          currency: region === 'GH' ? 'GHS' : 'NGN',
          ref: `payment_method_${Date.now()}`,
          onClose: function () {
            // User closed the modal
          },
          callback: async function (response: PaystackResponse) {
            try {
              // For Paystack, we need to verify the transaction to get authorization details
              const verifyRes = await api.payment.verifyPaystack(response.reference);

              if (verifyRes.data.status === 'success' && verifyRes.data.authorization) {
                // Send authorization code to backend
                await api.settings.updatePaymentMethod({
                  paymentMethodId: verifyRes.data.authorization.authorization_code,
                  region,
                });

                onSuccess();
                onClose();
              } else {
                setError('Failed to verify payment method. Please try again.');
              }
            } catch (err: unknown) {
              setError(extractErrorMessage(err) || 'Failed to save payment method');
            }
          },
        });

        handler.openIframe();
      } else {
        throw new Error('Paystack not loaded');
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to add payment method');
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Update Payment Method
          </DialogTitle>
          <DialogDescription>
            {paymentProvider === 'stripe'
              ? 'Add or update your credit/debit card for subscription billing'
              : 'Add or update your card or mobile money account for subscription billing'}
            <br />
            <span className="text-xs text-muted-foreground mt-1 block">
              Only one payment method is allowed per account.
            </span>
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
                ? `Stripe (${region === 'NA' ? 'North America' : 'Europe'})`
                : `Paystack (${region === 'GH' ? 'Ghana' : 'Nigeria'})`}
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
                    region={region}
                    onSuccess={() => {
                      onSuccess();
                      onClose();
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
            <div className="p-6 border rounded-lg text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Click the button below to securely update your payment method
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: Card, Mobile Money, Bank Transfer, USSD
              </p>
            </div>
          )}
        </div>

        {paymentProvider === 'paystack' && (
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handlePaystackUpdate} disabled={!paystackLoaded}>
              {paystackLoaded ? (
                'Update Payment Method'
              ) : (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Loading...
                </>
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
  region,
  onSuccess,
  onError,
}: {
  region: 'NA' | 'EU' | 'GH' | 'NG';
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
          await api.settings.updatePaymentMethod({
            paymentMethodId,
            region,
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
