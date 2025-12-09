'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calendar,
  Clock,
  MapPin,
  User,
  DollarSign,
  CreditCard,
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { useBookingSocket } from '@/hooks/use-booking-socket';
import { useRefundSocket } from '@/hooks/use-refund-socket';
import type { BookingDetails } from '@/shared-types/booking.types';
import { RefundCard } from '@/components/booking/RefundCard';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { AssignTeamMemberModal } from '@/components/booking/AssignTeamMemberModal';
import { ProviderCancelModal } from '@/components/booking/ProviderCancelModal';
import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { BookingPhotos } from '@/components/booking/BookingPhotos';
import { BookingReview } from '@/components/booking/BookingReview';

export default function ProviderBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refunds, setRefunds] = useState<any[]>([]);
  const [assignTeamMemberModalOpen, setAssignTeamMemberModalOpen] = useState(false);
  const [noShowConfirmOpen, setNoShowConfirmOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  // Enable real-time updates
  useBookingSocket();
  useRefundSocket(bookingId, fetchRefunds);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
  }, [bookingId]);

  async function fetchBooking() {
    try {
      setLoading(true);
      setError('');
      const response = await api.bookings.getById(bookingId);
      setBooking(response.data.booking);
      // Fetch refunds after booking loads
      fetchRefunds();
    } catch (err: unknown) {
      const message = extractErrorMessage(err) || 'Failed to load booking details';
      setError(message);
      toast.error('Failed to load booking', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  async function fetchRefunds() {
    try {
      const response = await api.bookings.getRefunds(bookingId);
      setRefunds(response.refunds || []);
    } catch (err: unknown) {
      console.error('Failed to fetch refunds:', err);
    }
  }

  async function handleConfirmBooking() {
    try {
      await api.bookings.confirm(bookingId);
      toast.success('Booking confirmed');
      fetchBooking();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to confirm booking');
    }
  }

  async function handleMarkCompleted() {
    try {
      await api.bookings.complete(bookingId, {});
      toast.success('Booking marked as completed');
      fetchBooking();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to mark booking as completed');
    }
  }

  function handleMarkNoShowClick() {
    setNoShowConfirmOpen(true);
  }

  async function handleMarkNoShowConfirm() {
    try {
      await api.bookings.markNoShow(bookingId, { notes: 'Client did not arrive for appointment' });
      toast.success('Booking marked as no-show');
      fetchBooking();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to mark booking as no-show');
    } finally {
      setNoShowConfirmOpen(false);
    }
  }



  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'CONFIRMED':
        return 'bg-info/10 text-info border-info/30';
      case 'COMPLETED':
        return 'bg-success/10 text-success border-success/30';
      case 'CANCELLED_BY_CLIENT':
      case 'CANCELLED_BY_PROVIDER':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'no_show':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4" />;
      case 'confirmed':
        return <CheckCircle className="h-4 w-4" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'cancelled_by_client':
      case 'cancelled_by_provider':
        return <XCircle className="h-4 w-4" />;
      case 'no_show':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  }

  function formatCurrency(amount: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function formatTime(timeString: string) {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-32" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !booking) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Booking not found'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  // Define which actions are available based on booking status
  const isActiveBooking = !['COMPLETED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_PROVIDER', 'NO_SHOW'].includes(booking.bookingStatus);
  const canConfirm = booking.bookingStatus === 'PENDING' && booking.paymentStatus === 'DEPOSIT_PAID';
  const canMarkCompleted = booking.bookingStatus === 'CONFIRMED' && new Date(`${booking.appointmentDate}T${booking.appointmentTime}`) < new Date();
  const canMarkNoShow = ['PENDING', 'CONFIRMED'].includes(booking.bookingStatus) && new Date(`${booking.appointmentDate}T${booking.appointmentTime}`) < new Date();
  const canAssignTeamMember = booking?.provider?.isSalon && !booking.assignedTeamMember && isActiveBooking;
  const canCancel = isActiveBooking;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        <div className="flex items-center gap-2">
          <Badge className={getStatusColor(booking.bookingStatus)}>
            {getStatusIcon(booking.bookingStatus)}
            <span className="ml-1">{booking.bookingStatus.replace('_', ' ')}</span>
          </Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Appointment Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>Date</span>
                  </div>
                  <p className="font-medium">{formatDate(booking.appointmentDate)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Time</span>
                  </div>
                  <p className="font-medium">{formatTime(booking.appointmentTime)}</p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>Location</span>
                  </div>
                  <p className="font-medium">{booking.provider?.businessName || 'Your Business'}</p>
                  <p className="text-sm text-muted-foreground">
                    {booking.provider?.locations?.[0]?.addressLine1 &&
                    booking.provider?.city &&
                    booking.provider?.state
                      ? `${booking.provider.locations[0].addressLine1}, ${booking.provider.city}, ${booking.provider.state}`
                      : 'Location not specified'}
                  </p>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>Duration</span>
                  </div>
                  <p className="font-medium">{booking.service?.durationMinutes || 0} minutes</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Service Details */}
          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{booking.service?.title || 'Service'}</h3>
                  <p className="text-muted-foreground mt-1">Professional service</p>
                </div>

                {booking.specialRequests && (
                  <div>
                    <h4 className="font-medium mb-2">Special Requests</h4>
                    <p className="text-sm text-muted-foreground">{booking.specialRequests}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Booking Photos */}
          {booking.photos && (
            <BookingPhotos
              bookingId={booking.id}
              photos={booking.photos}
              canUpload={false}
              canDelete={false}
              onUpdate={fetchBooking}
            />
          )}

          {/* Review Display */}
          {booking.review && (
            <BookingReview review={booking.review} />
          )}

          {/* Refund Information */}
          {refunds.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Refund Information</h3>
              {refunds.map((refund: any) => (
                <RefundCard key={refund.id} refund={refund} />
              ))}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Payment Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Payment Status
                </CardTitle>
                <PaymentStatusBadge status={booking.paymentStatus} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    className={
                      booking.paymentStatus === 'FULLY_PAID'
                        ? 'bg-success/10 text-success border-success/30'
                        : booking.paymentStatus === 'DEPOSIT_PAID'
                          ? 'bg-info/10 text-info border-info/30'
                          : booking.paymentStatus === 'AWAITING_DEPOSIT'
                            ? 'bg-warning/10 text-warning border-warning/30'
                            : 'bg-muted text-muted-foreground border-border'
                    }
                  >
                    {booking.paymentStatus.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Warning for unpaid deposit - only show for active bookings */}
                {booking.paymentStatus === 'AWAITING_DEPOSIT' && isActiveBooking && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Client has not paid the deposit of {booking.currency} {booking.depositAmount} yet.
                      Booking cannot be confirmed until payment is received.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Only show payment details if payment has been made */}
                {booking.paymentStatus !== 'AWAITING_DEPOSIT' && (
                  <>
                    {booking.paidAt && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Paid On</span>
                        <span className="text-sm font-medium">
                          {new Date(booking.paidAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </span>
                      </div>
                    )}

                    {booking.paymentMethod && (
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Method</span>
                        <span className="text-sm font-medium capitalize">
                          {booking.paymentChannel || booking.paymentMethod}
                        </span>
                      </div>
                    )}

                    {(booking.paystackReference || booking.stripePaymentIntentId) && (
                      <div className="flex flex-col gap-1">
                        <span className="text-sm text-muted-foreground">Transaction ID</span>
                        <span className="text-xs font-mono bg-muted px-2 py-1 rounded">
                          {booking.paystackReference || booking.stripePaymentIntentId}
                        </span>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Payment Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Payment Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Service Breakdown */}
                <div className="flex justify-between text-sm">
                  <span>Service Price</span>
                  <span>{formatCurrency(booking.servicePrice, booking.currency)}</span>
                </div>

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Fee (Client Pays)</span>
                  <span>{formatCurrency(booking.serviceFee, booking.currency)}</span>
                </div>

                {/* Total Amount - Calculate correctly: servicePrice + serviceFee */}
                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total Amount</span>
                    <span>{formatCurrency(Number(booking.servicePrice) + Number(booking.serviceFee), booking.currency)}</span>
                  </div>
                </div>

                {/* Paid at Booking Section */}
                <div className="border-t pt-3 space-y-2">
                  <div className="text-sm font-medium text-muted-foreground mb-2">
                    Paid at Booking:
                  </div>
                  <div className="flex justify-between text-sm pl-4">
                    <span>Deposit (25%)</span>
                      <span className="text-success">
                      {formatCurrency(booking.depositAmount, booking.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pl-4">
                    <span>Platform Fee</span>
                      <span className="text-success">
                      {formatCurrency(booking.serviceFee, booking.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pl-4 border-t pt-2">
                    <span>Total Paid</span>
                      <span className="text-success">
                      {formatCurrency(Number(booking.depositAmount) + Number(booking.serviceFee), booking.currency)}
                    </span>
                  </div>
                </div>

                {/* Balance Due Section */}
                {booking.paymentStatus !== 'FULLY_PAID' && booking.servicePrice - booking.depositAmount > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Balance Due (from client)</span>
                      <span className="text-warning">
                        {formatCurrency(
                          Number(booking.servicePrice) - Number(booking.depositAmount),
                          booking.currency
                        )}
                      </span>
                    </div>
                  </div>
                )}

                {/* Tip Section */}
                {booking.tipAmount > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm">
                      <span>Tip Received</span>
                        <span className="text-success">
                        {formatCurrency(booking.tipAmount, booking.currency)}
                      </span>
                    </div>
                  </div>
                )}

                {/* Provider Earnings */}
                <div className="border-t pt-3 bg-muted/50 -mx-6 px-6 py-3 mt-4">
                  <div className="flex justify-between font-semibold text-primary">
                    <span>Your Earnings</span>
                    <span>
                      {formatCurrency(
                        Number(booking.servicePrice) + (Number(booking.tipAmount) || 0),
                        booking.currency
                      )}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Service price + tip (platform fee excluded)
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canConfirm && (
                <Button 
                  onClick={handleConfirmBooking} 
                  className="w-full gap-2"
                  disabled={booking.paymentStatus === 'AWAITING_DEPOSIT'}
                >
                  <CheckCircle className="h-4 w-4" />
                  {booking.paymentStatus === 'AWAITING_DEPOSIT' 
                    ? 'Awaiting Client Payment' 
                    : 'Confirm Booking'}
                </Button>
              )}

              {canMarkCompleted && (
                <Button onClick={handleMarkCompleted} className="w-full gap-2">
                  <CheckCircle className="h-4 w-4" />
                  Mark as Completed
                </Button>
              )}

              {canMarkNoShow && (
                <Button onClick={handleMarkNoShowClick} variant="destructive" className="w-full gap-2">
                  <XCircle className="h-4 w-4" />
                  Mark as No-Show
                </Button>
              )}

              {/* Team Member Assignment for Salon Bookings - Only for active bookings */}
              {canAssignTeamMember && (
                <Button
                  onClick={() => setAssignTeamMemberModalOpen(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <User className="h-4 w-4" />
                  Assign Team Member
                </Button>
              )}

              {/* Cancel Booking - Only for active bookings */}
              {canCancel && (
                <Button
                  onClick={() => setCancelModalOpen(true)}
                  variant="outline"
                  className="w-full gap-2 text-destructive hover:text-destructive"
                >
                  <XCircle className="h-4 w-4" />
                  Cancel Booking
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      

      {/* Modals */}
      <AssignTeamMemberModal
        open={assignTeamMemberModalOpen}
        onOpenChange={setAssignTeamMemberModalOpen}
        bookingId={bookingId}
        onSuccess={fetchBooking}
      />

      <ConfirmationDialog
        open={noShowConfirmOpen}
        onOpenChange={setNoShowConfirmOpen}
        title="Mark as No-Show"
        description="Are you sure you want to mark this booking as a no-show? This action cannot be undone."
        onConfirm={handleMarkNoShowConfirm}
        confirmText="Mark as No-Show"
        variant="destructive"
      />

      <ProviderCancelModal
        open={cancelModalOpen}
        onOpenChange={setCancelModalOpen}
        booking={booking}
        onSuccess={fetchBooking}
      />
    </div>
  );
}
