'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { TimeSlot } from '@/shared-types/booking.types';

interface RescheduleModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  providerId: string;
  serviceId: string;
  serviceDuration: number;
  onSuccess: () => void;
}

export function RescheduleModal({
  open,
  onOpenChange,
  bookingId,
  providerId,
  serviceId,
  serviceDuration,
  onSuccess,
}: RescheduleModalProps) {
  const [step, setStep] = useState<'date' | 'time' | 'confirm'>('date');
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

  async function handleReschedule() {
    try {
      setSubmitting(true);
      setError('');

      await api.bookings.reschedule(bookingId, {
        newDate: selectedDate!.toISOString().split('T')[0],
        newTime: selectedTime,
        reason: reason || undefined,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to reschedule booking');
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
          <DialogTitle>Reschedule Booking</DialogTitle>
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
            <Button variant="ghost" onClick={() => setStep('date')} size="sm">
              ← Back to Date Selection
            </Button>

            <div>
              <h3 className="font-medium mb-2">
                Select a New Time - {selectedDate?.toLocaleDateString()}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Duration: {serviceDuration} minutes
              </p>

              {loadingSlots ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ) : availableSlots.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-64 overflow-y-auto">
                  {availableSlots.map((slot) => (
                    <Button
                      key={slot.startTime}
                      variant={selectedTime === slot.startTime ? 'default' : 'outline'}
                      onClick={() => setSelectedTime(slot.startTime)}
                      className="w-full"
                      size="sm"
                    >
                      {slot.startTime}
                    </Button>
                  ))}
                </div>
              ) : (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    No available slots for this date. Please select a different date.
                  </AlertDescription>
                </Alert>
              )}
            </div>

            <Button className="w-full" disabled={!selectedTime} onClick={() => setStep('confirm')}>
              Continue to Confirm
            </Button>
          </div>
        )}

        {/* Step 3: Confirm Reschedule */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setStep('time')} size="sm">
              ← Back to Time Selection
            </Button>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <h3 className="font-semibold mb-3">New Appointment Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Date:</span>
                  <span className="font-medium">{selectedDate?.toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">New Time:</span>
                  <span className="font-medium">{selectedTime}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2">Reason for Rescheduling (Optional)</h3>
              <Textarea
                placeholder="Let the provider know why you're rescheduling..."
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                maxLength={500}
              />
            </div>

            <Button className="w-full" onClick={handleReschedule} disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Rescheduling...
                </>
              ) : (
                'Confirm Reschedule'
              )}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
