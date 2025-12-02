'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface AddPaymentMethodModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  regionCode: 'NA' | 'EU' | 'GH' | 'NG';
}

function StripePaymentForm({ onSuccess, onCancel }: { onSuccess: () => void; onCancel: () => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Create SetupIntent
      const setupResponse = await api.users.createSetupIntent();
      const clientSecret = setupResponse.data.clientSecret;

      // Confirm card setup
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      const { setupIntent, error: stripeError } = await stripe.confirmCardSetup(clientSecret, {
        payment_method: {
          card: cardElement,
        },
      });

      if (stripeError) {
        throw new Error(stripeError.message);
      }

      if (!setupIntent?.payment_method) {
        throw new Error('Failed to setup payment method');
      }

      // Save payment method
      await api.users.addPaymentMethod({
        paymentMethodId: setupIntent.payment_method as string,
      });

      onSuccess();
    } catch (err) {
      const message = extractErrorMessage(err) || 'Failed to add payment method';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="p-4 border rounded-lg">
        <CardElement
          options={{
            style: {
              base: {
                fontSize: '16px',
                color: '#424770',
                '::placeholder': {
                  color: '#aab7c4',
                },
              },
              invalid: {
                color: '#9e2146',
              },
            },
          }}
        />
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
          Cancel
        </Button>
        <Button type="submit" disabled={!stripe || loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Card'
          )}
        </Button>
      </div>
    </form>
  );
}

function PaystackPaymentForm({ onCancel }: { onCancel: () => void }) {
  const [loading, setLoading] = useState(false);

  async function handlePaystack() {
    try {
      setLoading(true);

      // Initialize Paystack transaction
      const response = await api.users.initializePaystackPaymentMethod();
      const authorizationUrl = response.data.authorizationUrl;

      // Redirect to Paystack
      window.location.href = authorizationUrl;
    } catch (err) {
      const message = extractErrorMessage(err) || 'Failed to initialize payment';
      toast.error(message);
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="p-4 bg-muted/50 rounded-lg text-sm">
        <p className="mb-2">You'll be redirected to Paystack to securely add your card.</p>
        <p className="text-muted-foreground">A minimal authorization charge will be made and immediately refunded.</p>
      </div>

      <div className="flex gap-3">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1" disabled={loading}>
          Cancel
        </Button>
        <Button onClick={handlePaystack} disabled={loading} className="flex-1">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Redirecting...
            </>
          ) : (
            'Continue to Paystack'
          )}
        </Button>
      </div>
    </div>
  );
}

export function AddPaymentMethodModal({ open, onOpenChange, onSuccess, regionCode }: AddPaymentMethodModalProps) {
  const isStripe = regionCode === 'NA' || regionCode === 'EU';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Payment Method</DialogTitle>
        </DialogHeader>

        {isStripe ? (
          <Elements stripe={stripePromise}>
            <StripePaymentForm onSuccess={onSuccess} onCancel={() => onOpenChange(false)} />
          </Elements>
        ) : (
          <PaystackPaymentForm onCancel={() => onOpenChange(false)} />
        )}
      </DialogContent>
    </Dialog>
  );
}
