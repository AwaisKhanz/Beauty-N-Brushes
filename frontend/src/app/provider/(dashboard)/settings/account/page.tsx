'use client';

import { useState } from 'react';
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
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { CheckCircle2, AlertCircle, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import type { UpdateAccountRequest } from '@/shared-types/settings.types';

const accountSchema = z
  .object({
    email: z.string().email('Invalid email').optional().or(z.literal('')),
    phone: z.string().optional().or(z.literal('')),
    currentPassword: z.string().optional().or(z.literal('')),
    newPassword: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .optional()
      .or(z.literal('')),
    confirmPassword: z.string().optional().or(z.literal('')),
  })
  .refine(
    (data) => {
      if (data.newPassword && data.newPassword !== data.confirmPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Passwords do not match',
      path: ['confirmPassword'],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && !data.currentPassword) {
        return false;
      }
      return true;
    },
    {
      message: 'Current password required when updating password',
      path: ['currentPassword'],
    }
  );

type AccountFormValues = z.infer<typeof accountSchema>;

export default function AccountPage() {
  const [saving, setSaving] = useState(false);
  const [deactivating, setDeactivating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { logout } = useAuth();
  const router = useRouter();

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountSchema),
    defaultValues: {
      email: '',
      phone: '',
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  async function onSubmit(values: AccountFormValues) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data: UpdateAccountRequest = {};

      if (values.email) data.email = values.email;
      if (values.phone) data.phone = values.phone;
      if (values.newPassword && values.currentPassword) {
        data.currentPassword = values.currentPassword;
        data.newPassword = values.newPassword;
      }

      // Only submit if there's something to update
      if (Object.keys(data).length === 0) {
        setError('No changes to save');
        return;
      }

      await api.settings.updateAccount(data);
      setSuccess('Account updated successfully');

      // Clear password fields
      form.setValue('currentPassword', '');
      form.setValue('newPassword', '');
      form.setValue('confirmPassword', '');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update account');
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    try {
      setDeactivating(true);
      setError('');

      await api.settings.deactivateAccount();

      // Log out and redirect to home
      await logout();
      router.push('/');
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to deactivate account');
      setDeactivating(false);
    }
  }

  return (
    <SettingsLayout
      title="Account Settings"
      description="Update email, phone, password, or deactivate account"
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
          {/* Email Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Change Email</h3>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Email Address</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="newemail@example.com" {...field} />
                  </FormControl>
                  <FormDescription>You will need to verify your new email address</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Phone Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Change Phone Number</h3>
            <FormField
              control={form.control}
              name="phone"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+1234567890" {...field} />
                  </FormControl>
                  <FormDescription>You will need to verify your new phone number</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator />

          {/* Password Section */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Change Password</h3>

            <FormField
              control={form.control}
              name="currentPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Current Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>Enter your current password</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>Must be at least 8 characters</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm New Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormDescription>Re-enter your new password</FormDescription>
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

      <Separator className="my-8" />

      {/* Danger Zone */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          <h3 className="text-lg font-semibold text-destructive">Danger Zone</h3>
        </div>
        <Alert variant="destructive">
          <AlertDescription>
            Deactivating your account will suspend all services and hide your profile. This action
            requires contacting support to reactivate.
          </AlertDescription>
        </Alert>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" disabled={deactivating}>
              {deactivating ? 'Deactivating...' : 'Deactivate Account'}
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action will deactivate your account and hide your profile from clients. You
                will be logged out and will need to contact support to reactivate your account.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={handleDeactivate} className="bg-destructive text-white">
                Yes, Deactivate Account
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SettingsLayout>
  );
}
