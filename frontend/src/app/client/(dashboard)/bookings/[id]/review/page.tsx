'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { BookingDetails } from '@/shared-types/booking.types';
import Link from 'next/link';

export default function LeaveReviewPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBooking();
  }, [bookingId]);

  async function fetchBooking() {
    try {
      setLoading(true);
      setError('');
      const res = await api.bookings.getById(bookingId);
      setBooking(res.data.booking);

      // Check if booking is eligible for review
      if (res.data.booking.bookingStatus !== 'completed') {
        setError('You can only review completed bookings');
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load booking');
    } finally {
      setLoading(false);
    }
  }

  function handleReviewSuccess() {
    router.push('/client/bookings');
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <Skeleton className="h-10 w-48" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-32 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/client/bookings">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-3xl font-heading font-bold">Leave Review</h1>
        </div>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Booking not found'}</AlertDescription>
        </Alert>

        <Button variant="outline" asChild>
          <Link href="/client/bookings">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Bookings
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/client/bookings">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-3xl font-heading font-bold">Leave Review</h1>
          <p className="text-muted-foreground">Share your experience</p>
        </div>
      </div>

      {/* Review Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>How was your experience?</CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewForm
            bookingId={booking.id}
            serviceTitle={booking.service?.title || 'Service'}
            providerName={booking.provider?.businessName || 'Provider'}
            onSuccess={handleReviewSuccess}
          />
        </CardContent>
      </Card>

      {/* Info */}
      <div className="text-sm text-muted-foreground space-y-2 p-4 bg-muted/50 rounded-lg">
        <p>• You can edit your review within 24 hours of posting</p>
        <p>• Your review will be visible to other clients</p>
        <p>• The provider can respond to your review</p>
      </div>
    </div>
  );
}

