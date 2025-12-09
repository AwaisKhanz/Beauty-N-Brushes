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

export default function TipConfirmationPage({ params }: PageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your tip payment...');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference') || searchParams.get('trxref');

      if (!reference) {
        setStatus('error');
        setMessage('No payment reference found');
        return;
      }

      try {
        // Verify the Paystack payment
        await api.payment.verifyPaystack(reference);
        setStatus('success');
        setMessage('Tip payment successful! Thank you for your generosity.');
        toast('Tip Payment Successful', {
          description: 'Your tip has been processed.',
        });
      } catch (error) {
        console.error('Tip verification error:', error);
        setStatus('error');
        setMessage('Failed to verify tip payment. Please contact support if you were charged.');
        toast('Verification Failed', {
          description: 'Could not verify tip payment status.',
        });
      }
    };

    verifyPayment();
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === 'loading' && <Loader2 className="h-16 w-16 animate-spin text-primary" />}
            {status === 'success' && <CheckCircle2 className="h-16 w-16 text-success" />}
            {status === 'error' && <XCircle className="h-16 w-16 text-destructive" />}
          </div>
          <CardTitle>
            {status === 'loading' && 'Verifying Payment'}
            {status === 'success' && 'Payment Successful'}
            {status === 'error' && 'Verification Failed'}
          </CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === 'success' && (
            <Button 
              className="w-full" 
              onClick={() => router.push(`/client/bookings/${params.id}`)}
            >
              View Booking Details
            </Button>
          )}
          {status === 'error' && (
            <div className="space-y-2">
              <Button 
                className="w-full" 
                onClick={() => router.push(`/client/bookings/${params.id}`)}
              >
                Back to Booking
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => window.location.href = 'mailto:support@beautynbrushes.com'}
              >
                Contact Support
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
