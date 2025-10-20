'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { Service } from '@/shared-types/service.types';
import type { TimeSlot } from '@/shared-types/booking.types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
}

export function BookingModal({ open, onOpenChange, service }: BookingModalProps) {
  const router = useRouter();
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'payment' | 'success'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [specialRequests, setSpecialRequests] = useState('');
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string>('');

  // Load available slots when date is selected
  useEffect(() => {
    if (selectedDate && service.provider) {
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
        setSelectedAddons([]);
        setSpecialRequests('');
        setError('');
        setClientSecret('');
      }, 300);
    }
  }, [open]);

  async function loadAvailableSlots() {
    try {
      setLoadingSlots(true);
      setError('');
      const dateStr = selectedDate!.toISOString().split('T')[0];
      const response = await api.bookings.getAvailableSlots(
        service.provider!.id,
        service.id,
        dateStr
      );
      setAvailableSlots(response.data.slots);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load available slots');
    } finally {
      setLoadingSlots(false);
    }
  }

  // Calculate total price (service + add-ons)
  const calculateTotal = () => {
    let total = service.priceMin;
    selectedAddons.forEach((addonId) => {
      const addon = service.addons?.find((a) => a.id === addonId);
      if (addon) total += addon.addonPrice;
    });
    return total;
  };

  // Calculate deposit amount
  const calculateDeposit = () => {
    if (!service.depositRequired) return 0;
    const total = calculateTotal();
    if (service.depositType === 'PERCENTAGE') {
      return (total * service.depositAmount) / 100;
    }
    return service.depositAmount;
  };

  // Create booking and initialize payment
  async function handleBookingSubmit() {
    try {
      setError('');

      // Create booking
      const bookingResponse = await api.bookings.create({
        serviceId: service.id,
        appointmentDate: selectedDate!.toISOString().split('T')[0],
        appointmentTime: selectedTime,
        selectedAddonIds: selectedAddons.length > 0 ? selectedAddons : undefined,
        specialRequests: specialRequests || undefined,
      });

      const newBookingId = bookingResponse.data.booking.id;

      // If deposit required, initialize payment
      if (service.depositRequired) {
        const paymentResponse = await api.payment.initializeBookingPayment({
          bookingId: newBookingId,
        });

        if (paymentResponse.data.paymentProvider === 'stripe') {
          setClientSecret(paymentResponse.data.clientSecret || '');
          setStep('payment');
        } else {
          // Paystack - redirect to authorization URL
          window.location.href = paymentResponse.data.authorizationUrl || '';
        }
      } else {
        // No payment required
        setStep('success');
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to create booking');
    }
  }

  // Get minimum and maximum bookable dates
  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + (service.provider?.advanceBookingDays || 30));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Book {service.title}</DialogTitle>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Step 1: Select Date */}
        {step === 'date' && (
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-4">Select a Date</h3>
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                disabled={(date) => date < minDate || date > maxDate}
                className="rounded-md border mx-auto"
              />
              <p className="text-sm text-muted-foreground mt-3 text-center">
                You can book up to {service.provider?.advanceBookingDays || 30} days in advance
              </p>
            </div>
            <Button className="w-full" disabled={!selectedDate} onClick={() => setStep('time')}>
              Continue to Time Selection
            </Button>
          </div>
        )}

        {/* Step 2: Select Time */}
        {step === 'time' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setStep('date')} size="sm">
              ← Back to Date Selection
            </Button>

            <div>
              <h3 className="font-medium mb-2">
                Select a Time - {selectedDate?.toLocaleDateString()}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Duration: {service.durationMinutes} minutes
              </p>

              {loadingSlots ? (
                <div className="space-y-2">
                  <Skeleton className="h-10 w-full" />
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

            <Button className="w-full" disabled={!selectedTime} onClick={() => setStep('details')}>
              Continue to Booking Details
            </Button>
          </div>
        )}

        {/* Step 3: Add-ons and Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setStep('time')} size="sm">
              ← Back to Time Selection
            </Button>

            {/* Add-ons */}
            {service.addons && service.addons.length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Add-ons (Optional)</h3>
                <div className="space-y-2">
                  {service.addons.map((addon) => (
                    <div
                      key={addon.id}
                      className="flex items-start space-x-3 p-3 border rounded-lg hover:border-primary/50 transition-colors"
                    >
                      <Checkbox
                        id={addon.id}
                        checked={selectedAddons.includes(addon.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setSelectedAddons([...selectedAddons, addon.id]);
                          } else {
                            setSelectedAddons(selectedAddons.filter((id) => id !== addon.id));
                          }
                        }}
                      />
                      <label htmlFor={addon.id} className="flex-1 cursor-pointer">
                        <p className="font-medium">{addon.addonName}</p>
                        {addon.addonDescription && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {addon.addonDescription}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            +{service.currency} {addon.addonPrice}
                          </Badge>
                          {addon.addonDurationMinutes > 0 && (
                            <Badge variant="outline" className="text-xs">
                              <Clock className="h-3 w-3 mr-1" />+{addon.addonDurationMinutes} min
                            </Badge>
                          )}
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Special Requests */}
            <div>
              <h3 className="font-medium mb-2">Special Requests (Optional)</h3>
              <Textarea
                placeholder="Any special requests or notes for the provider..."
                value={specialRequests}
                onChange={(e) => setSpecialRequests(e.target.value)}
                rows={4}
                maxLength={1000}
              />
              <p className="text-xs text-muted-foreground mt-1">
                {specialRequests.length}/1000 characters
              </p>
            </div>

            <Separator />

            {/* Booking Summary */}
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
              <h3 className="font-semibold mb-3">Booking Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-medium">
                    {selectedDate?.toLocaleDateString()} at {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span>{service.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Duration:</span>
                  <span>{service.durationMinutes} minutes</span>
                </div>

                <Separator />

                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service Price:</span>
                  <span>
                    {service.currency} {service.priceMin}
                  </span>
                </div>

                {selectedAddons.length > 0 && (
                  <>
                    {selectedAddons.map((addonId) => {
                      const addon = service.addons?.find((a) => a.id === addonId);
                      return addon ? (
                        <div key={addon.id} className="flex justify-between text-sm">
                          <span className="text-muted-foreground">+ {addon.addonName}:</span>
                          <span>
                            {service.currency} {addon.addonPrice}
                          </span>
                        </div>
                      ) : null;
                    })}
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>
                        {service.currency} {calculateTotal()}
                      </span>
                    </div>
                  </>
                )}

                {service.depositRequired && (
                  <>
                    <Separator />
                    <div className="flex justify-between font-semibold text-primary">
                      <span>Deposit Due Now:</span>
                      <span>
                        {service.currency} {calculateDeposit().toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {service.depositType === 'PERCENTAGE'
                        ? `${service.depositAmount}% of total price`
                        : 'Flat deposit amount'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <Button className="w-full" onClick={handleBookingSubmit}>
              {service.depositRequired ? 'Proceed to Payment' : 'Confirm Booking'}
            </Button>
          </div>
        )}

        {/* Step 4: Payment (Stripe only - Paystack redirects) */}
        {step === 'payment' && clientSecret && (
          <Elements stripe={stripePromise} options={{ clientSecret }}>
            <PaymentForm
              service={service}
              onSuccess={() => setStep('success')}
              onError={(err) => setError(err)}
            />
          </Elements>
        )}

        {/* Step 5: Success */}
        {step === 'success' && (
          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-green-100 p-3">
                <CheckCircle2 className="h-12 w-12 text-green-600" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-semibold mb-2">Booking Confirmed!</h3>
              <p className="text-muted-foreground">
                Your appointment has been{' '}
                {service.provider?.instantBookingEnabled ? 'confirmed' : 'requested'}.
              </p>
              {!service.provider?.instantBookingEnabled && (
                <p className="text-sm text-muted-foreground mt-2">
                  The provider will review and confirm your booking shortly.
                </p>
              )}
            </div>

            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Service:</span>
                  <span className="font-medium">{service.title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date & Time:</span>
                  <span className="font-medium">
                    {selectedDate?.toLocaleDateString()} at {selectedTime}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Provider:</span>
                  <span className="font-medium">{service.provider?.businessName}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button className="flex-1" onClick={() => router.push('/client/bookings')}>
                View Booking
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// Payment Form Component (Stripe)
function PaymentForm({
  service,
  onSuccess,
  onError,
}: {
  service: Service;
  onSuccess: () => void;
  onError: (error: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    try {
      setProcessing(true);
      onError('');

      const { error } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/bookings/confirm`,
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
      } else {
        onSuccess();
      }
    } catch (err: unknown) {
      onError(extractErrorMessage(err) || 'Payment failed');
    } finally {
      setProcessing(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <h3 className="font-medium mb-4">Payment Details</h3>
        <PaymentElement />
      </div>

      <Separator />

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Due Now:</span>
          <span className="text-xl font-bold text-primary">
            {service.currency} {service.depositRequired ? service.depositAmount : service.priceMin}
          </span>
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={!stripe || processing}>
        {processing ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        Your payment is secure and encrypted. We use Stripe for payment processing.
      </p>
    </form>
  );
}
