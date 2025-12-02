'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { User, AlertCircle, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { AvailableStylist } from '@/shared-types/booking.types';

interface AssignTeamMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  onSuccess: (teamMemberId: string) => void;
}

export function AssignTeamMemberModal({
  open,
  onOpenChange,
  bookingId,
  onSuccess,
}: AssignTeamMemberModalProps) {
  const [availableStylists, setAvailableStylists] = useState<AvailableStylist[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedStylist, setSelectedStylist] = useState<string>('');
  const [error, setError] = useState('');

  // Load available stylists when modal opens
  useEffect(() => {
    if (open) {
      loadAvailableStylists();
    }
  }, [open, bookingId]);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setSelectedStylist('');
        setError('');
      }, 300);
    }
  }, [open]);

  async function loadAvailableStylists() {
    try {
      setLoading(true);
      setError('');

      // First get the booking details to extract the required parameters
      const bookingResponse = await api.bookings.getById(bookingId);
      const booking = bookingResponse.data.booking;

      if (!booking.provider || !booking.service) {
        throw new Error('Booking data is incomplete');
      }

      // Call the available stylists API with the booking details
      const response = await api.bookings.getAvailableStylists({
        providerId: booking.provider.id,
        date: booking.appointmentDate,
        time: booking.appointmentTime,
        duration: booking.service.durationMinutes || 60,
      });

      setAvailableStylists(response.data.stylists);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load available stylists');
    } finally {
      setLoading(false);
    }
  }

  async function handleAssign() {
    if (!selectedStylist) {
      setError('Please select a team member');
      return;
    }

    try {
      setSubmitting(true);
      setError('');
      onSuccess(selectedStylist);
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to assign team member');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Assign Team Member
          </DialogTitle>
          <DialogDescription>Select a team member to assign to this booking.</DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          {loading ? (
            <div className="space-y-3">
              <Skeleton className="h-4 w-32" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </div>
          ) : availableStylists.length > 0 ? (
            <div className="space-y-3">
              <Label>Available Team Members</Label>
              <RadioGroup
                value={selectedStylist}
                onValueChange={setSelectedStylist}
                className="space-y-3"
              >
                {availableStylists.map((stylist) => (
                  <div
                    key={stylist.id}
                    className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <RadioGroupItem value={stylist.id} id={stylist.id} />
                    <Label htmlFor={stylist.id} className="flex-1 cursor-pointer">
                      <div className="flex items-center gap-3">
                        {stylist.avatarUrl ? (
                          <Image
                            src={stylist.avatarUrl}
                            alt={stylist.displayName}
                            width={40}
                            height={40}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                            <User className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium">{stylist.displayName}</p>
                          {stylist.specializations && stylist.specializations.length > 0 && (
                            <p className="text-sm text-muted-foreground">
                              {stylist.specializations.join(', ')}
                            </p>
                          )}
                        </div>
                      </div>
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No available team members</p>
              <p className="text-sm mt-1">All team members are busy during this time slot</p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedStylist || submitting || availableStylists.length === 0}
          >
            {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Assign Team Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
