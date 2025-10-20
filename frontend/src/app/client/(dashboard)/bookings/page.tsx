'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Calendar, Clock, MapPin, AlertCircle, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { BookingDetails } from '@/shared-types/booking.types';

export default function ClientBookingsPage() {
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');

  useEffect(() => {
    fetchBookings();
  }, []);

  async function fetchBookings() {
    try {
      setLoading(true);
      setError('');
      const res = await api.bookings.getAll();
      setBookings(res.data.bookings);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'upcoming') {
      return ['PENDING', 'CONFIRMED'].includes(b.bookingStatus);
    }
    if (filter === 'past') {
      return ['COMPLETED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_PROVIDER', 'NO_SHOW'].includes(
        b.bookingStatus
      );
    }
    return true;
  });

  const getStatusBadgeVariant = (
    status: string
  ): 'default' | 'secondary' | 'destructive' | 'outline' => {
    switch (status) {
      case 'CONFIRMED':
        return 'default';
      case 'PENDING':
        return 'secondary';
      case 'COMPLETED':
        return 'outline';
      case 'CANCELLED_BY_CLIENT':
      case 'CANCELLED_BY_PROVIDER':
      case 'NO_SHOW':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  if (loading) {
    return <BookingsSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">My Bookings</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">My Bookings</h1>
          <p className="text-muted-foreground">View and manage your appointments</p>
        </div>
        <Button asChild>
          <Link href="/search">
            <Search className="h-4 w-4 mr-2" />
            Find Services
          </Link>
        </Button>
      </div>

      <Tabs value={filter} onValueChange={(v) => setFilter(v as any)}>
        <TabsList>
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming (
            {bookings.filter((b) => ['PENDING', 'CONFIRMED'].includes(b.bookingStatus)).length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past (
            {
              bookings.filter((b) =>
                ['COMPLETED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_PROVIDER', 'NO_SHOW'].includes(
                  b.bookingStatus
                )
              ).length
            }
            )
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6 space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking) => (
              <Card key={booking.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      <div>
                        <h3 className="font-semibold text-lg">
                          {booking.service?.title || 'Service'}
                        </h3>
                        <p className="text-muted-foreground">
                          {booking.provider?.businessName || 'Provider'}
                        </p>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>
                            {new Date(booking.appointmentDate).toLocaleDateString('en-US', {
                              weekday: 'long',
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                            })}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {booking.appointmentTime} - {booking.appointmentEndTime}
                          </span>
                        </div>
                        {booking.provider && (
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <MapPin className="h-4 w-4" />
                            <span>
                              {booking.provider.city}, {booking.provider.state}
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-4 pt-2">
                        <div>
                          <span className="text-sm text-muted-foreground">Total: </span>
                          <span className="font-semibold">
                            {booking.currency} {booking.totalAmount}
                          </span>
                        </div>
                        {booking.depositAmount > 0 && (
                          <div>
                            <span className="text-sm text-muted-foreground">Deposit: </span>
                            <span className="font-medium">
                              {booking.currency} {booking.depositAmount}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-3">
                      <Badge variant={getStatusBadgeVariant(booking.bookingStatus)}>
                        {booking.bookingStatus.replace(/_/g, ' ')}
                      </Badge>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/client/bookings/${booking.id}`}>View Details</Link>
                        </Button>

                        {['PENDING', 'CONFIRMED'].includes(booking.bookingStatus) && (
                          <Button variant="ghost" size="sm">
                            Cancel
                          </Button>
                        )}

                        {booking.bookingStatus.toUpperCase() === 'COMPLETED' && (
                          <Button variant="default" size="sm" asChild>
                            <Link href={`/client/bookings/${booking.id}/review`}>Leave Review</Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No bookings found</h3>
              <p className="text-muted-foreground mb-6">
                {filter === 'upcoming'
                  ? "You don't have any upcoming appointments"
                  : filter === 'past'
                    ? "You don't have any past appointments"
                    : "You haven't made any bookings yet"}
              </p>
              <Button asChild>
                <Link href="/search">
                  <Search className="h-4 w-4 mr-2" />
                  Browse Services
                </Link>
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function BookingsSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <Skeleton className="h-10 w-full max-w-md" />

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="space-y-4">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-4 w-48" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-full max-w-xs" />
                  <Skeleton className="h-4 w-full max-w-sm" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
