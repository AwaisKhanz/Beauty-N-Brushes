'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { AlertCircle, Upload, X } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';

const profileSchema = z.object({
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  phone: z.string().optional(),
  bio: z.string().optional(),
  hairType: z.string().optional(),
  hairTexture: z.string().optional(),
  hairPreferences: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

interface ProfileFormProps {
  initialData?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    hairType?: string | null;
    hairTexture?: string | null;
    hairPreferences?: string | null;
  };
  onSuccess?: () => void;
}

export function ProfileForm({ initialData, onSuccess }: ProfileFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(initialData?.avatarUrl || null);

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      phone: initialData?.phone || '',
      bio: initialData?.bio || '',
      hairType: initialData?.hairType || '',
      hairTexture: initialData?.hairTexture || '',
      hairPreferences: initialData?.hairPreferences || '',
    },
  });

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('Avatar must be under 5MB');
      return;
    }

    setAvatarFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  }

  function removeAvatar() {
    setAvatarFile(null);
    setAvatarPreview(null);
  }

  async function onSubmit(values: ProfileFormValues) {
    try {
      setLoading(true);
      setError('');

      // Upload avatar if changed
      let avatarUrl = initialData?.avatarUrl;
      if (avatarFile) {
        const uploadRes = await api.upload.file(avatarFile, 'profile');
        if (uploadRes.success && uploadRes.data) {
          avatarUrl = uploadRes.data.file.url;
        }
      }

      // Update profile
      await api.users.updateProfile({
        ...values,
        avatarUrl: avatarUrl || undefined,
      });

      toast.success('Profile updated successfully');
      onSuccess?.();
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Avatar Upload */}
        <div className="space-y-2">
          <Label>Profile Photo</Label>
          <div className="flex items-center gap-4">
            {avatarPreview ? (
              <div className="relative">
                <Image
                  src={avatarPreview}
                  alt="Avatar preview"
                  width={96}
                  height={96}
                  className="rounded-full object-cover border-2 border-primary/20"
                />
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute -top-2 -right-2 p-1 bg-destructive text-destructive-foreground rounded-full hover:bg-destructive/90"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-3xl font-heading font-bold text-primary">
                  {initialData?.firstName?.[0]}
                  {initialData?.lastName?.[0]}
                </span>
              </div>
            )}

            <div>
              <input
                type="file"
                id="avatar-upload"
                accept="image/*"
                onChange={handleAvatarChange}
                className="sr-only"
              />
              <label htmlFor="avatar-upload">
                <Button type="button" variant="outline" size="sm" asChild>
                  <span className="cursor-pointer">
                    <Upload className="h-4 w-4 mr-2" />
                    Change Photo
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        {/* Email (Read-only) */}
        <div className="space-y-2">
          <Label>Email</Label>
          <Input value={initialData?.email || ''} disabled className="bg-muted" />
          <p className="text-xs text-muted-foreground">
            Contact support to change your email address
          </p>
        </div>

        {/* Name Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="firstName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>First Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="lastName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Last Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Phone */}
        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Phone Number (Optional)</FormLabel>
              <FormControl>
                <Input {...field} type="tel" placeholder="+1 (555) 123-4567" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Bio */}
        <FormField
          control={form.control}
          name="bio"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Bio (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Tell providers a bit about yourself..."
                  rows={3}
                  className="resize-none"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Hair Preferences Section */}
        <div className="pt-4 border-t">
          <h3 className="text-lg font-semibold mb-4">Hair Preferences</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Help providers understand your hair better
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="hairType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hair Type</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hair type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="type-1">Type 1 - Straight</SelectItem>
                      <SelectItem value="type-2">Type 2 - Wavy</SelectItem>
                      <SelectItem value="type-3">Type 3 - Curly</SelectItem>
                      <SelectItem value="type-4">Type 4 - Coily</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="hairTexture"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hair Texture</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select texture" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="fine">Fine</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="coarse">Coarse</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="hairPreferences"
            render={({ field }) => (
              <FormItem className="mt-4">
                <FormLabel>Additional Preferences (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    placeholder="e.g., Prefer natural products, sensitive scalp, specific styling preferences..."
                    rows={3}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Button type="submit" disabled={loading} variant="dark">
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>
    </Form>
  );
}
