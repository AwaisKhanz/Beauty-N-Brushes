'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { ROUTES } from '@/constants';

export default function PaymentCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing payment...');

  useEffect(() => {
    const processPayment = async () => {
      try {
        const reference = searchParams.get('reference');
        const provider = searchParams.get('provider');
        const trxref = searchParams.get('trxref'); // Paystack also sends trxref

        // Use either reference or trxref
        const transactionRef = reference || trxref;

        if (!transactionRef || !provider) {
          throw new Error('Missing payment information');
        }

        if (provider === 'paystack') {
          // ✅ NEW SUBSCRIPTION FLOW:
          // Subscription was already created during initialization
          // We just need to verify the payment was successful
          
          setMessage('Verifying payment with Paystack...');
          
          const verifyResponse = await api.payment.verifyPaystack(transactionRef);

          if (verifyResponse.data.status !== 'success') {
            throw new Error('Payment verification failed');
          }

          // Payment successful! Subscription is already active in database
          // (saved during initialization in initializePaystackSubscription)
          setStatus('success');
          setMessage('Payment successful! Your subscription is now active.');

          // Redirect to complete onboarding
          setTimeout(() => {
            router.push(ROUTES.PROVIDER.ONBOARDING);
          }, 2000);
        } else if (provider === 'stripe') {
          // Stripe flow (if needed)
          setStatus('success');
          setMessage('Payment successful! Setting up your subscription...');
          
          setTimeout(() => {
            router.push(ROUTES.PROVIDER.ONBOARDING);
          }, 2000);
        } else {
          throw new Error('Invalid payment provider');
        }
      } catch (error: unknown) {
        setStatus('error');
        const errorMessage =
          error instanceof Error ? error.message : 'Payment processing failed. Please try again.';
        setMessage(errorMessage);

        // Redirect back to payment setup after 3 seconds
        setTimeout(() => {
          router.push(ROUTES.PROVIDER.ONBOARDING);
        }, 3000);
      }
    };

    processPayment();
  }, [searchParams, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center justify-center gap-2">
            {status === 'loading' && <Loader2 className="h-6 w-6 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-6 w-6 text-success" />}
            {status === 'error' && <XCircle className="h-6 w-6 text-destructive" />}
            <span>
              {status === 'loading' && 'Processing Payment'}
              {status === 'success' && 'Payment Successful'}
              {status === 'error' && 'Payment Failed'}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-muted-foreground">{message}</p>
          {status === 'loading' && (
            <div className="mt-4 space-y-2">
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-2/3" />
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Please don't close this window...
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
