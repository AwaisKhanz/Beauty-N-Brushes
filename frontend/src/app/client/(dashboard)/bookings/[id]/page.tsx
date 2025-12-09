'use client';

import { useEffect, useState, useCallback } from 'react';
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
  AlertCircle,
  ArrowLeft,
  MessageSquare,
  Star,
  RefreshCw,
  X,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { BookingDetails } from '@/shared-types/booking.types';
import { RescheduleModal } from '@/components/booking/RescheduleModal';
import { BalancePaymentModal } from '@/components/booking/BalancePaymentModal';
import { DepositPaymentModal } from '@/components/booking/DepositPaymentModal';
import { CancelBookingModal } from '@/components/booking/CancelBookingModal';
import { RebookServiceModal } from '@/components/booking/RebookServiceModal';
import { TipPaymentModal } from '@/components/booking/TipPaymentModal';
import { ReviewModal } from '@/components/booking/ReviewModal';
import { BookingPhotos } from '@/components/booking/BookingPhotos';
import { BookingReview } from '@/components/booking/BookingReview';
import { BookingCountdownTimer } from '@/components/booking/BookingCountdownTimer';
import { ReportNoShowModal } from '@/components/booking/ReportNoShowModal';
import { RefundCard } from '@/components/booking/RefundCard';
// import { PaymentStatusBadge } from '@/components/booking/PaymentStatusBadge';
import { useBookingSocket } from '@/hooks/use-booking-socket';
import { useRefundSocket } from '@/hooks/use-refund-socket';
// import { exportBookingToCalendar } from '@/lib/calendar-export'; // TODO: Add export to calendar feature
import { toast } from 'sonner';

export default function ClientBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [balancePaymentModalOpen, setBalancePaymentModalOpen] = useState(false);
  const [depositPaymentModalOpen, setDepositPaymentModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rebookModalOpen, setRebookModalOpen] = useState(false);
  const [tipPaymentModalOpen, setTipPaymentModalOpen] = useState(false);
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [reportNoShowModalOpen, setReportNoShowModalOpen] = useState(false);
  const [refunds, setRefunds] = useState<any[]>([]);

  // ✅ Define fetchRefunds before using it in useRefundSocket
  const fetchRefunds = useCallback(async () => {
    try {
      const response = await api.bookings.getRefunds(bookingId);
      setRefunds(response.refunds || []);
    } catch (err: unknown) {
      console.error('Failed to fetch refunds:', err);
    }
  }, [bookingId]);

  // ✅ Define fetchBooking before useEffect
  const fetchBooking = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.bookings.getById(bookingId);
      setBooking(response.data.booking);
      // Fetch refunds if booking exists
      if (response.data.booking) {
        fetchRefunds();
      }
    } catch (err: unknown) {
      const message = extractErrorMessage(err) || 'Failed to load booking details';
      setError(message);
      toast.error('Failed to load booking', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }, [bookingId]); // ✅ Removed fetchRefunds from dependencies to prevent infinite loop

  // ✅ Enable real-time booking updates via Socket.IO
  useBookingSocket();

  // ✅ Enable real-time refund updates via Socket.IO
  useRefundSocket(bookingId, fetchRefunds);

  useEffect(() => {
    if (bookingId) {
      fetchBooking();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]); // Only run when bookingId changes

  function handleReschedule() {
    setRescheduleModalOpen(true);
  }

  function handleBalancePayment() {
    setBalancePaymentModalOpen(true);
  }

  function handleDepositPayment() {
    setDepositPaymentModalOpen(true);
  }

  function handleCancel() {
    setCancelModalOpen(true);
  }

  function handleRebook() {
    setRebookModalOpen(true);
  }

  function handleTipPayment() {
    setTipPaymentModalOpen(true);
  }

  // TODO: Add export to calendar button
  // function handleExportToCalendar() {
  //   if (booking) {
  //     exportBookingToCalendar(booking);
  //     toast.success('Added to calendar');
  //   }
  // }

  function getStatusColor(status: string) {
    switch (status) {
      case 'PENDING':
        return 'bg-warning/10 text-warning border-warning/30';
      case 'CONFIRMED':
        return 'bg-info/10 text-info border-info/30';
      case 'COMPLETED':
        return 'bg-success/10 text-success border-success/30';
      case 'CANCELLED':
      case 'NO_SHOW':
        return 'bg-destructive/10 text-destructive border-destructive/30';
      case 'NO_SHOW':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'CONFIRMED':
        return <CheckCircle className="h-4 w-4" />;
      case 'COMPLETED':
        return <CheckCircle className="h-4 w-4" />;
      case 'CANCELLED_BY_CLIENT':
      case 'CANCELLED_BY_PROVIDER':
        return <X className="h-4 w-4" />;
      case 'NO_SHOW':
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

  // Define which actions are available based on booking status and payment status
  const isActiveBooking = !['COMPLETED', 'CANCELLED_BY_CLIENT', 'CANCELLED_BY_PROVIDER', 'NO_SHOW'].includes(booking.bookingStatus);
  const appointmentDate = new Date(`${booking.appointmentDate}T${booking.appointmentTime}`);
  const now = new Date();
  const isBeforeAppointment = appointmentDate > now;
  const isAfterAppointment = appointmentDate < now;

  // Payment actions
  const canPayDeposit = booking.paymentStatus === 'AWAITING_DEPOSIT' && isActiveBooking;
  const canPayBalance =
    booking.paymentStatus === 'DEPOSIT_PAID' &&
    booking.bookingStatus === 'CONFIRMED' &&
    isAfterAppointment;

  // Booking management actions
  const canReschedule = isActiveBooking && isBeforeAppointment;
  const canCancel = isActiveBooking && isBeforeAppointment;

  // Post-booking actions
  const canRebook =
    booking.bookingStatus === 'CANCELLED_BY_CLIENT' ||
    booking.bookingStatus === 'CANCELLED_BY_PROVIDER' ||
    booking.bookingStatus === 'NO_SHOW';

  const canReview = booking.bookingStatus === 'COMPLETED' && !booking.review;
  const canTip = booking.bookingStatus === 'COMPLETED' && booking.paymentStatus === 'FULLY_PAID' && !booking.tipPaidAt;

  // Report no-show - only after appointment time for confirmed bookings
  const canReportNoShow = booking.bookingStatus === 'CONFIRMED' && isAfterAppointment;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => router.push(`/client/messages?conversation=${booking.providerId}`)}
          >
            <MessageSquare className="h-4 w-4" />
            Message Provider
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Booking Status */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(booking.bookingStatus)}
                  Booking Status
                </CardTitle>
                <Badge className={getStatusColor(booking.bookingStatus)}>
                  {booking.bookingStatus.replace('_', ' ')}
                </Badge>
              </div>
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
                  <p className="font-medium">{booking.provider?.businessName || 'Provider'}</p>
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

                {/* Add-ons would be displayed here if available in the booking data */}

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
              canUpload={['CONFIRMED', 'COMPLETED'].includes(booking.bookingStatus)}
              canDelete={true}
              onUpdate={fetchBooking}
            />
          )}

          {/* Review Display */}
          {booking.review && (
            <BookingReview review={booking.review} />
          )}

          {/* Refund Status */}
          {refunds.length > 0 && (
            <div className="space-y-4">
              {refunds.map((refund: any) => (
                <RefundCard key={refund.id} refund={refund} />
              ))}
            </div>
          )}

          {/* Provider Details */}
          <Card>
            <CardHeader>
              <CardTitle>Provider Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {booking.provider?.businessName || 'Provider'}
                    </h3>
                    <p className="text-sm text-muted-foreground">Professional service</p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-rating-filled text-rating-filled" />
                        <span>{booking.provider?.averageRating ? Number(booking.provider.averageRating).toFixed(1) : '0.0'}</span>
                        <span className="text-muted-foreground">
                          ({booking.provider?.totalReviews || 0} {booking.provider?.totalReviews === 1 ? 'review' : 'reviews'})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Countdown Timers */}
          {booking.paymentStatus === 'AWAITING_DEPOSIT' && booking.bookingStatus !== 'CANCELLED_BY_CLIENT' && (
            <BookingCountdownTimer
              deadline={new Date(new Date(booking.createdAt).getTime() + 24 * 60 * 60 * 1000)}
              type="deposit"
              onExpired={fetchBooking}
            />
          )}

          {booking.bookingStatus === 'PENDING' && booking.paymentStatus === 'DEPOSIT_PAID' && (
            <BookingCountdownTimer
              deadline={new Date(new Date(booking.createdAt).getTime() + 48 * 60 * 60 * 1000)}
              type="confirmation"
              onExpired={fetchBooking}
            />
          )}

          {booking.bookingStatus === 'CONFIRMED' && booking.paymentStatus === 'DEPOSIT_PAID' && new Date(`${booking.appointmentDate}T${booking.appointmentTime}`) < new Date() && (
            <BookingCountdownTimer
              deadline={new Date(new Date(`${booking.appointmentDate}T${booking.appointmentTime}`).getTime() + 24 * 60 * 60 * 1000)}
              type="balance"
              onExpired={fetchBooking}
            />
          )}

          {/* Payment Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    className={`
                      ${
                        booking.paymentStatus === 'FULLY_PAID'
                          ? 'bg-success/10 text-success border-success/30'
                          : booking.paymentStatus === 'DEPOSIT_PAID'
                            ? 'bg-info/10 text-info border-info/30'
                            : booking.paymentStatus === 'AWAITING_DEPOSIT'
                              ? 'bg-warning/10 text-warning border-warning/30'
                              : 'bg-muted text-muted-foreground border-border'
                      }
                    `}>
                    {booking.paymentStatus.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Warning for unpaid deposit - only show for active bookings */}
                {booking.paymentStatus === 'AWAITING_DEPOSIT' && isActiveBooking && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>Payment Required:</strong> Your booking is not confirmed until the deposit of {booking.currency} {booking.depositAmount} is paid.
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
                    <span>Deposit (25%)</span>
                    <span>
                      {formatCurrency(
                        Number(booking.depositAmount) + Number(booking.serviceFee),
                        booking.currency
                      )}
                    </span>
                  </div>

                {/* Display add-ons */}
                {booking.addons && booking.addons.length > 0 && (
                  <>
                    {booking.addons.map((addon) => (
                      <div
                        key={addon.id}
                        className="flex justify-between text-sm text-muted-foreground"
                      >
                        <span>+ {addon.addonName}</span>
                        <span>{formatCurrency(addon.addonPrice, booking.currency)}</span>
                      </div>
                    ))}
                  </>
                )}

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Fee</span>
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
                      <span>Balance Due (at appointment)</span>
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
                      <span>Tip Paid</span>
                      <span className="text-success">
                        {formatCurrency(booking.tipAmount, booking.currency)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {canPayDeposit && (
                <Button onClick={handleDepositPayment} className="w-full gap-2 bg-primary hover:bg-primary/90">
                  <DollarSign className="h-4 w-4" />
                  Pay Deposit ({formatCurrency(
                    Number(booking.depositAmount) + Number(booking.serviceFee),
                    booking.currency
                  )})
                </Button>
              )}

              {canReschedule && (
                <Button onClick={handleReschedule} className="w-full gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reschedule
                </Button>
              )}

              {canPayBalance && (
                <Button onClick={handleBalancePayment} className="w-full gap-2">
                  <CreditCard className="h-4 w-4" />
                  Pay Balance
                </Button>
              )}

              {canCancel && (
                <Button onClick={handleCancel} variant="destructive" className="w-full gap-2">
                  <X className="h-4 w-4" />
                  Cancel Booking
                </Button>
              )}

              {canRebook && (
                <Button onClick={handleRebook} variant="outline" className="w-full gap-2">
                  <Calendar className="h-4 w-4" />
                  Rebook Service
                </Button>
              )}

              {canTip && (
                <Button
                  onClick={handleTipPayment}
                  className="w-full gap-2 bg-accent hover:bg-accent/90"
                >
                  <Star className="h-4 w-4" />
                  Send Tip
                </Button>
              )}

              {canReview && (
                <Button
                  onClick={() => setReviewModalOpen(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Star className="h-4 w-4" />
                  Leave a Review
                </Button>
              )}

              {/* Report Provider No-Show - After appointment time for CONFIRMED bookings */}
              {canReportNoShow && (
                <Button
                  variant="destructive"
                  onClick={() => setReportNoShowModalOpen(true)}
                  className="w-full gap-2"
                >
                  <AlertCircle className="h-4 w-4" />
                  Report Provider No-Show
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Modals */}
      {booking && (
        <>
          <RescheduleModal
            open={rescheduleModalOpen}
            onOpenChange={setRescheduleModalOpen}
            bookingId={booking.id}
            providerId={booking.providerId}
            serviceId={booking.serviceId}
            serviceDuration={booking.service?.durationMinutes || 60}
            onSuccess={fetchBooking}
          />

          <BalancePaymentModal
            open={balancePaymentModalOpen}
            onOpenChange={setBalancePaymentModalOpen}
            booking={booking}
            onSuccess={fetchBooking}
          />

          <DepositPaymentModal
            open={depositPaymentModalOpen}
            onOpenChange={setDepositPaymentModalOpen}
            booking={booking}
            onSuccess={fetchBooking}
          />

          <CancelBookingModal
            open={cancelModalOpen}
            onOpenChange={setCancelModalOpen}
            booking={booking}
            onSuccess={() => router.push('/client/bookings')}
          />

          <RebookServiceModal
            open={rebookModalOpen}
            onOpenChange={setRebookModalOpen}
            booking={booking}
          />

          <TipPaymentModal
            open={tipPaymentModalOpen}
            onOpenChange={setTipPaymentModalOpen}
            bookingId={bookingId}
            currency={booking.currency}
            onSuccess={fetchBooking}
          />

          <ReviewModal
            open={reviewModalOpen}
            onOpenChange={setReviewModalOpen}
            bookingId={bookingId}
            providerName={booking.provider?.businessName || 'Provider'}
            serviceName={booking.service?.title || 'Service'}
            onSuccess={fetchBooking}
          />

          <ReportNoShowModal
            open={reportNoShowModalOpen}
            onOpenChange={setReportNoShowModalOpen}
            booking={booking}
            onSuccess={fetchBooking}
          />
        </>
      )}
    </div>
  );
}
