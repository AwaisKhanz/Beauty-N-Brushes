'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface PageProps {
  params: {
    id: string;
  };
}

export default function BookingConfirmationPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref'); // Paystack sends both

      if (!reference && !trxref) {
        setStatus('error');
        setMessage('No payment reference found');
        return;
      }

      try {
        // Verify transaction with backend
        await api.payment.verifyPaystack(reference || trxref || '');
        setStatus('success');
        setMessage('Payment successful! Your booking has been confirmed.');
        toast('Payment Successful', {
          description: 'Your booking has been confirmed.',
        });
      } catch (error) {
        console.error('Payment verification failed:', error);
        setStatus('error');
        setMessage('Failed to verify payment. Please contact support if you were charged.');
        toast('Verification Failed', {
          description: 'Could not verify payment status.',
        });
      }
    };

    verifyPayment();
  }, [searchParams, params.id, toast]);

  return (
    <div className="container max-w-md mx-auto py-20 px-4">
      <Card>
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && (
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
            )}
            {status === 'success' && (
              <CheckCircle2 className="h-12 w-12 text-success" />
            )}
            {status === 'error' && (
              <XCircle className="h-12 w-12 text-destructive" />
            )}
          </div>
          <CardTitle>
            {status === 'loading' && 'Verifying Payment'}
            {status === 'success' && 'Booking Confirmed'}
            {status === 'error' && 'Payment Verification Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {status === 'success' && (
            <Button 
              className="w-full" 
              onClick={() => router.push(`/client/bookings/${params.id}`)}
            >
              Go to My Bookings
            </Button>
          )}
          {status === 'error' && (
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => router.push(`/services`)}
            >
              Return to Services
            </Button>
          )}
          <Button 
            variant="ghost" 
            className="w-full"
            onClick={() => router.push('/')}
          >
            Return Home
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
