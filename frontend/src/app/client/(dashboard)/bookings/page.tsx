'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import {
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  Search,
  DollarSign,
  CalendarPlus,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import type { BookingDetails } from '@/shared-types/booking.types';
import { RescheduleModal } from '@/components/booking/RescheduleModal';
import { BalancePaymentModal } from '@/components/booking/BalancePaymentModal';
import { DepositPaymentModal } from '@/components/booking/DepositPaymentModal';
import { CancelBookingModal } from '@/components/booking/CancelBookingModal';
import { RebookServiceModal } from '@/components/booking/RebookServiceModal';
import { exportBookingToCalendar } from '@/lib/calendar-export';
import { useBookingSocket } from '@/hooks/use-booking-socket';

export default function ClientBookingsPage() {
  useBookingSocket(); // Enable real-time booking updates
  const [bookings, setBookings] = useState<BookingDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'past'>('all');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [balancePaymentModalOpen, setBalancePaymentModalOpen] = useState(false);
  const [depositPaymentModalOpen, setDepositPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rebookModalOpen, setRebookModalOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<BookingDetails | null>(null);

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

  function handleRescheduleClick(booking: BookingDetails) {
    setSelectedBooking(booking);
    setRescheduleModalOpen(true);
  }

  function handleRescheduleSuccess() {
    fetchBookings(); // Refresh bookings list
  }

  function handlePayBalanceClick(booking: BookingDetails) {
    setSelectedBooking(booking);
    setBalancePaymentModalOpen(true);
  }

  function handlePayDepositClick(booking: BookingDetails) {
    setSelectedBooking(booking);
    setDepositPaymentModalOpen(true);
  }

  function handleBalancePaymentSuccess() {
    fetchBookings(); // Refresh bookings list
  }

  function handleDepositPaymentSuccess() {
    fetchBookings(); // Refresh bookings list
  }

  function handleCancelClick(booking: BookingDetails) {
    setSelectedBooking(booking);
    setCancelModalOpen(true);
  }

  function handleCancelSuccess() {
    fetchBookings(); // Refresh bookings list
  }

  function calculateBalanceOwed(booking: BookingDetails): number {
    return booking.servicePrice - booking.depositAmount;
  }

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'upcoming') {
      return ['pending', 'confirmed'].includes(b.bookingStatus);
    }
    if (filter === 'past') {
      return ['completed', 'cancelled_by_client', 'cancelled_by_provider', 'no_show'].includes(
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

      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList>
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="upcoming">
            Upcoming (
            {bookings.filter((b) => ['pending', 'confirmed'].includes(b.bookingStatus)).length})
          </TabsTrigger>
          <TabsTrigger value="past">
            Past (
            {
              bookings.filter((b) =>
                ['completed', 'cancelled_by_client', 'cancelled_by_provider', 'no_show'].includes(
                  b.bookingStatus
                )
              ).length
            }
            )
          </TabsTrigger>
        </TabsList>

        <TabsContent value={filter} className="mt-6 space-y-4">
          {filteredBookings.length > 0 ? (
            filteredBookings.map((booking: BookingDetails) => (
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
                            <span className="text-sm text-muted-foreground">Deposit Due: </span>
                            <span className="font-medium">
                              {booking.currency}{' '}
                              {(
                                Number(booking.depositAmount) + Number(booking.serviceFee)
                              ).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-start md:items-end gap-3">
                      <div className="flex flex-col gap-2">
                        <Badge variant={getStatusBadgeVariant(booking.bookingStatus)}>
                          {booking.bookingStatus.replace('_', ' ')}
                      </Badge>
                      <PaymentStatusBadge status={booking.paymentStatus} variant="compact" />
                    </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/client/bookings/${booking.id}`}>View Details</Link>
                        </Button>

                        {/* Add to Calendar Button */}
                        {['pending', 'confirmed'].includes(booking.bookingStatus) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => exportBookingToCalendar(booking)}
                          >
                            <CalendarPlus className="h-4 w-4 mr-1" />
                            Add to Calendar
                          </Button>
                        )}

                        {/* Pay Deposit Button - Show when deposit not paid yet */}
                        {booking.paymentStatus === 'AWAITING_DEPOSIT' && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePayDepositClick(booking)}
                            className="bg-primary hover:bg-primary/90"
                          >
                            <DollarSign className="h-4 w-4 mr-1" />
                            Pay Deposit ($
                            {(
                              Number(booking.depositAmount) + Number(booking.serviceFee)
                            ).toFixed(2)}
                            )
                          </Button>
                        )}

                        {/* Pay Balance Button - Show when deposit paid but balance remains */}
                        {booking.paymentStatus === 'DEPOSIT_PAID' &&
                          calculateBalanceOwed(booking) > 0 &&
                          ['confirmed'].includes(booking.bookingStatus) && (
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => handlePayBalanceClick(booking)}
                              className="bg-button-dark hover:bg-button-dark/90"
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Pay Balance
                            </Button>
                          )}

                        {['pending', 'confirmed'].includes(booking.bookingStatus) && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleRescheduleClick(booking)}
                            >
                              Reschedule
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCancelClick(booking)}
                            >
                              Cancel
                            </Button>
                          </>
                        )}

                        {booking.bookingStatus === 'COMPLETED' && (
                          <>
                            <Button variant="default" size="sm" asChild>
                              <Link href={`/client/bookings/${booking.id}/review`}>
                                Leave Review
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedBooking(booking);
                                setRebookModalOpen(true);
                              }}
                            >
                              <RefreshCw className="h-4 w-4 mr-1" />
                              Rebook
                            </Button>
                          </>
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

      {/* Reschedule Modal */}
      {selectedBooking && (
        <RescheduleModal
          open={rescheduleModalOpen}
          onOpenChange={setRescheduleModalOpen}
          bookingId={selectedBooking.id}
          providerId={selectedBooking.provider?.id || ''}
          serviceId={selectedBooking.service?.id || ''}
          serviceDuration={selectedBooking.service?.durationMinutes || 60}
          onSuccess={handleRescheduleSuccess}
        />
      )}

      {/* Balance Payment Modal */}
      {selectedBooking && (
        <BalancePaymentModal
          open={balancePaymentModalOpen}
          onOpenChange={setBalancePaymentModalOpen}
          booking={selectedBooking}
          onSuccess={handleBalancePaymentSuccess}
        />
      )}

      {/* Deposit Payment Modal */}
      {selectedBooking && (
        <DepositPaymentModal
          open={depositPaymentModalOpen}
          onOpenChange={setDepositPaymentModalOpen}
          booking={selectedBooking}
          onSuccess={handleDepositPaymentSuccess}
        />
      )}

      {/* Cancel Booking Modal */}
      {selectedBooking && (
        <CancelBookingModal
          open={cancelModalOpen}
          onOpenChange={setCancelModalOpen}
          booking={selectedBooking}
          onSuccess={handleCancelSuccess}
        />
      )}

      {/* Rebook Service Modal */}
      {selectedBooking && (
        <RebookServiceModal
          open={rebookModalOpen}
          onOpenChange={setRebookModalOpen}
          booking={selectedBooking}
        />
      )}
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
