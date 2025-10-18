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
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { UpdatePoliciesRequest } from '@/shared-types/settings.types';

const policiesSchema = z.object({
  cancellationWindowHours: z.coerce.number().int().min(0).max(168),
  cancellationFeePercentage: z.coerce.number().min(0).max(100),
  cancellationPolicyText: z.string().optional(),
  lateGracePeriodMinutes: z.coerce.number().int().min(0).max(60),
  lateCancellationAfterMinutes: z.coerce.number().int().min(0).max(60),
  latePolicyText: z.string().optional(),
  noShowFeePercentage: z.coerce.number().min(0).max(100),
  noShowPolicyText: z.string().optional(),
  rescheduleAllowed: z.boolean(),
  rescheduleWindowHours: z.coerce.number().int().min(0).max(168),
  maxReschedules: z.coerce.number().int().min(0).max(10),
  reschedulePolicyText: z.string().optional(),
  refundPolicyText: z.string().optional(),
  consultationRequired: z.boolean(),
  requiresClientProducts: z.boolean(),
  touchUpPolicyText: z.string().optional(),
});

type PoliciesFormValues = z.infer<typeof policiesSchema>;

export default function PoliciesPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<PoliciesFormValues>({
    resolver: zodResolver(policiesSchema),
    defaultValues: {
      cancellationWindowHours: 24,
      cancellationFeePercentage: 50,
      cancellationPolicyText: '',
      lateGracePeriodMinutes: 15,
      lateCancellationAfterMinutes: 15,
      latePolicyText: '',
      noShowFeePercentage: 100,
      noShowPolicyText: '',
      rescheduleAllowed: true,
      rescheduleWindowHours: 24,
      maxReschedules: 2,
      reschedulePolicyText: '',
      refundPolicyText: '',
      consultationRequired: false,
      requiresClientProducts: false,
      touchUpPolicyText: '',
    },
  });

  useEffect(() => {
    fetchPolicies();
  }, []);

  async function fetchPolicies() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getPolicies();
      const policies = response.data.policies;

      form.reset({
        cancellationWindowHours: policies.cancellationWindowHours,
        cancellationFeePercentage: Number(policies.cancellationFeePercentage),
        cancellationPolicyText: policies.cancellationPolicyText || '',
        lateGracePeriodMinutes: policies.lateGracePeriodMinutes,
        lateCancellationAfterMinutes: policies.lateCancellationAfterMinutes,
        latePolicyText: policies.latePolicyText || '',
        noShowFeePercentage: Number(policies.noShowFeePercentage),
        noShowPolicyText: policies.noShowPolicyText || '',
        rescheduleAllowed: policies.rescheduleAllowed,
        rescheduleWindowHours: policies.rescheduleWindowHours,
        maxReschedules: policies.maxReschedules,
        reschedulePolicyText: policies.reschedulePolicyText || '',
        refundPolicyText: policies.refundPolicyText || '',
        consultationRequired: policies.consultationRequired,
        requiresClientProducts: policies.requiresClientProducts,
        touchUpPolicyText: policies.touchUpPolicyText || '',
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load policies');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: PoliciesFormValues) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data: UpdatePoliciesRequest = {
        ...values,
        cancellationPolicyText: values.cancellationPolicyText || null,
        latePolicyText: values.latePolicyText || null,
        noShowPolicyText: values.noShowPolicyText || null,
        reschedulePolicyText: values.reschedulePolicyText || null,
        refundPolicyText: values.refundPolicyText || null,
        touchUpPolicyText: values.touchUpPolicyText || null,
      };

      await api.settings.updatePolicies(data);
      setSuccess('Policies updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update policies');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Policies"
        description="Set cancellation, late arrival, and no-show policies"
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
      title="Policies"
      description="Set cancellation, late arrival, and no-show policies"
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Cancellation Policy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Cancellation Policy</h3>

            <FormField
              control={form.control}
              name="cancellationWindowHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Window (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="168" {...field} />
                  </FormControl>
                  <FormDescription>
                    How far in advance clients must cancel (0-168 hours)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancellationFeePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Fee (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" {...field} />
                  </FormControl>
                  <FormDescription>
                    Percentage of deposit to charge for late cancellations
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="cancellationPolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancellation Policy Text (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your cancellation policy..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Custom cancellation policy details</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Late Arrival Policy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Late Arrival Policy</h3>

            <FormField
              control={form.control}
              name="lateGracePeriodMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Grace Period (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="60" {...field} />
                  </FormControl>
                  <FormDescription>
                    How late clients can arrive without penalty (0-60 minutes)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lateCancellationAfterMinutes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cancel After (minutes)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="60" {...field} />
                  </FormControl>
                  <FormDescription>
                    Automatically cancel if client is this late (0-60 minutes)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="latePolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Late Policy Text (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your late policy..." rows={3} {...field} />
                  </FormControl>
                  <FormDescription>Custom late arrival policy details</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* No-Show Policy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">No-Show Policy</h3>

            <FormField
              control={form.control}
              name="noShowFeePercentage"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No-Show Fee (%)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="100" {...field} />
                  </FormControl>
                  <FormDescription>
                    Percentage of deposit to charge for no-shows (0-100%)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="noShowPolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>No-Show Policy Text (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your no-show policy..." rows={3} {...field} />
                  </FormControl>
                  <FormDescription>Custom no-show policy details</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Reschedule Policy */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Reschedule Policy</h3>

            <FormField
              control={form.control}
              name="rescheduleAllowed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Allow Rescheduling</FormLabel>
                    <FormDescription>Let clients reschedule appointments</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="rescheduleWindowHours"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reschedule Window (hours)</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="168" {...field} />
                  </FormControl>
                  <FormDescription>
                    How far in advance clients must reschedule (0-168 hours)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="maxReschedules"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum Reschedules</FormLabel>
                  <FormControl>
                    <Input type="number" min="0" max="10" {...field} />
                  </FormControl>
                  <FormDescription>
                    Maximum times a booking can be rescheduled (0-10)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="reschedulePolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reschedule Policy Text (Optional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe your reschedule policy..."
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>Custom reschedule policy details</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Other Policies */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Other Policies</h3>

            <FormField
              control={form.control}
              name="consultationRequired"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Consultation Required</FormLabel>
                    <FormDescription>Require consultation before first service</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="requiresClientProducts"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Client Products Required</FormLabel>
                    <FormDescription>Clients must bring their own products</FormDescription>
                  </div>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="refundPolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Refund Policy (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your refund policy..." rows={3} {...field} />
                  </FormControl>
                  <FormDescription>Custom refund policy details</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="touchUpPolicyText"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Touch-Up Policy (Optional)</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Describe your touch-up policy..." rows={3} {...field} />
                  </FormControl>
                  <FormDescription>Custom touch-up policy details</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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
