'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Loader2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { CancelSubscriptionRequest } from '@/shared-types/settings.types';

interface CancelSubscriptionModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (accessUntil: string) => void;
  subscriptionTier: string;
  nextBillingDate: string | null;
}

export function CancelSubscriptionModal({
  open,
  onClose,
  onSuccess,
  subscriptionTier,
  nextBillingDate,
}: CancelSubscriptionModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');

  async function handleCancel() {
    try {
      setLoading(true);
      setError('');

      const data: CancelSubscriptionRequest = {
        reason,
        feedback,
      };

      const response = await api.settings.cancelSubscription(data);
      onSuccess(response.data.accessUntil);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            We&apos;re sorry to see you go. Your subscription will remain active until the end of
            your billing period.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Cancellation Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">What happens when you cancel:</p>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>You'll retain access until {formatDate(nextBillingDate)}</li>
                  <li>No refunds for the current billing period</li>
                  <li>You can reactivate anytime before the period ends</li>
                  <li>Your data will be preserved for 30 days after cancellation</li>
                </ul>
              </div>
            </AlertDescription>
          </Alert>

          {/* Reason (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="reason">Reason for cancelling (optional)</Label>
            <Textarea
              id="reason"
              placeholder="e.g., Found another solution, Too expensive, Not using it enough"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
            />
          </div>

          {/* Feedback (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="feedback">Additional feedback (optional)</Label>
            <Textarea
              id="feedback"
              placeholder="Help us improve by sharing what we could have done better"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
            />
          </div>

          {/* Confirmation Warning */}
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <p className="font-medium">This action cannot be undone easily.</p>
              <p className="text-sm mt-1">
                Your {subscriptionTier} plan will be cancelled and you'll lose access to all premium
                features after {formatDate(nextBillingDate)}.
              </p>
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Keep Subscription
          </Button>
          <Button variant="destructive" onClick={handleCancel} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Confirm Cancellation'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
