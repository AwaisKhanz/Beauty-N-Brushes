'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { BookingDetails } from '@/shared-types/booking.types';
import { toast } from 'sonner';

interface CancelBookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetails;
  onSuccess: () => void;
}

export function CancelBookingModal({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: CancelBookingModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [confirmed, setConfirmed] = useState(false);

  // ✅ Calculate refund based on booking STATUS (not time)
  const calculateRefund = () => {
    const depositAmount = Number(booking.depositAmount) || 0;
    const serviceFee = Number(booking.serviceFee) || 0;
    const totalPaidAtBooking = depositAmount + serviceFee; // What client actually paid
    const totalAmount = Number(booking.totalAmount) || 0;

    // Check if any payment was made
    const hasDepositPaid = booking.paymentStatus === 'DEPOSIT_PAID' || booking.paymentStatus === 'FULLY_PAID';
    
    // If no payment made, no refund
    if (!hasDepositPaid) {
      return {
        refundAmount: 0, 
        willRefund: false,
        amountPaid: 0,
      };
    }

    // PENDING booking: Full refund of whatever was paid (deposit + platform fee)
    if (booking.bookingStatus === 'PENDING') {
      return {
        refundAmount: totalPaidAtBooking,
        willRefund: true,
        amountPaid: totalPaidAtBooking,
      };
    }

    // CONFIRMED booking: No refund (deposit + platform fee forfeited)
    if (booking.bookingStatus === 'CONFIRMED') {
      return {
        refundAmount: 0,
        willRefund: false,
        amountPaid: totalPaidAtBooking,
      };
    }

    // COMPLETED booking with full payment: Refund balance only
    if (booking.bookingStatus === 'COMPLETED' && booking.paymentStatus === 'FULLY_PAID') {
      return {
        refundAmount: totalAmount - totalPaidAtBooking,
        willRefund: false,
        amountPaid: totalAmount,
      };
    }

    // Default: no refund
    return {
      refundAmount: 0,
      willRefund: false,
      amountPaid: totalPaidAtBooking,
    };
  };
  const { refundAmount, willRefund, amountPaid } = calculateRefund();
  const isPending = booking.bookingStatus === 'PENDING';
  const isConfirmed = booking.bookingStatus === 'CONFIRMED';

  async function handleCancel() {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    // Require confirmation checkbox for confirmed bookings
    if (isConfirmed && !confirmed) {
      setError('Please confirm that you understand your deposit will be forfeited');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.bookings.cancel(booking.id, {
        reason: reason.trim(),
      });

      toast.success('Booking cancelled', {
        description:
          willRefund
            ? `${booking.currency} ${Number(refundAmount).toFixed(2)} will be refunded within 5-10 business days`
            : 'Your deposit has been forfeited as per cancellation policy',
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to cancel booking');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Cancel Booking</DialogTitle>
          <DialogDescription>Are you sure you want to cancel this appointment?</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Details */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">{booking.service?.title}</span>
              </div>
              <div className="text-muted-foreground">{booking.provider?.businessName}</div>
              <div className="text-muted-foreground">
                {new Date(booking.appointmentDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}{' '}
                at {booking.appointmentTime}
              </div>
              <div className="pt-2 border-t">
                <span className="text-xs text-muted-foreground">Status: </span>
                <span className={`text-xs font-medium ${isPending ? 'text-warning' : 'text-success'}`}>
                  {isPending ? 'Pending Confirmation' : 'Confirmed'}
                </span>
              </div>
            </div>
          </div>

          {/* Refund Policy - PENDING Booking with Payment */}
          {isPending && willRefund && (
            <Alert className="border-success/30 bg-success/10">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium text-success">Full Refund Available</p>
                  <p className="text-sm text-success/90">
                    Since your booking hasn't been confirmed yet, you'll receive a full refund.
                  </p>
                  <div className="flex items-center gap-2 bg-warning/10 p-3 rounded-lg border border-warning/30">
                    <DollarSign className="h-4 w-4 text-warning" />
                    <p className="text-sm font-semibold text-warning">
                      Refund amount: {booking.currency} {Number(refundAmount).toFixed(2)}
                    </p>
                  </div>
                  <p className="text-xs text-success/80">
                    Refund will be processed within 5-10 business days
                  </p>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* No Payment Made Yet */}
          {isPending && !willRefund && (
            <Alert className="border-info/30 bg-info/10">
              <CheckCircle2 className="h-4 w-4 text-info" />
              <AlertDescription className="text-info">
                <p className="font-medium">No Payment Required</p>
                <p className="text-sm mt-1">
                  You can cancel this booking at no cost since the deposit hasn't been paid yet.
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Refund Policy - CONFIRMED Booking */}
          {isConfirmed && (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-medium">No Refund - Deposit Forfeited</p>
                  <p className="text-sm">
                    Your booking has been confirmed by the provider. Cancelling now means your deposit will be
                    forfeited.
                  </p>
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <DollarSign className="h-4 w-4" />
                    <div className="text-sm">
                      <p>
                        Amount paid:{' '}
                        <span className="font-semibold">
                          {booking.currency} {Number(amountPaid).toFixed(2)}
                        </span>
                      </p>
                      <p className="text-muted-foreground">Refund amount: {booking.currency} 0.00</p>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Provider's Cancellation Policy Text */}
          {booking.provider?.cancellationPolicy && (
            <div className="p-3 text-xs text-muted-foreground border rounded bg-muted/30">
              <p className="font-medium mb-1">Provider's Policy:</p>
              <p>{booking.provider.cancellationPolicy}</p>
            </div>
          )}

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancellation *</Label>
            <Textarea
              id="reason"
              placeholder="Please let the provider know why you're cancelling..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Confirmation Checkbox for Confirmed Bookings */}
          {isConfirmed && (
            <div className="flex items-start space-x-2 p-3 border rounded bg-muted/30">
              <Checkbox id="confirm" checked={confirmed} onCheckedChange={(checked) => setConfirmed(checked === true)} />
              <label
                htmlFor="confirm"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                I understand that my payment of {booking.currency} {Number(amountPaid).toFixed(2)} will be forfeited
                and I will not receive a refund
              </label>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Keep Booking
          </Button>
          <Button
            variant="destructive"
            onClick={handleCancel}
            disabled={loading || !reason.trim() || (isConfirmed && !confirmed)}
          >
            {loading ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
