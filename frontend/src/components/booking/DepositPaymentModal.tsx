'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, CheckCircle2, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { BookingDetails } from '@/shared-types/booking.types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { MobileMoneyForm } from '../payment/MobileMoneyForm';
import { BankTransferForm } from '../payment/BankTransferForm';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface DepositPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetails;
  onSuccess: () => void;
}

export function DepositPaymentModal({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: DepositPaymentModalProps) {
  const [paymentChannel, setPaymentChannel] = useState<'card' | 'mobile_money' | 'bank_transfer'>('card');
  const [step, setStep] = useState<'channel' | 'payment' | 'success'>('channel');
  const [clientSecret, setClientSecret] = useState<string>('');
  const [authorizationUrl, setAuthorizationUrl] = useState<string>('');
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [paymentProvider, setPaymentProvider] = useState<'stripe' | 'paystack'>('stripe');

  const depositAmount = Number(booking.depositAmount || 0);

  // Initialize deposit payment
  async function handleInitializePayment() {
    try {
      setError('');
      setProcessing(true);

      // Call the initialize booking payment API
      const response = await api.payment.initializeBookingPayment({
        bookingId: booking.id,
        paymentType: 'deposit', // ✅ Specify we're paying the deposit
      });

      setPaymentProvider(response.data.paymentProvider as 'stripe' | 'paystack');

      if (response.data.paymentProvider === 'stripe' && response.data.clientSecret) {
        setClientSecret(response.data.clientSecret);
        setStep('payment');
      } else if (response.data.paymentProvider === 'paystack') {
        // Paystack - need to select channel first
        setStep('payment');
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to initialize payment');
    } finally {
      setProcessing(false);
    }
  }

  // Handle payment channel selection for Paystack
  async function handleChannelContinue() {
    try {
      setError('');
      setProcessing(true);

      if (paymentChannel === 'card') {
        // Initialize Paystack card payment
        const response = await api.payment.initializeBookingPayment({
          bookingId: booking.id,
        });

        if (response.data.authorizationUrl) {
          // Redirect to Paystack checkout
          window.location.href = response.data.authorizationUrl;
        }
      } else {
        // Mobile money or bank transfer - show form
        setStep('payment');
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
        setStep('channel');
        setPaymentChannel('card');
        setClientSecret('');
        setError('');
      }, 300);
    }
    onOpenChange(open);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Pay Deposit</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Channel Selection (Paystack only) */}
        {step === 'channel' && paymentProvider === 'paystack' && (
          <div className="space-y-6">
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Deposit Amount:</span>
                <span className="text-xl font-bold text-primary">
                  {booking.currency} {depositAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <div>
              <Label className="text-base font-medium mb-4 block">Select Payment Method</Label>
              <RadioGroup value={paymentChannel} onValueChange={(v) => setPaymentChannel(v as typeof paymentChannel)}>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/5 cursor-pointer">
                    <RadioGroupItem value="card" id="card" />
                    <Label htmlFor="card" className="flex items-center gap-2 cursor-pointer flex-1">
                      <CreditCard className="h-5 w-5" />
                      <div>
                        <div className="font-medium">Card Payment</div>
                        <div className="text-sm text-muted-foreground">Pay with debit or credit card</div>
                      </div>
                    </Label>
                  </div>

                  {booking.currency === 'GHS' && (
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/5 cursor-pointer">
                      <RadioGroupItem value="mobile_money" id="mobile_money" />
                      <Label htmlFor="mobile_money" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Smartphone className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Mobile Money</div>
                          <div className="text-sm text-muted-foreground">MTN, Vodafone, AirtelTigo</div>
                        </div>
                      </Label>
                    </div>
                  )}

                  {booking.currency === 'NGN' && (
                    <div className="flex items-center space-x-3 border rounded-lg p-4 hover:bg-accent/5 cursor-pointer">
                      <RadioGroupItem value="bank_transfer" id="bank_transfer" />
                      <Label htmlFor="bank_transfer" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Building2 className="h-5 w-5" />
                        <div>
                          <div className="font-medium">Bank Transfer</div>
                          <div className="text-sm text-muted-foreground">Direct bank transfer</div>
                        </div>
                      </Label>
                    </div>
                  )}
                </div>
              </RadioGroup>
            </div>

            <Button
              className="w-full"
              onClick={handleChannelContinue}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                'Continue'
              )}
            </Button>
          </div>
        )}

        {/* Step 1: Auto-initialize for Stripe */}
        {step === 'channel' && paymentProvider === 'stripe' && (
          <div className="space-y-6">
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-medium">Deposit Amount:</span>
                <span className="text-xl font-bold text-primary">
                  {booking.currency} {depositAmount.toFixed(2)}
                </span>
              </div>
            </div>

            <Button
              className="w-full"
              onClick={handleInitializePayment}
              disabled={processing}
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Initializing Payment...
                </>
              ) : (
                'Continue to Payment'
              )}
            </Button>
          </div>
        )}

        {/* Step 2: Payment */}
        {step === 'payment' && (
          <div className="space-y-6">
            {/* Stripe Payment */}
            {paymentProvider === 'stripe' && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: 'stripe',
                    variables: {
                      colorPrimary: '#B06F64',
                    },
                  },
                }}
              >
                <StripePaymentForm
                  depositAmount={depositAmount}
                  currency={booking.currency}
                  onSuccess={() => {
                    setStep('success');
                    onSuccess();
                  }}
                  onError={setError}
                />
              </Elements>
            )}

            {/* Paystack Mobile Money */}
            {paymentProvider === 'paystack' && paymentChannel === 'mobile_money' && (
              <MobileMoneyForm
                amount={depositAmount}
                currency={booking.currency as 'GHS'}
                bookingId={booking.id}
                _onSuccess={() => {
                  setStep('success');
                  onSuccess();
                }}
                onError={(err) => setError(err.message)}
              />
            )}

            {/* Paystack Bank Transfer */}
            {paymentProvider === 'paystack' && paymentChannel === 'bank_transfer' && (
              <BankTransferForm
                amount={depositAmount}
                currency={booking.currency as 'NGN'}
                bookingId={booking.id}
                customerEmail={booking.client?.email || ''}
                customerName={`${booking.client?.firstName} ${booking.client?.lastName}`}
                onSuccess={() => {
                  setStep('success');
                  onSuccess();
                }}
                onError={(err) => setError(err.message)}
              />
            )}
          </div>
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
              <h3 className="text-2xl font-semibold mb-2">Payment Successful!</h3>
              <p className="text-muted-foreground">
                Your deposit of {booking.currency} {depositAmount.toFixed(2)} has been received.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Your booking is now confirmed!
              </p>
            </div>
            <Button onClick={() => handleOpenChange(false)}>Close</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Stripe Payment Form Component
function StripePaymentForm({
  depositAmount,
  currency,
  onSuccess,
  onError,
}: {
  depositAmount: number;
  currency: string;
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
          return_url: `${window.location.origin}/client/bookings`,
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
          <span className="font-medium">Deposit Due Now:</span>
          <span className="text-xl font-bold text-primary">
            {currency} {depositAmount.toFixed(2)}
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
          'Pay Now'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secure and encrypted. We use Stripe for payment processing.
      </p>
    </form>
  );
}
