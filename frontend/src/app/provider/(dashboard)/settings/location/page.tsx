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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { LocationAutocomplete } from '@/components/location/LocationAutocomplete';
import type { UpdateLocationRequest } from '@/shared-types/settings.types';
import type { LocationData } from '@/shared-types/google-places.types';

const locationSchema = z.object({
  // Google Places fields
  placeId: z.string().optional(),
  formattedAddress: z.string().optional(),
  addressComponents: z.unknown().optional(),
  // Standard address fields
  addressLine1: z.string().min(1, 'Address is required').max(255),
  addressLine2: z.string().max(255).optional().or(z.literal('')),
  city: z.string().min(1, 'City is required').max(100),
  state: z.string().min(1, 'State is required').max(50),
  zipCode: z.string().min(1, 'Zip code is required').max(20),
  country: z.string().min(1, 'Country is required').max(50),
  businessPhone: z.string().max(20).optional().or(z.literal('')),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
});

type LocationFormValues = z.infer<typeof locationSchema>;

export default function LocationSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<LocationFormValues>({
    resolver: zodResolver(locationSchema),
    defaultValues: {
      placeId: '',
      formattedAddress: '',
      addressComponents: undefined,
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      businessPhone: '',
      latitude: null,
      longitude: null,
    },
  });

  useEffect(() => {
    fetchLocationSettings();
  }, []);

  async function fetchLocationSettings() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getLocation();
      const location = response.data.location;

      form.reset({
        placeId: location.placeId || '',
        formattedAddress: location.formattedAddress || '',
        addressComponents: location.addressComponents,
        addressLine1: location.addressLine1 || '',
        addressLine2: location.addressLine2 || '',
        city: location.city || '',
        state: location.state || '',
        zipCode: location.zipCode || '',
        country: location.country || 'US',
        businessPhone: location.businessPhone || '',
        latitude: location.latitude,
        longitude: location.longitude,
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load location settings');
    } finally {
      setLoading(false);
    }
  }

  const handleLocationSelect = (location: LocationData) => {
    // Update all address fields from Google Places data
    form.setValue('placeId', location.placeId);
    form.setValue('formattedAddress', location.formattedAddress);
    form.setValue('addressComponents', location.addressComponents as unknown as Record<string, unknown>);
    form.setValue('addressLine1', location.addressLine1);
    form.setValue('city', location.city);
    form.setValue('state', location.state);
    form.setValue('zipCode', location.zipCode);
    form.setValue('country', location.country);
    form.setValue('latitude', location.latitude);
    form.setValue('longitude', location.longitude);
  };

  async function onSubmit(values: LocationFormValues) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data: UpdateLocationRequest = {
        // Google Places fields
        placeId: values.placeId,
        formattedAddress: values.formattedAddress,
        addressComponents: values.addressComponents as any,
        // Standard fields
        addressLine1: values.addressLine1,
        addressLine2: values.addressLine2 || null,
        city: values.city,
        state: values.state,
        zipCode: values.zipCode,
        country: values.country,
        businessPhone: values.businessPhone || '',
        latitude: values.latitude,
        longitude: values.longitude,
      };

      await api.settings.updateLocation(data);
      setSuccess('Location settings updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update location settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Location & Contact"
        description="Manage business address and contact information"
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
      title="Location & Contact"
      description="Manage business address and contact information"
    >
      {error && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert variant="success" className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Phone */}
          <FormField
            control={form.control}
            name="businessPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Phone</FormLabel>
                <FormControl>
                  <Input placeholder="+1 (555) 123-4567" {...field} />
                </FormControl>
                <FormDescription>Your business contact number</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Google Places Autocomplete */}
          <div className="space-y-2">
            <FormLabel>Business Address *</FormLabel>
            <LocationAutocomplete
              onLocationSelect={handleLocationSelect}
              defaultValue={form.watch('formattedAddress') || ''}
              placeholder="Search for your business address..."
            />
            <FormDescription>
              Start typing to search for your address using Google Places
            </FormDescription>
          </div>

          {/* Address Line 2 - Manual input for suite/apt */}
          <FormField
            control={form.control}
            name="addressLine2"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Address Line 2</FormLabel>
                <FormControl>
                  <Input placeholder="Apartment, suite, unit, building, floor, etc." {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* City, State, Zip - Read-only (auto-populated from Google Places) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="city"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>City *</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="state"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>State/Province *</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="zipCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Zip/Postal Code *</FormLabel>
                  <FormControl>
                    <Input {...field} readOnly className="bg-muted" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Country - Read-only */}
          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country *</FormLabel>
                <FormControl>
                  <Input {...field} readOnly className="bg-muted" />
                </FormControl>
                <FormDescription>Auto-populated from address</FormDescription>
                <FormMessage />
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
