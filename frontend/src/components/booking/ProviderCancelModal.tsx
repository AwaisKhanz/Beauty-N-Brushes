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

interface ProviderCancelModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetails;
  onSuccess: () => void;
}

export function ProviderCancelModal({
  open,
  onOpenChange,
  booking,
  onSuccess,
}: ProviderCancelModalProps) {
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Provider cancellation = ALWAYS full refund to client
  const refundAmount = Number(booking.depositAmount) + Number(booking.serviceFee);

  async function handleCancel() {
    if (!reason.trim()) {
      setError('Please provide a reason for cancellation');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.bookings.cancelByProvider(booking.id, {
        reason: reason.trim(),
      });

      toast.success('Booking cancelled', {
        description: `Client will receive a full refund of ${booking.currency} ${refundAmount.toFixed(2)}`,
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
          <DialogDescription>
            Are you sure you want to cancel this appointment? The client will receive a full refund.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Booking Details */}
          <div className="p-4 border rounded-lg bg-muted/50">
            <div className="space-y-2 text-sm">
              <div>
                <span className="font-medium">{booking.service?.title}</span>
              </div>
              <div className="text-muted-foreground">
                Client: {booking.client?.firstName} {booking.client?.lastName}
              </div>
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

          {/* Refund Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">Client Will Receive Full Refund</p>
                <p className="text-sm">
                  When you cancel a booking, the client will automatically receive a full refund of their deposit and
                  platform fee.
                </p>
                <div className="flex items-center gap-2 pt-2 border-t">
                  <DollarSign className="h-4 w-4" />
                  <div className="text-sm">
                    <p>
                      Refund amount:{' '}
                      <span className="font-semibold">
                        {booking.currency} {Number(refundAmount).toFixed(2)}
                      </span>
                    </p>
                    <p className="text-muted-foreground text-xs">Processed within 5-10 business days</p>
                  </div>
                </div>
              </div>
            </AlertDescription>
          </Alert>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason for cancellation <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Please explain why you need to cancel this booking..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">This reason will be shared with the client.</p>
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
            {loading ? 'Cancelling...' : 'Cancel Booking & Refund Client'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
