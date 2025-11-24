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
  Phone,
  Mail,
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
import { CancelBookingModal } from '@/components/booking/CancelBookingModal';
import { RebookServiceModal } from '@/components/booking/RebookServiceModal';
import { TipPaymentModal } from '@/components/booking/TipPaymentModal';
import { exportBookingToCalendar } from '@/lib/calendar-export';
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
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [rebookModalOpen, setRebookModalOpen] = useState(false);
  const [tipPaymentModalOpen, setTipPaymentModalOpen] = useState(false);

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

  function handleReschedule() {
    setRescheduleModalOpen(true);
  }

  function handleBalancePayment() {
    setBalancePaymentModalOpen(true);
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

  function handleExportToCalendar() {
    if (booking) {
      exportBookingToCalendar(booking);
      toast.success('Added to calendar');
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled_by_client':
      case 'cancelled_by_provider':
        return 'bg-red-100 text-red-800 border-red-200';
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
        return <X className="h-4 w-4" />;
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

  const canReschedule = ['pending', 'confirmed'].includes(booking.bookingStatus);
  const canCancel = ['pending', 'confirmed'].includes(booking.bookingStatus);
  const canPayBalance =
    booking.bookingStatus === 'confirmed' && booking.totalAmount - booking.depositAmount > 0;
  const canRebook = [
    'completed',
    'cancelled_by_client',
    'cancelled_by_provider',
    'no_show',
  ].includes(booking.bookingStatus);
  const canReview = booking.bookingStatus === 'completed';
  const canTip = booking.bookingStatus === 'completed' && booking.tipAmount === 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Bookings
        </Button>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExportToCalendar} className="gap-2">
            <Calendar className="h-4 w-4" />
            Add to Calendar
          </Button>
          <Button variant="outline" className="gap-2">
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
                    {booking.provider?.addressLine1 &&
                    booking.provider?.city &&
                    booking.provider?.state
                      ? `${booking.provider.addressLine1}, ${booking.provider.city}, ${booking.provider.state}`
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
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>4.5</span>
                        <span className="text-muted-foreground">(0 reviews)</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>
                      {booking.bookingStatus === 'confirmed'
                        ? booking.provider?.businessPhone || 'Not provided'
                        : 'Available after booking confirmation'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>Contact via platform</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                <div className="flex justify-between text-sm">
                  <span>Service Price</span>
                  <span>{formatCurrency(booking.servicePrice, booking.currency)}</span>
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

                {booking.tipAmount > 0 && (
                  <div className="flex justify-between text-sm">
                    <span>Tip</span>
                    <span>{formatCurrency(booking.tipAmount, booking.currency)}</span>
                  </div>
                )}

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Service Fee (Platform)</span>
                  <span>{formatCurrency(booking.serviceFee, booking.currency)}</span>
                </div>

                <div className="border-t pt-3">
                  <div className="flex justify-between font-semibold">
                    <span>Total Service Cost</span>
                    <span>{formatCurrency(booking.servicePrice, booking.currency)}</span>
                  </div>
                </div>

                <div className="border-t pt-3 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Deposit Paid</span>
                    <span className="text-green-600">
                      {formatCurrency(booking.depositAmount, booking.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Service Fee Paid</span>
                    <span className="text-green-600">
                      {formatCurrency(booking.serviceFee, booking.currency)}
                    </span>
                  </div>
                  {booking.servicePrice - booking.depositAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span>Balance Due (at appointment)</span>
                      <span className="text-amber-600">
                        {formatCurrency(
                          booking.servicePrice - booking.depositAmount,
                          booking.currency
                        )}
                      </span>
                    </div>
                  )}
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
                  className="w-full gap-2 bg-pink-500 hover:bg-pink-600"
                >
                  <Star className="h-4 w-4" />
                  Send Tip
                </Button>
              )}

              {canReview && (
                <Button
                  onClick={() => router.push(`/client/bookings/${bookingId}/review`)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <Star className="h-4 w-4" />
                  Write Review
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
        </>
      )}
    </div>
  );
}

