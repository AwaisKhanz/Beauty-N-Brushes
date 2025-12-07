'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import type { BookingDetails } from '@/shared-types/booking.types';

interface ReportNoShowModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetails;
  onSuccess: () => void;
}

export function ReportNoShowModal({ open, onOpenChange, booking, onSuccess }: ReportNoShowModalProps) {
  const [reason, setReason] = useState('');
  const [evidence, setEvidence] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Calculate refund amount
  const refundAmount =
    booking.paymentStatus === 'FULLY_PAID' ? booking.servicePrice : booking.depositAmount;

  async function handleSubmit() {
    if (!reason.trim()) {
      setError('Please provide a reason for reporting no-show');
      return;
    }

    try {
      setLoading(true);
      setError('');

      await api.bookings.reportProviderNoShow(booking.id, {
        reason: reason.trim(),
        evidence: evidence.trim() || undefined,
      });

      toast.success('No-show reported successfully', {
        description: `Full refund of ${booking.currency} ${Number(refundAmount).toFixed(2)} will be processed within 5-10 business days`,
      });

      onOpenChange(false);
      onSuccess();
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to report no-show');
    } finally {
      setLoading(false);
    }
  }

  function handleClose() {
    if (!loading) {
      setReason('');
      setEvidence('');
      setError('');
      onOpenChange(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Report Provider No-Show</DialogTitle>
          <DialogDescription>
            Report that the provider didn't show up for your appointment
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Refund Information */}
          <Alert className="border-green-200 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-900">
              <strong>Full Refund:</strong> You will receive a complete refund of{' '}
              <span className="font-semibold">
                {booking.currency} {Number(refundAmount).toFixed(2)}
              </span>{' '}
              within 5-10 business days.
            </AlertDescription>
          </Alert>

          <p className="text-sm text-muted-foreground">
            This includes your deposit of {booking.currency} {Number(booking.depositAmount).toFixed(2)} plus any
            balance paid.
          </p>

          {/* Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> False reports may result in account suspension. Only report
              no-show if the provider genuinely didn't show up for your appointment.
            </AlertDescription>
          </Alert>

          {/* Reason Field */}
          <div className="space-y-2">
            <Label htmlFor="reason">
              Reason <span className="text-destructive">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder="Please describe what happened (e.g., 'Provider didn't show up and didn't respond to my messages')"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              disabled={loading}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              This will be shared with the provider and reviewed by our team
            </p>
          </div>

          {/* Evidence Field (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="evidence">Evidence (Optional)</Label>
            <Textarea
              id="evidence"
              placeholder="Any additional evidence (e.g., screenshots of messages, photos, etc.)"
              value={evidence}
              onChange={(e) => setEvidence(e.target.value)}
              rows={3}
              disabled={loading}
              className="resize-none"
            />
            <p className="text-sm text-muted-foreground">
              Providing evidence helps us process your report faster
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={loading || !reason.trim()}>
            {loading ? 'Reporting...' : 'Report No-Show & Get Refund'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
