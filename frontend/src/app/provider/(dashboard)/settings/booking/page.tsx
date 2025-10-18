'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { UpdateBookingSettingsRequest } from '@/shared-types/settings.types';

const bookingSchema = z.object({
  instantBookingEnabled: z.boolean(),
  acceptsNewClients: z.boolean(),
  mobileServiceAvailable: z.boolean(),
  advanceBookingDays: z.coerce.number().int().min(1).max(365),
  minAdvanceHours: z.coerce.number().int().min(0).max(168),
  bookingBufferMinutes: z.coerce.number().int().min(0).max(120),
  sameDayBookingEnabled: z.boolean(),
  parkingAvailable: z.boolean().nullable(),
  wheelchairAccessible: z.boolean().nullable(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

export default function BookingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      instantBookingEnabled: false,
      acceptsNewClients: true,
      mobileServiceAvailable: false,
      advanceBookingDays: 30,
      minAdvanceHours: 24,
      bookingBufferMinutes: 0,
      sameDayBookingEnabled: false,
      parkingAvailable: null,
      wheelchairAccessible: null,
    },
  });

  useEffect(() => {
    fetchBookingSettings();
  }, []);

  async function fetchBookingSettings() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getBooking();
      const profile = response.data.profile;

      form.reset({
        instantBookingEnabled: profile.instantBookingEnabled,
        acceptsNewClients: profile.acceptsNewClients,
        mobileServiceAvailable: profile.mobileServiceAvailable,
        advanceBookingDays: profile.advanceBookingDays,
        minAdvanceHours: profile.minAdvanceHours,
        bookingBufferMinutes: profile.bookingBufferMinutes,
        sameDayBookingEnabled: profile.sameDayBookingEnabled,
        parkingAvailable: profile.parkingAvailable,
        wheelchairAccessible: profile.wheelchairAccessible,
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load booking settings');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: BookingFormValues) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data: UpdateBookingSettingsRequest = values;

      await api.settings.updateBooking(data);
      setSuccess('Booking settings updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update booking settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Booking Settings"
        description="Configure booking windows, buffer times, and availability"
      >
        <div className="space-y-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Booking Settings"
      description="Configure booking windows, buffer times, and availability"
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-6 border-success bg-success/10">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success">{success}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Instant Booking */}
          <FormField
            control={form.control}
            name="instantBookingEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Instant Booking</FormLabel>
                  <FormDescription>
                    Allow clients to book instantly without approval
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Accepts New Clients */}
          <FormField
            control={form.control}
            name="acceptsNewClients"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Accept New Clients</FormLabel>
                  <FormDescription>Allow new clients to book your services</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Mobile Service */}
          <FormField
            control={form.control}
            name="mobileServiceAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Mobile Service Available</FormLabel>
                  <FormDescription>Offer services at client locations</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Same-Day Booking */}
          <FormField
            control={form.control}
            name="sameDayBookingEnabled"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Same-Day Booking</FormLabel>
                  <FormDescription>Allow clients to book appointments for today</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Advance Booking Window */}
          <FormField
            control={form.control}
            name="advanceBookingDays"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Advance Booking Window (days)</FormLabel>
                <FormControl>
                  <Input type="number" min="1" max="365" placeholder="30" {...field} />
                </FormControl>
                <FormDescription>How far in advance clients can book (1-365 days)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Minimum Advance Notice */}
          <FormField
            control={form.control}
            name="minAdvanceHours"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Advance Notice (hours)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="168" placeholder="24" {...field} />
                </FormControl>
                <FormDescription>
                  Minimum time required before appointments (0-168 hours)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Booking Buffer Time */}
          <FormField
            control={form.control}
            name="bookingBufferMinutes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Buffer Time Between Appointments (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="120" placeholder="0" {...field} />
                </FormControl>
                <FormDescription>
                  Time gap between appointments for preparation (0-120 minutes)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Parking Available */}
          <FormField
            control={form.control}
            name="parkingAvailable"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Parking Available</FormLabel>
                  <FormDescription>Is parking available at your location?</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Wheelchair Accessible */}
          <FormField
            control={form.control}
            name="wheelchairAccessible"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Wheelchair Accessible</FormLabel>
                  <FormDescription>Is your location wheelchair accessible?</FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value || false} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsLayout>
  );
}
