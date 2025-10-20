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
import type { PaystackResponse, WindowWithPaystack } from '@/types';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [stripeLoaded, setStripeLoaded] = useState(false);
  const [paystackLoaded, setPaystackLoaded] = useState(false);

  useEffect(() => {
    // Load Stripe or Paystack based on payment provider
    if (paymentProvider === 'stripe' && !stripeLoaded) {
      loadStripe();
    } else if (paymentProvider === 'paystack' && !paystackLoaded) {
      loadPaystack();
    }
  }, [paymentProvider, stripeLoaded, paystackLoaded]);

  function loadStripe() {
    if (document.querySelector('script[src*="stripe.com"]')) {
      setStripeLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://js.stripe.com/v3/';
    script.async = true;
    script.onload = () => setStripeLoaded(true);
    document.body.appendChild(script);
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

  async function handleStripeUpdate() {
    try {
      setLoading(true);
      setError('');

      // TODO: Implement Stripe Elements integration
      // This is a placeholder implementation
      alert('Stripe payment method update coming soon. Full Stripe Elements integration required.');

      onSuccess();
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update payment method');
    } finally {
      setLoading(false);
    }
  }

  async function handlePaystackUpdate() {
    try {
      setLoading(true);
      setError('');

      // Initialize Paystack inline
      const windowWithPaystack = window as WindowWithPaystack;

      if (typeof window !== 'undefined' && windowWithPaystack.PaystackPop) {
        const handler = windowWithPaystack.PaystackPop.setup({
          key: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
          email: 'provider@example.com', // TODO: Get from user data
          amount: 0, // Authorization only
          currency: region === 'GH' ? 'GHS' : 'NGN',
          ref: `payment_method_${Date.now()}`,
          onClose: function () {
            setLoading(false);
          },
          callback: function (_response: PaystackResponse) {
            // TODO: Send authorization code to backend
            // console.log('Payment method authorization:', _response);
            onSuccess();
          },
        });

        handler.openIframe();
      } else {
        throw new Error('Paystack not loaded');
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update payment method');
      setLoading(false);
    }
  }

  function handleSubmit() {
    if (paymentProvider === 'stripe') {
      handleStripeUpdate();
    } else {
      handlePaystackUpdate();
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

          {/* Stripe Payment Form Placeholder */}
          {paymentProvider === 'stripe' && (
            <div className="p-6 border rounded-lg text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-4">
                Stripe Elements will be embedded here for secure card entry
              </p>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Full Stripe Elements integration coming soon. This will allow you to securely
                  update your card without leaving this page.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Paystack Info */}
          {paymentProvider === 'paystack' && (
            <div className="p-6 border rounded-lg text-center">
              <CreditCard className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Click the button below to securely add your payment method
              </p>
              <p className="text-xs text-muted-foreground">
                Supports: Card, Mobile Money, Bank Transfer, USSD
              </p>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Update Payment Method'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
