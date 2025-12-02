'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface PendingReview {
  id: string;
  service: {
    title: string;
  };
  provider: {
    businessName: string;
  };
  appointmentDate: string;
  appointmentTime: string;
}

export function PendingReviews() {
  const router = useRouter();
  const [bookings, setBookings] = useState<PendingReview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPendingReviews();
  }, []);

  async function fetchPendingReviews() {
    try {
      setLoading(true);
      const response = await api.bookings.getPendingReviews();
      setBookings(response.data.bookings);
    } catch (err) {
      const message = extractErrorMessage(err) || 'Failed to load pending reviews';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Pending Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Loading...</p>
        </CardContent>
      </Card>
    );
  }

  if (bookings.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Pending Reviews
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No pending reviews</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Pending Reviews ({bookings.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {bookings.slice(0, 3).map((booking) => (
            <div
              key={booking.id}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-accent/50 transition-colors"
            >
              <div className="flex-1">
                <p className="font-medium">{booking.service.title}</p>
                <p className="text-sm text-muted-foreground">
                  {booking.provider.businessName}
                </p>
                <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                  <Clock className="h-3 w-3" />
                  {new Date(booking.appointmentDate).toLocaleDateString()}
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => router.push(`/client/bookings/${booking.id}/review`)}
                className="gap-1"
              >
                <Star className="h-3 w-3" />
                Review
              </Button>
            </div>
          ))}
          
          {bookings.length > 3 && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push('/client/bookings?filter=pending-reviews')}
            >
              View all {bookings.length} pending reviews
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
