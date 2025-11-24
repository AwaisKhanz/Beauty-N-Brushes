'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';

interface RescheduleRequest {
  id: string;
  bookingId: string;
  newDate: string;
  newTime: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  requestedAt: string;
  respondedAt: string | null;
}

interface RescheduleRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: RescheduleRequest;
  onSuccess: () => void;
}

export function RescheduleRequestModal({
  open,
  onOpenChange,
  request,
  onSuccess,
}: RescheduleRequestModalProps) {
  const [responseReason, setResponseReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleResponse(approved: boolean) {
    try {
      setSubmitting(true);
      setError('');

      await api.bookings.respondToRescheduleRequest(request.id, {
        approved,
        reason: responseReason || undefined,
      });

      toast.success(
        approved ? 'Reschedule request approved' : 'Reschedule request denied'
      );
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to respond to request');
    } finally {
      setSubmitting(false);
    }
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (timeStr: string) => {
    const [hours, minutes] = timeStr.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Reschedule Request</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {/* Request Details */}
          <div className="bg-muted p-4 rounded-lg space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">New Date:</span>
              <span>{formatDate(request.newDate)}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">New Time:</span>
              <span>{formatTime(request.newTime)}</span>
            </div>
            <div>
              <span className="font-medium">Reason:</span>
              <p className="text-sm text-muted-foreground mt-1">{request.reason}</p>
            </div>
            <div className="text-xs text-muted-foreground">
              Requested on {new Date(request.requestedAt).toLocaleString()}
            </div>
          </div>

          {/* Response Reason */}
          <div>
            <Label htmlFor="response-reason">
              {request.status === 'pending' ? 'Response (optional)' : 'Your Response'}
            </Label>
            <Textarea
              id="response-reason"
              placeholder={
                request.status === 'pending'
                  ? 'Add a message to the provider...'
                  : 'Your response to this request...'
              }
              value={responseReason}
              onChange={(e) => setResponseReason(e.target.value)}
              className="mt-1"
              maxLength={500}
              disabled={request.status !== 'pending'}
            />
            <p className="text-xs text-muted-foreground mt-1">
              {responseReason.length}/500 characters
            </p>
          </div>

          {/* Status Display */}
          {request.status !== 'pending' && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-muted">
              {request.status === 'approved' ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <span className="font-medium">
                {request.status === 'approved' ? 'Approved' : 'Denied'}
              </span>
              {request.respondedAt && (
                <span className="text-sm text-muted-foreground ml-auto">
                  {new Date(request.respondedAt).toLocaleString()}
                </span>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {request.status === 'pending' && (
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => handleResponse(false)}
                disabled={submitting}
              >
                <XCircle className="h-4 w-4 mr-2" />
                Deny
              </Button>
              <Button
                className="flex-1"
                onClick={() => handleResponse(true)}
                disabled={submitting}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Approve
              </Button>
            </div>
          )}

          {request.status !== 'pending' && (
            <Button
              variant="outline"
              className="w-full"
              onClick={() => onOpenChange(false)}
            >
              Close
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
