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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, AlertCircle, Loader2, CheckCircle2, Upload, X, CreditCard, Smartphone, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import Image from 'next/image';
import { extractErrorMessage } from '@/lib/error-utils';
import type { Service } from '@/shared-types/service.types';
import type { TimeSlot } from '@/shared-types/booking.types';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useAuth } from '@/contexts/AuthContext';
import { fetchPlatformFeeConfig } from '@/lib/platform-fee';
import { MobileMoneyForm } from '../payment/MobileMoneyForm';
import { BankTransferForm } from '../payment/BankTransferForm';
import { REGIONS } from '../../../../shared-constants';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface PlatformFeeConfig {
  base: number;
  percentage: number;
  cap: number;
}

interface BookingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: Service;
}

export function BookingModal({ open, onOpenChange, service }: BookingModalProps) {
  const router = useRouter();
  const { user, regionCode } = useAuth(); // Get auto-detected region from context
  const [step, setStep] = useState<'date' | 'time' | 'details' | 'payment_method' | 'payment' | 'success'>(
    'date'
  );
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);

  const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
  const [homeServiceRequested, setHomeServiceRequested] = useState(false);
  const [specialRequests, setSpecialRequests] = useState('');
  const [referencePhotos, setReferencePhotos] = useState<File[]>([]);
  const [referencePhotoUrls, setReferencePhotoUrls] = useState<string[]>([]);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  // Contact Information (Required per requirements Lines 430-432)
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [error, setError] = useState('');
  const [clientSecret, setClientSecret] = useState<string>('');
  
  // Phase 4: Payment method selection
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'mobile_money' | 'bank_transfer'>('card');
  const [bookingId, setBookingId] = useState<string>('');
  
  // Get currency from region
  const currency = regionCode && REGIONS[regionCode as keyof typeof REGIONS] 
    ? REGIONS[regionCode as keyof typeof REGIONS].currency 
    : 'USD';

  
  // Platform fee config from backend
  const [feeConfig, setFeeConfig] = useState<PlatformFeeConfig>({
    base: 1.25,
    percentage: 3.6,
    cap: 8.0,
  });

  console.log(feeConfig);

  // Fetch platform fee config on mount
  useEffect(() => {
    async function loadFeeConfig() {
      const config = await fetchPlatformFeeConfig();
      setFeeConfig(config);
    }

    loadFeeConfig();
  }, []);

  // Initialize contact info from user profile when modal opens
  useEffect(() => {
    if (open && user) {
      setContactEmail(user.email || '');
      setContactPhone(user.phone || '');
    }
  }, [open, user]);

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
        setReferencePhotos([]);
        setReferencePhotoUrls([]);
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
      setAvailableSlots(response.data.slots || []);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load available time slots');
    } finally {
      setLoadingSlots(false);
    }
  }

  // async function handlePhotoUpload(files: FileList | null) {
  //   if (!files || files.length === 0) return;

  //   const fileArray = Array.from(files);
  //   if (referencePhotos.length + fileArray.length > 5) {
  //     setError('Maximum 5 photos allowed');
  //     return;
  //   }

  //   setReferencePhotos([...referencePhotos, ...fileArray]);
  // }

  // Handle time selection - load stylists if salon
  function handleTimeSelect(time: string) {
    setSelectedTime(time);
  }

  // Move to next step after time selection
  // Move to next step after time selection
  function proceedFromTimeStep() {
    setStep('details');
  }

  // Calculate total price (service + add-ons) in USD
  // Backend will convert to client's currency using live exchange rates
  const calculateTotal = () => {
    let total = Number(service.priceMin);
    selectedAddons.forEach((addonId) => {
      const addon = service.addons?.find((a) => a.id === addonId);
      if (addon) total += Number(addon.addonPrice);
    });
    return total;
  };

  // Calculate platform fee (using dynamic config from backend) in USD
  // Backend will convert to client's currency using live exchange rates
  const calculatePlatformFee = () => {
    const total = calculateTotal();
    const calculated = feeConfig.base + (total * feeConfig.percentage) / 100;
    return Math.min(calculated, feeConfig.cap);
  };

  // Calculate deposit amount (always required) in USD
  // Backend will convert to client's currency using live exchange rates
  const calculateDeposit = () => {
    const total = calculateTotal();
    const platformFee = calculatePlatformFee();
    if (service.depositType === 'PERCENTAGE') {
      const percentage = (total * Number(service.depositAmount)) / 100;
      return percentage + platformFee;
    }
    return Number(service.depositAmount) + platformFee;
  };

  // Handle reference photo selection
  async function handlePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    // Limit to 5 photos
    if (referencePhotos.length + files.length > 5) {
      setError('You can upload a maximum of 5 reference photos');
      return;
    }

    try {
      setUploadingPhotos(true);
      setError('');

      // Upload each photo
      const uploadedUrls: string[] = [];
      for (const file of files) {
        const response = await api.upload.file(file, 'reference');
        if (response.success && response.data.file.url) {
          uploadedUrls.push(response.data.file.url);
        }
      }

      setReferencePhotos([...referencePhotos, ...files]);
      setReferencePhotoUrls([...referencePhotoUrls, ...uploadedUrls]);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to upload photos');
    } finally {
      setUploadingPhotos(false);
    }
  }

  // Remove reference photo
  function removePhoto(index: number) {
    setReferencePhotos(referencePhotos.filter((_, i) => i !== index));
    setReferencePhotoUrls(referencePhotoUrls.filter((_, i) => i !== index));
  }

  // Create booking and initialize payment
  async function handleBookingSubmit() {
    try {
      setError('');

      // Validate contact information
      if (!contactEmail || !contactPhone) {
        setError('Email and phone number are required');
        return;
      }

      // Create booking
      const bookingResponse = await api.bookings.create({
        serviceId: service.id,
        appointmentDate: selectedDate!.toISOString().split('T')[0],
        appointmentTime: selectedTime,
        contactEmail,
        contactPhone,
        selectedAddonIds: selectedAddons.length > 0 ? selectedAddons : undefined,
        homeServiceRequested: homeServiceRequested,
        specialRequests: specialRequests || undefined,
        referencePhotoUrls: referencePhotoUrls.length > 0 ? referencePhotoUrls : undefined,
        // ✅ SECURITY: Region is detected SERVER-SIDE via middleware - never send from frontend
        // Salon stylist selection - always default to any available since we removed selection
        assignedTeamMemberId: undefined,
        anyAvailableStylist: service.provider?.isSalon ? true : false,
      });

      const newBookingId = bookingResponse.data.booking.id;
      setBookingId(newBookingId);

      // Phase 4: For Paystack regions, show payment method selection
      const paymentResponse = await api.payment.initializeBookingPayment({
        bookingId: newBookingId,
        paymentType:"deposit"
      });

      if (paymentResponse.data.paymentProvider === 'stripe') {
        setClientSecret(paymentResponse.data.clientSecret || '');
        setStep('payment');
      } else {
        // Paystack - show payment method selection (Phase 4)
        setStep('payment_method');
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
      <DialogContent 
        className="max-w-2xl max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
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
                      onClick={() => handleTimeSelect(slot.startTime)}
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

            <Button className="w-full" disabled={!selectedTime} onClick={proceedFromTimeStep}>
              Continue to Booking Details
            </Button>
          </div>
        )}



        {/* Step 4: Add-ons and Details */}
        {step === 'details' && (
          <div className="space-y-4">
            <Button
              variant="ghost"
              onClick={() => setStep('time')}
              size="sm"
            >
              ← Back to Time Selection
            </Button>

            {/* Contact Information - Required */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h3 className="font-medium mb-3">Contact Information</h3>
              <p className="text-sm text-muted-foreground mb-4">
                We'll use this to send you booking confirmations and updates
              </p>
              <div className="space-y-3">
                <div>
                  <Label htmlFor="contact-email" className="text-sm font-medium">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-email"
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    placeholder="your.email@example.com"
                    required
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="contact-phone" className="text-sm font-medium">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact-phone"
                    type="tel"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    placeholder="+1 (555) 123-4567"
                    required
                    className="mt-1"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Provider will contact you at this number if needed
                  </p>
                </div>
              </div>
            </div>

            <Separator />

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
                            +${addon.addonPrice}
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

            {/* Home Service Option */}
            {service.mobileServiceAvailable && (
              <div className="border rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <Checkbox
                    id="home-service"
                    checked={homeServiceRequested}
                    onCheckedChange={(checked) => setHomeServiceRequested(checked as boolean)}
                  />
                  <label htmlFor="home-service" className="flex-1 cursor-pointer">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Home Service</p>
                        <p className="text-sm text-muted-foreground">
                          Provider will come to your location
                        </p>
                      </div>
                      {service.homeServiceFee && service.homeServiceFee > 0 && (
                        <Badge variant="outline" className="text-sm">
                          +${service.homeServiceFee}
                        </Badge>
                      )}
                    </div>
                  </label>
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

            {/* Reference Photos */}
            <div>
              <Label htmlFor="reference-photos" className="font-medium mb-2 block">
                Reference Photos (Optional)
              </Label>
              <p className="text-sm text-muted-foreground mb-3">
                Upload photos of the look you want (max 5 photos)
              </p>

              {referencePhotos.length > 0 && (
                <div className="grid grid-cols-5 gap-2 mb-3">
                  {referencePhotos.map((photo, index) => (
                    <div
                      key={index}
                      className="relative aspect-square rounded-lg overflow-hidden border"
                    >
                      <Image
                        src={URL.createObjectURL(photo)}
                        alt={`Reference ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        className="absolute top-1 right-1 h-6 w-6"
                        onClick={() => removePhoto(index)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {referencePhotos.length < 5 && (
                <div className="relative">
                  <Input
                    id="reference-photos"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handlePhotoSelect}
                    disabled={uploadingPhotos}
                    className="hidden"
                  />
                  <Label
                    htmlFor="reference-photos"
                    className="flex flex-col items-center justify-center h-24 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/50 transition-colors"
                  >
                    {uploadingPhotos ? (
                      <>
                        <Loader2 className="h-8 w-8 text-muted-foreground animate-spin mb-2" />
                        <span className="text-sm text-muted-foreground">Uploading...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-sm text-muted-foreground">
                          Click to upload reference photos
                        </span>
                        <span className="text-xs text-muted-foreground mt-1">
                          {referencePhotos.length}/5 photos
                        </span>
                      </>
                    )}
                  </Label>
                </div>
              )}
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
                    ${service.priceMin}
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
                            ${addon.addonPrice}
                          </span>
                        </div>
                      ) : null;
                    })}
                    <div className="flex justify-between font-medium">
                      <span>Subtotal:</span>
                      <span>
                        ${calculateTotal().toFixed(2)}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Platform Fee:</span>
                  <span>${calculatePlatformFee().toFixed(2)}</span>
                </div>

                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Total Amount:</span>
                  <span>${(calculateTotal() + calculatePlatformFee()).toFixed(2)}</span>
                </div>

                <Separator />
                <div className="flex justify-between font-semibold text-primary">
                  <span>Deposit Due Now:</span>
                  <span>
                    ${calculateDeposit().toFixed(2)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {service.depositType === 'PERCENTAGE'
                    ? `${service.depositAmount}% of total amount`
                    : 'Flat deposit amount'}
                </p>
              </div>
            </div>

            <Button className="w-full" onClick={handleBookingSubmit}>
              Proceed to Payment
            </Button>
          </div>
        )}

        {/* Step 3.5: Payment Method Selection (Paystack only - Phase 4) */}
        {step === 'payment_method' && (
          <div className="space-y-6">
            <Button variant="ghost" onClick={() => setStep('details')} size="sm">
              ← Back to Details
            </Button>

            <div>
              <h3 className="font-medium mb-4">Select Payment Method</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Choose how you'd like to pay for your booking
              </p>

              <div className="grid gap-3">
                {/* Card Payment - Always available */}
                <button
                  onClick={() => setPaymentMethod('card')}
                  className={`p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                    paymentMethod === 'card'
                      ? 'border-primary bg-primary/10'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-6 w-6 text-foreground" />
                    <div className="text-left">
                      <p className="font-medium text-foreground">Card Payment</p>
                      <p className="text-xs text-muted-foreground">
                        Pay with debit or credit card
                      </p>
                    </div>
                  </div>
                  {paymentMethod === 'card' && (
                    <CheckCircle2 className="h-5 w-5 text-primary" />
                  )}
                </button>

                {/* Mobile Money - Ghana only */}
                {currency === 'GHS' && (
                  <button
                    onClick={() => setPaymentMethod('mobile_money')}
                    className={`p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                      paymentMethod === 'mobile_money'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Smartphone className="h-6 w-6 text-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">Mobile Money</p>
                        <p className="text-xs text-muted-foreground">
                          MTN, Vodafone, AirtelTigo
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'mobile_money' && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </button>
                )}

                {/* Bank Transfer - Nigeria only */}
                {currency === 'NGN' && (
                  <button
                    onClick={() => setPaymentMethod('bank_transfer')}
                    className={`p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                      paymentMethod === 'bank_transfer'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="h-6 w-6 text-foreground" />
                      <div className="text-left">
                        <p className="font-medium text-foreground">Bank Transfer</p>
                        <p className="text-xs text-muted-foreground">
                          Instant bank transfer
                        </p>
                      </div>
                    </div>
                    {paymentMethod === 'bank_transfer' && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <Button
              className="w-full"
              onClick={async () => {
                // For card payment with Paystack, redirect to authorization URL
                if (paymentMethod === 'card') {
                  try {
                    const paymentResponse = await api.payment.initializeBookingPayment({
                      bookingId: bookingId,
                      paymentType:"deposit"

                    });
                    
                    if (paymentResponse.data.authorizationUrl) {
                      window.location.href = paymentResponse.data.authorizationUrl;
                    } else {
                      setError('Failed to initialize payment');
                    }
                  } catch (err: unknown) {
                    setError(extractErrorMessage(err) || 'Failed to initialize payment');
                  }
                } else {
                  // For mobile money and bank transfer, go to payment step
                  setStep('payment');
                }
              }}
            >
              Continue to Payment
            </Button>
          </div>
        )}

        {/* Step 4: Payment */}
        {step === 'payment' && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setStep('payment_method')} size="sm">
              ← Back to Payment Method
            </Button>

            {/* Stripe Card Payment */}
            {paymentMethod === 'card' && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: document.documentElement.classList.contains('dark') ? 'night' : 'stripe',
                    variables: {
                      colorPrimary: '#B06F64',
                      colorBackground: document.documentElement.classList.contains('dark')
                        ? '#1a1a1a'
                        : '#ffffff',
                      colorText: document.documentElement.classList.contains('dark')
                        ? '#ffffff'
                        : '#2A3F4D',
                      colorDanger: '#EF4444',
                      fontFamily: 'system-ui, sans-serif',
                      borderRadius: '8px',
                      spacingUnit: '4px',
                    },
                    rules: {
                      '.Input': {
                        backgroundColor: document.documentElement.classList.contains('dark')
                          ? '#2a2a2a'
                          : '#f8f9fa',
                        border: '1px solid #B06F64',
                        borderRadius: '8px',
                        color: document.documentElement.classList.contains('dark')
                          ? '#ffffff'
                          : '#2A3F4D',
                        fontSize: '16px',
                        padding: '12px',
                      },
                      '.Input:focus': {
                        borderColor: '#B06F64',
                        boxShadow: '0 0 0 2px rgba(176, 111, 100, 0.2)',
                      },

                  '.Label': {
                    color: document.documentElement.classList.contains('dark')
                      ? '#ffffff'
                      : '#2A3F4D',
                    fontSize: '14px',
                    fontWeight: '500',
                  },
                },
              },
            }}
          >
            <PaymentForm
              depositAmount={calculateDeposit()}
              _onSuccess={() => setStep('success')}
              onError={(err) => setError(err)}
            />
          </Elements>
        )}

        {/* Mobile Money Payment (Paystack - Ghana) - Phase 4 */}
        {paymentMethod === 'mobile_money' && currency === 'GHS' && user && (
          <MobileMoneyForm
            amount={calculateDeposit()}
            currency={currency as 'GHS'}
            bookingId={bookingId}
            _onSuccess={() => {
              setStep('success');
            }}
            onError={(error) => {
              setError(error.message);
            }}
          />
        )}

        {/* Bank Transfer Payment (Paystack - Nigeria) - Phase 4 */}
        {paymentMethod === 'bank_transfer' && currency === 'NGN' && user && (
          <BankTransferForm
            amount={calculateDeposit()}
            currency={currency as 'NGN'}
            bookingId={bookingId}
            customerEmail={user.email}
            customerName={`${user.firstName} ${user.lastName}`}
            onSuccess={() => {
              setStep('success');
            }}
            onError={(error) => {
              setError(error.message);
            }}
          />
        )}
      </div>
    )}

    {/* Step 5: Success */}
    {step === 'success' && (

          <div className="text-center py-8 space-y-4">
            <div className="flex justify-center">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle2 className="h-12 w-12 text-success" />
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
  depositAmount,
  _onSuccess,
  onError,
}: {
  depositAmount: number;
  _onSuccess: () => void;
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
        _onSuccess();
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
        <h3 className="font-medium mb-4 text-foreground">Payment Details</h3>
        <div className="border border-primary/20 rounded-lg p-4 bg-gradient-to-br from-primary/5 to-accent/5">
          <PaymentElement />
        </div>
      </div>

      <Separator />

      <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <span className="font-medium">Total Due Now:</span>
          <span className="text-xl font-bold text-primary">
            ${depositAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        type="submit"
        className="w-full bg-button-dark hover:bg-button-dark/90 text-white"
        disabled={!stripe || processing}
      >
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
