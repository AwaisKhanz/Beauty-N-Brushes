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
} from '@/components/ui/form';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { UpdateNotificationSettingsRequest } from '@/shared-types/settings.types';

const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  smsNotifications: z.boolean(),
});

type NotificationsFormValues = z.infer<typeof notificationsSchema>;

export default function NotificationsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<NotificationsFormValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      smsNotifications: true,
    },
  });

  useEffect(() => {
    fetchNotificationSettings();
  }, []);

  async function fetchNotificationSettings() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getNotifications();

      form.reset({
        emailNotifications: response.data.emailNotifications,
        smsNotifications: response.data.smsNotifications,
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load notification settings');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: NotificationsFormValues) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data: UpdateNotificationSettingsRequest = values;

      await api.settings.updateNotifications(data);
      setSuccess('Notification settings updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update notification settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Notifications"
        description="Control email and SMS notification preferences"
      >
        <div className="space-y-6">
          {[1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-20 w-full" />
            </div>
          ))}
        </div>
      </SettingsLayout>
    );
  }

  return (
    <SettingsLayout
      title="Notifications"
      description="Control email and SMS notification preferences"
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
          {/* Email Notifications */}
          <FormField
            control={form.control}
            name="emailNotifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">Email Notifications</FormLabel>
                  <FormDescription>
                    Receive booking confirmations, reminders, and updates via email
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
              </FormItem>
            )}
          />

          {/* SMS Notifications */}
          <FormField
            control={form.control}
            name="smsNotifications"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">SMS Notifications</FormLabel>
                  <FormDescription>
                    Receive booking confirmations and important alerts via SMS
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
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
