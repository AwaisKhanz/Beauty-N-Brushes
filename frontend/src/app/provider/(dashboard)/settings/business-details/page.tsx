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
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertCircle, FileText, Shield } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type {
  UpdateBusinessDetailsSettingsRequest,
  BusinessDetailsResponse,
} from '@/shared-types/settings.types';

const businessDetailsSchema = z.object({
  businessType: z.string().optional(),
  licenseNumber: z.string().max(100).optional().or(z.literal('')),
  timezone: z.string().optional(),
});

type BusinessDetailsFormValues = z.infer<typeof businessDetailsSchema>;

// Common timezones
const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'America/Anchorage', label: 'Alaska Time (AKT)' },
  { value: 'Pacific/Honolulu', label: 'Hawaii Time (HT)' },
  { value: 'Europe/London', label: 'London (GMT/BST)' },
  { value: 'Europe/Paris', label: 'Paris (CET)' },
  { value: 'Africa/Accra', label: 'Ghana (GMT)' },
  { value: 'Africa/Lagos', label: 'Nigeria (WAT)' },
];

const BUSINESS_TYPES = [
  { value: 'individual', label: 'Individual Professional' },
  { value: 'salon', label: 'Salon' },
  { value: 'spa', label: 'Spa' },
  { value: 'mobile', label: 'Mobile Services' },
  { value: 'studio', label: 'Studio' },
];

export default function BusinessDetailsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [details, setDetails] = useState<BusinessDetailsResponse['details'] | null>(null);

  const form = useForm<BusinessDetailsFormValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      businessType: '',
      licenseNumber: '',
      timezone: '',
    },
  });

  useEffect(() => {
    fetchBusinessDetails();
  }, []);

  async function fetchBusinessDetails() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getBusinessDetails();
      const data = response.data.details;
      setDetails(data as BusinessDetailsResponse['details']);

      form.reset({
        businessType: data.businessType || '',
        licenseNumber: data.licenseNumber || '',
        timezone: data.timezone || '',
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load business details');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: BusinessDetailsFormValues) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data: UpdateBusinessDetailsSettingsRequest = {
        businessType: values.businessType || undefined,
        licenseNumber: values.licenseNumber || null,
        timezone: values.timezone || undefined,
      };

      await api.settings.updateBusinessDetails(data);
      setSuccess('Business details updated successfully');

      // Refresh data
      await fetchBusinessDetails();

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update business details');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Business Details"
        description="License, timezone, and verification status"
      >
        <div className="space-y-6">
          {[1, 2, 3, 4].map((i) => (
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
      title="Business Details"
      description="License, timezone, and verification status"
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

      {/* Verification Status */}
      {details && (
        <div className="mb-6 space-y-3">
          <h3 className="font-semibold flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Verification Status
          </h3>
          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">License:</span>
              {details.licenseVerified ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">Not Verified</Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Insurance:</span>
              {details.insuranceVerified ? (
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified
                </Badge>
              ) : (
                <Badge variant="secondary">Not Verified</Badge>
              )}
            </div>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Business Type */}
          <FormField
            control={form.control}
            name="businessType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Type</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BUSINESS_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Type of beauty business you operate</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* License Number */}
          <FormField
            control={form.control}
            name="licenseNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>License Number</FormLabel>
                <FormControl>
                  <Input placeholder="ABC123456" {...field} />
                </FormControl>
                <FormDescription>
                  Your professional license number (optional, but recommended)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Timezone */}
          <FormField
            control={form.control}
            name="timezone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Timezone</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {TIMEZONES.map((tz) => (
                      <SelectItem key={tz.value} value={tz.value}>
                        {tz.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>Your local timezone for scheduling and bookings</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Info Alert */}
          <Alert>
            <FileText className="h-4 w-4" />
            <AlertDescription>
              Verification badges help build trust with clients. Contact support to verify your
              license and insurance documentation.
            </AlertDescription>
          </Alert>

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
