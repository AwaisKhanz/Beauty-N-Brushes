'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import type { TimeSlot } from '../../../../shared-types';

interface RequestRescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  providerId: string;
  serviceId: string;
  serviceDuration: number;
  onSuccess: () => void;
}

export function RequestRescheduleModal({
  open,
  onOpenChange,
  bookingId,
  providerId,
  serviceId,
  onSuccess,
}: RequestRescheduleModalProps) {
  const [step, setStep] = useState<'date' | 'time' | 'reason' | 'confirm'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Load available slots when date is selected
  useEffect(() => {
    if (selectedDate) {
      loadAvailableSlots();
    }
  }, [selectedDate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStep('date');
        setSelectedDate(undefined);
        setSelectedTime('');
        setReason('');
        setError('');
      }, 300);
    }
  }, [open]);

  async function loadAvailableSlots() {
    try {
      setLoadingSlots(true);
      setError('');
      const dateStr = selectedDate!.toISOString().split('T')[0];
      const response = await api.bookings.getAvailableSlots(providerId, serviceId, dateStr);
      setAvailableSlots(response.data.slots);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  }

  async function handleRequestReschedule() {
    try {
      setSubmitting(true);
      setError('');

      await api.bookings.requestReschedule(bookingId, {
        newDate: selectedDate!.toISOString().split('T')[0],
        newTime: selectedTime,
        reason: reason,
      });

      toast.success('Reschedule request sent successfully');
      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to send reschedule request');
    } finally {
      setSubmitting(false);
    }
  }

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 30);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Request Reschedule</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select New Date */}
        {step === 'date' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-4">Select a New Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < minDate || date > maxDate}
                className="rounded-md border mx-auto"
              />
            </div>
            <Button className="w-full" disabled={!selectedDate} onClick={() => setStep('time')}>
              Continue to Time Selection
            </Button>
          </div>
        )}

        {/* Step 2: Select New Time */}
        {step === 'time' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('date')}
                className="flex items-center gap-2"
              >
                <CalendarIcon className="h-4 w-4" />
                Change Date
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedDate?.toLocaleDateString()}
              </span>
            </div>

            <div>
              <h3 className="font-medium mb-4">Select a New Time</h3>
              {loadingSlots ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground mt-2">Loading available slots...</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.startTime}
                      variant={selectedTime === slot.startTime ? 'default' : 'outline'}
                      size="sm"
                      disabled={!slot.available}
                      onClick={() => setSelectedTime(slot.startTime)}
                      className="justify-start"
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      {slot.startTime} - {slot.endTime}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            <Button
              className="w-full"
              disabled={!selectedTime || loadingSlots}
              onClick={() => setStep('reason')}
            >
              Continue to Reason
            </Button>
          </div>
        )}

        {/* Step 3: Provide Reason */}
        {step === 'reason' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('time')}
                className="flex items-center gap-2"
              >
                <Clock className="h-4 w-4" />
                Change Time
              </Button>
              <span className="text-sm text-muted-foreground">
                {selectedDate?.toLocaleDateString()} at {selectedTime}
              </span>
            </div>

            <div>
              <h3 className="font-medium mb-4">Why do you need to reschedule?</h3>
              <Textarea
                placeholder="Please provide a reason for rescheduling this appointment..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-[100px]"
                maxLength={500}
              />
              <p className="text-xs text-muted-foreground mt-1">{reason.length}/500 characters</p>
            </div>

            <Button className="w-full" disabled={!reason.trim()} onClick={() => setStep('confirm')}>
              Continue to Confirmation
            </Button>
          </div>
        )}

        {/* Step 4: Confirmation */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setStep('reason')}
                className="flex items-center gap-2"
              >
                Edit Details
              </Button>
            </div>

            <div>
              <h3 className="font-medium mb-4">Confirm Reschedule Request</h3>
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <div className="flex items-center gap-2">
                  <CalendarIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">New Date:</span>
                  <span>{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">New Time:</span>
                  <span>{selectedTime}</span>
                </div>
                <div>
                  <span className="font-medium">Reason:</span>
                  <p className="text-sm text-muted-foreground mt-1">{reason}</p>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This is a request that needs client approval. The client will
                be notified and can approve or deny your request.
              </p>
            </div>

            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setStep('reason')}>
                Back
              </Button>
              <Button className="flex-1" onClick={handleRequestReschedule} disabled={submitting}>
                {submitting ? 'Sending Request...' : 'Send Request'}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
