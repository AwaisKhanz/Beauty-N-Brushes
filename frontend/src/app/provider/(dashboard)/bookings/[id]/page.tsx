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
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { BookingDetails } from '@/shared-types/booking.types';
import { toast } from 'sonner';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { AssignTeamMemberModal } from '@/components/booking/AssignTeamMemberModal';

export default function ProviderBookingDetailPage() {
  const params = useParams();
  const router = useRouter();
  const bookingId = params.id as string;

  const [booking, setBooking] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assignTeamMemberModalOpen, setAssignTeamMemberModalOpen] = useState(false);
  const [noShowConfirmOpen, setNoShowConfirmOpen] = useState(false);

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
      await api.bookings.markNoShow(bookingId, 'Client did not arrive for appointment');
      toast.success('Booking marked as no-show');
      fetchBooking();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to mark booking as no-show');
    } finally {
      setNoShowConfirmOpen(false);
    }
  }

  async function handleAssignTeamMember(teamMemberId: string) {
    try {
      await api.bookings.assignTeamMember(bookingId, { teamMemberId });
      toast.success('Team member assigned successfully');
      fetchBooking();
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to assign team member');
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

  const canConfirm = booking.bookingStatus === 'PENDING';
  const canMarkCompleted = booking.bookingStatus === 'CONFIRMED';
  const canMarkNoShow = ['PENDING', 'CONFIRMED'].includes(booking.bookingStatus);

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

          {/* Client Details */}
          <Card>
            <CardHeader>
              <CardTitle>Client Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">
                      {booking.client?.firstName} {booking.client?.lastName}
                    </h3>
                    <p className="text-sm text-muted-foreground">{booking.client?.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.client?.phone || 'Not provided'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    <span>{booking.client?.email}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
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
                    className={
                      booking.paymentStatus === 'FULLY_PAID'
                        ? 'bg-green-100 text-green-800 border-green-200'
                        : booking.paymentStatus === 'DEPOSIT_PAID'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : booking.paymentStatus === 'AWAITING_DEPOSIT'
                            ? 'bg-red-100 text-red-800 border-red-200'
                            : booking.paymentStatus === 'PENDING'
                              ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                              : 'bg-gray-100 text-gray-800 border-gray-200'
                    }
                  >
                    {booking.paymentStatus.replace('_', ' ')}
                  </Badge>
                </div>

                {/* Warning for unpaid deposit */}
                {booking.paymentStatus === 'AWAITING_DEPOSIT' && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      Client has not paid the deposit of {booking.currency} {booking.depositAmount} yet.
                      Booking cannot be confirmed until payment is received.
                    </AlertDescription>
                  </Alert>
                )}

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
                    <span className="text-green-600">
                      {formatCurrency(booking.depositAmount, booking.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm pl-4">
                    <span>Platform Fee</span>
                    <span className="text-green-600">
                      {formatCurrency(booking.serviceFee, booking.currency)}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm font-medium pl-4 border-t pt-2">
                    <span>Total Paid</span>
                    <span className="text-green-600">
                      {formatCurrency(Number(booking.depositAmount) + Number(booking.serviceFee), booking.currency)}
                    </span>
                  </div>
                </div>

                {/* Balance Due Section */}
                {booking.paymentStatus !== 'FULLY_PAID' && booking.servicePrice - booking.depositAmount > 0 && (
                  <div className="border-t pt-3">
                    <div className="flex justify-between text-sm font-medium">
                      <span>Balance Due (from client)</span>
                      <span className="text-amber-600">
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
                      <span className="text-green-600">
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

              {/* Team Member Assignment for Salon Bookings */}
              {booking?.provider?.isSalon && !booking.assignedTeamMember && (
                <Button
                  onClick={() => setAssignTeamMemberModalOpen(true)}
                  variant="outline"
                  className="w-full gap-2"
                >
                  <User className="h-4 w-4" />
                  Assign Team Member
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Team Member Assignment Modal */}
      {booking && (
        <AssignTeamMemberModal
          open={assignTeamMemberModalOpen}
          onOpenChange={setAssignTeamMemberModalOpen}
          bookingId={bookingId}
          onSuccess={handleAssignTeamMember}
        />
      )}

      <ConfirmationDialog
        open={noShowConfirmOpen}
        onOpenChange={setNoShowConfirmOpen}
        title="Mark as No-Show"
        description="Mark this booking as no-show? This action cannot be undone."
        confirmText="Mark No-Show"
        cancelText="Cancel"
        onConfirm={handleMarkNoShowConfirm}
        variant="destructive"
      />
    </div>
  );
}
