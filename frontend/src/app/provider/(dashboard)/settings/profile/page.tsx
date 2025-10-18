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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { UpdateProfileSettingsRequest } from '@/shared-types/settings.types';

const profileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255),
  tagline: z.string().max(255).optional(),
  description: z.string().optional(),
  yearsExperience: z.coerce.number().int().min(0).max(99).optional(),
  websiteUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  instagramHandle: z.string().max(100).optional(),
  tiktokHandle: z.string().max(100).optional(),
  facebookUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      businessName: '',
      tagline: '',
      description: '',
      yearsExperience: 0,
      websiteUrl: '',
      instagramHandle: '',
      tiktokHandle: '',
      facebookUrl: '',
    },
  });

  useEffect(() => {
    fetchProfileSettings();
  }, []);

  async function fetchProfileSettings() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getProfile();
      const profile = response.data.profile;

      form.reset({
        businessName: profile.businessName || '',
        tagline: profile.tagline || '',
        description: profile.description || '',
        yearsExperience: profile.yearsExperience || 0,
        websiteUrl: profile.websiteUrl || '',
        instagramHandle: profile.instagramHandle || '',
        tiktokHandle: profile.tiktokHandle || '',
        facebookUrl: profile.facebookUrl || '',
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      const data: UpdateProfileSettingsRequest = {
        businessName: values.businessName,
        tagline: values.tagline || null,
        description: values.description || null,
        yearsExperience: values.yearsExperience || 0,
        websiteUrl: values.websiteUrl || null,
        instagramHandle: values.instagramHandle || null,
        tiktokHandle: values.tiktokHandle || null,
        facebookUrl: values.facebookUrl || null,
      };

      await api.settings.updateProfile(data);
      setSuccess('Profile settings updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update profile settings');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Business Profile"
        description="Manage your business information, branding, and social links"
      >
        <div className="space-y-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
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
      title="Business Profile"
      description="Manage your business information, branding, and social links"
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
          {/* Business Name */}
          <FormField
            control={form.control}
            name="businessName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business Name *</FormLabel>
                <FormControl>
                  <Input placeholder="Your Beauty Salon" {...field} />
                </FormControl>
                <FormDescription>This is your public-facing business name</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tagline */}
          <FormField
            control={form.control}
            name="tagline"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tagline</FormLabel>
                <FormControl>
                  <Input placeholder="Beautiful hair, beautiful you" {...field} />
                </FormControl>
                <FormDescription>A short, catchy description of your business</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Tell clients about your business, specializations, and what makes you unique..."
                    rows={5}
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Detailed description of your services and experience
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Years of Experience */}
          <FormField
            control={form.control}
            name="yearsExperience"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Years of Experience</FormLabel>
                <FormControl>
                  <Input type="number" min="0" max="99" placeholder="5" {...field} />
                </FormControl>
                <FormDescription>How many years have you been in business?</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Website URL */}
          <FormField
            control={form.control}
            name="websiteUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Website URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.yourwebsite.com" {...field} />
                </FormControl>
                <FormDescription>Your business website (optional)</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Instagram Handle */}
          <FormField
            control={form.control}
            name="instagramHandle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Instagram Handle</FormLabel>
                <FormControl>
                  <Input placeholder="@yourhandle" {...field} />
                </FormControl>
                <FormDescription>Your Instagram username</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* TikTok Handle */}
          <FormField
            control={form.control}
            name="tiktokHandle"
            render={({ field }) => (
              <FormItem>
                <FormLabel>TikTok Handle</FormLabel>
                <FormControl>
                  <Input placeholder="@yourhandle" {...field} />
                </FormControl>
                <FormDescription>Your TikTok username</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Facebook URL */}
          <FormField
            control={form.control}
            name="facebookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Facebook Page URL</FormLabel>
                <FormControl>
                  <Input placeholder="https://www.facebook.com/yourpage" {...field} />
                </FormControl>
                <FormDescription>Your Facebook business page</FormDescription>
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
