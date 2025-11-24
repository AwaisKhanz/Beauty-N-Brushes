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
import { AlertCircle, DollarSign, AlertTriangle } from 'lucide-react';
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

  const calculateCancellationFee = (): number => {
    // Calculate time until appointment
    const appointmentDateTime = new Date(`${booking.appointmentDate}T${booking.appointmentTime}`);
    const now = new Date();
    const hoursUntilAppt = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    // Get cancellation window from provider policy (default 24 hours)
    const cancellationWindowHours = booking.provider?.cancellationWindowHours || 24;

    // If within cancellation window, full deposit forfeited (or policy percentage)
    if (hoursUntilAppt < cancellationWindowHours) {
      const feePercentage = booking.provider?.cancellationFeePercentage || 100;
      return (booking.depositAmount * feePercentage) / 100;
    }

    // If outside window, no fee (full refund)
    return 0;
  };

  const cancellationFee = calculateCancellationFee();
  const refundAmount = booking.depositAmount - cancellationFee;

  const appointmentDateTime = new Date(`${booking.appointmentDate}T${booking.appointmentTime}`);
  const now = new Date();
  const hoursUntilAppt = (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
  const cancellationWindowHours = booking.provider?.cancellationWindowHours || 24;
  const isWithinCancellationWindow = hoursUntilAppt < cancellationWindowHours;

  async function handleCancel() {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
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
          refundAmount > 0
            ? `${booking.currency} ${refundAmount.toFixed(2)} will be refunded to your account`
            : 'Cancellation processed',
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
            </div>
          </div>

          {/* Cancellation Policy */}
          <Alert variant={isWithinCancellationWindow ? 'destructive' : 'default'}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Cancellation Policy</p>
                {isWithinCancellationWindow ? (
                  <>
                    <p className="text-sm">
                      You are cancelling within {cancellationWindowHours} hours of your appointment.
                    </p>
                    {cancellationFee > 0 && (
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <DollarSign className="h-4 w-4" />
                        <div className="text-sm">
                          <p>
                            Cancellation fee:{' '}
                            <span className="font-semibold">
                              {booking.currency} {cancellationFee.toFixed(2)}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Refund amount: {booking.currency} {refundAmount.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <p className="text-sm">
                      Free cancellation - you'll receive a full refund of your deposit.
                    </p>
                    <div className="flex items-center gap-2 pt-2 border-t">
                      <DollarSign className="h-4 w-4" />
                      <p className="text-sm">
                        Refund amount:{' '}
                        <span className="font-semibold">
                          {booking.currency} {refundAmount.toFixed(2)}
                        </span>
                      </p>
                    </div>
                  </>
                )}
              </div>
            </AlertDescription>
          </Alert>

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
          <Button variant="destructive" onClick={handleCancel} disabled={loading || !reason.trim()}>
            {loading ? 'Cancelling...' : 'Cancel Booking'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
