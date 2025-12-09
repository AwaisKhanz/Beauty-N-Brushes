'use client';

import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, MapPin } from 'lucide-react';
import type { BookingDetails } from '@/shared-types/booking.types';

interface RebookServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingDetails;
}

export function RebookServiceModal({ open, onOpenChange, booking }: RebookServiceModalProps) {
  const router = useRouter();

  function handleRebook() {
    // Navigate to the service page to book again
    const bookingId = booking.service?.id;
    router.push(`/services/${bookingId}`);
    onOpenChange(false);
  }

  function handleProviderProfile() {
    // Navigate to provider's profile
    const providerSlug = booking.provider?.slug || booking.provider?.id;
    router.push(`/providers/${providerSlug}`);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Rebook Service</DialogTitle>
          <DialogDescription>
            Book the same service again or explore other services from this provider
          </DialogDescription>
        </DialogHeader>

        {/* Booking Summary */}
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <h4 className="font-semibold">{booking.service?.title}</h4>
              <p className="text-sm text-muted-foreground">{booking.provider?.businessName}</p>
            </div>

            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  {new Date(booking.appointmentDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>
                  {booking.appointmentTime} - {booking.appointmentEndTime}
                </span>
              </div>

              {booking.provider && (
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>
                    {booking.provider.city}, {booking.provider.state}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Price:</span>
                <span className="font-semibold">
                  {booking.currency} {booking.servicePrice}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button onClick={handleRebook} variant="dark" className="w-full">
            Book This Service Again
          </Button>

          <Button onClick={handleProviderProfile} variant="outline" className="w-full">
            View Provider's Other Services
          </Button>

          <Button variant="ghost" onClick={() => onOpenChange(false)} className="w-full">
            Cancel
          </Button>
        </div>

        {/* Info */}
        <p className="text-xs text-muted-foreground text-center">
          You'll be able to select a new date and time for your appointment
        </p>
      </DialogContent>
    </Dialog>
  );
}
