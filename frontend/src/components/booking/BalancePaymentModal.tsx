'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2, Banknote, CreditCard } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { BookingDetails } from '@/shared-types/booking.types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface BalancePaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetails;
  onSuccess: () => void;
}

export function BalancePaymentModal({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: BalancePaymentModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cash'>('online');
  const [step, setStep] = useState<'method' | 'payment' | 'success'>('method');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const balanceAmount = Number(booking.servicePrice || 0) - Number(booking.depositAmount || 0);

  // Initialize payment based on selected method
  async function handlePaymentMethodSubmit() {
    try {
      setError('');
      setProcessing(true);

      const response = await api.payment.payBalance({
        bookingId: booking.id,
        paymentMethod,
      });

      if (paymentMethod === 'cash') {
        // Cash payment - no online processing needed
        setStep('success');
        onSuccess();
      } else {
        // Online payment
        if (response.data.paymentProvider === 'stripe' && response.data.clientSecret) {
          setClientSecret(response.data.clientSecret);
          setStep('payment');
        } else if (response.data.paymentProvider === 'paystack' && response.data.authorizationUrl) {
          // Redirect to Paystack
          window.location.href = response.data.authorizationUrl;
        }
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  }

  // Reset when modal closes
  function handleOpenChange(open: boolean) {
    if (!open) {
      setTimeout(() => {
        setStep('method');
        setPaymentMethod('online');
        setClientSecret('');
        setError('');
      }, 300);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pay Remaining Balance</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Payment Method */}
        {step === 'method' && (
          <div className="space-y-4">
            {/* Balance Amount Display */}
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Service Total:</span>
                <span className="font-medium">
                  {booking.currency} {Number(booking.servicePrice || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className="text-sm text-muted-foreground">Deposit Paid:</span>
                <span className="font-medium">
                  -{booking.currency} {Number(booking.depositAmount || 0).toFixed(2)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between items-center">
                <span className="font-semibold">Balance Due:</span>
                <span className="text-xl font-bold text-primary">
                  {booking.currency} {balanceAmount.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div>
              <h3 className="font-medium mb-3">Choose Payment Method</h3>
              <RadioGroup
                value={paymentMethod}
                onValueChange={(val) => setPaymentMethod(val as 'online' | 'cash')}
              >
                {/* Online Payment Option */}
                <div
                  className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'online'
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/10'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  onClick={() => setPaymentMethod('online')}
                >
                  <RadioGroupItem value="online" id="online" />
                  <Label htmlFor="online" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Pay Online</p>
                        <p className="text-sm text-muted-foreground">
                          {booking.paymentProvider === 'stripe'
                            ? 'Pay securely with card'
                            : 'Card or Mobile Money'}
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>

                {/* Cash Payment Option */}
                <div
                  className={`flex items-center space-x-3 p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    paymentMethod === 'cash'
                      ? 'border-primary bg-gradient-to-br from-primary/10 to-accent/10'
                      : 'border-border hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  onClick={() => setPaymentMethod('cash')}
                >
                  <RadioGroupItem value="cash" id="cash" />
                  <Label htmlFor="cash" className="flex-1 cursor-pointer">
                    <div className="flex items-center gap-2">
                      <Banknote className="h-5 w-5 text-primary" />
                      <div>
                        <p className="font-medium">Pay Cash at Appointment</p>
                        <p className="text-sm text-muted-foreground">
                          Pay the provider directly when you arrive
                        </p>
                      </div>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              className="w-full bg-button-dark hover:bg-button-dark/90 text-white"
              onClick={handlePaymentMethodSubmit}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Continue</>
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Payment Form (Online - Stripe only) */}
        {step === 'payment' && clientSecret && (
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
            <StripeBalancePaymentForm
              booking={booking}
              balanceAmount={balanceAmount}
              onSuccess={() => {
                setStep('success');
                onSuccess();
              }}
              onError={setError}
            />
          </Elements>
        )}

        {/* Step 3: Success */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle2 className="h-12 w-12 text-success" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">
                {paymentMethod === 'cash' ? 'Payment Method Saved' : 'Payment Successful!'}
              </h3>
              <p className="text-muted-foreground">
                {paymentMethod === 'cash'
                  ? 'You can pay the remaining balance in cash at your appointment'
                  : 'Your payment has been processed successfully'}
              </p>
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Amount Paid:</span>
                  <span className="font-medium">
                    {booking.currency}{' '}
                    {paymentMethod === 'cash' ? '0.00' : balanceAmount.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Remaining Balance:</span>
                  <span className="font-medium">
                    {booking.currency}{' '}
                    {paymentMethod === 'cash' ? balanceAmount.toFixed(2) : '0.00'}
                  </span>
                </div>
              </div>
            </div>

            <Button className="w-full" onClick={() => handleOpenChange(false)}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Stripe Payment Form Component
function StripeBalancePaymentForm({
  booking,
  balanceAmount,
  onSuccess,
  onError,
}: {
  booking: BookingDetails;
  balanceAmount: number;
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

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/client/bookings/${booking.id}`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      onError(extractErrorMessage(err) || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-medium mb-4 text-foreground">Payment Details</h3>
        <div className="border border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <PaymentElement />
        </div>
      </div>

      <Separator />

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Due Now:</span>
          <span className="text-xl font-bold text-primary">
            {booking.currency} {balanceAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-button-dark hover:bg-button-dark/90 text-white"
        disabled={!stripe || processing}
      >
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            Pay {booking.currency} {balanceAmount.toFixed(2)}
          </>
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secure and encrypted
      </p>
    </form>
  );
}
