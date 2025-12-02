'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
// import { InstagramMediaImport } from '@/components/provider/InstagramMediaImport'; // Temporarily hidden
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
// import { Badge } from '@/components/ui/badge'; // Temporarily hidden
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CheckCircle2, AlertCircle, /* Instagram, Link as LinkIcon, */ Camera, Upload, X, ImageIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadService } from '@/lib/upload';
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
  // Business Details fields
  businessType: z.string().optional(),
  timezone: z.string().optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

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

export default function ProfileSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // Instagram integration state - Temporarily hidden
  // const [instagramConnected, setInstagramConnected] = useState(false);
  // const [instagramUsername, setInstagramUsername] = useState<string | null>(null);
  // const [disconnecting, setDisconnecting] = useState(false);

  // Photo upload states
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState<File | null>(null);
  const [existingProfilePhotoUrl, setExistingProfilePhotoUrl] = useState<string | null>(null);
  const [existingCoverPhotoUrl, setExistingCoverPhotoUrl] = useState<string | null>(null);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);

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
      // Business Details
      businessType: '',
      timezone: '',
    },
  });

  useEffect(() => {
    fetchProfileSettings();
    // checkInstagramConnection(); // Temporarily hidden
  }, []);

  // Instagram functions - Temporarily hidden
  /*
  async function checkInstagramConnection() {
    try {
      // TODO: Add API endpoint to check Instagram connection status
      // For now, we'll infer from instagramHandle
      const response = await api.settings.getProfile();
      const handle = response.data.profile.instagramHandle;
      if (handle) {
        setInstagramConnected(true);
        setInstagramUsername(handle);
      }
    } catch (err: unknown) {
      console.error('Failed to check Instagram connection:', err);
    }
  }

  async function handleInstagramConnect() {
    try {
      // Redirect to Instagram OAuth flow
      window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/instagram/connect`;
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to connect Instagram');
    }
  }

  async function handleInstagramDisconnect() {
    if (
      !confirm(
        'Are you sure you want to disconnect Instagram? This will remove access to import your photos.'
      )
    ) {
      return;
    }

    try {
      setDisconnecting(true);
      setError('');

      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/instagram/disconnect`, {
        method: 'POST',
        credentials: 'include',
      });

      setInstagramConnected(false);
      setInstagramUsername(null);
      setSuccess('Instagram disconnected successfully');

      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to disconnect Instagram');
    } finally {
      setDisconnecting(false);
    }
  }
  */

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
        // Business Details
        businessType: profile.businessType || '',
        timezone: profile.timezone || '',
      });

      // Set existing photo URLs
      if (profile.profilePhotoUrl) {
        setExistingProfilePhotoUrl(profile.profilePhotoUrl);
      }
      if (profile.coverPhotoUrl) {
        setExistingCoverPhotoUrl(profile.coverPhotoUrl);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: ProfileFormValues) {
    try {
      setSaving(true);
      setUploadingPhotos(true);
      setError('');
      setSuccess('');

      // Upload photos if new files are selected
      let profilePhotoUrl = existingProfilePhotoUrl;
      let coverPhotoUrl = existingCoverPhotoUrl;

      if (profilePhotoFile) {
        try {
          const uploadResult = await uploadService.uploadFile(profilePhotoFile, 'profile');
          profilePhotoUrl = uploadResult.url;
        } catch (uploadError) {
          setError(extractErrorMessage(uploadError) || 'Failed to upload profile photo');
          setSaving(false);
          setUploadingPhotos(false);
          return;
        }
      }

      if (coverPhotoFile) {
        try {
          const uploadResult = await uploadService.uploadFile(coverPhotoFile, 'cover');
          coverPhotoUrl = uploadResult.url;
        } catch (uploadError) {
          setError(extractErrorMessage(uploadError) || 'Failed to upload cover photo');
          setSaving(false);
          setUploadingPhotos(false);
          return;
        }
      }

      const data: UpdateProfileSettingsRequest = {
        businessName: values.businessName,
        tagline: values.tagline || null,
        description: values.description || null,
        yearsExperience: values.yearsExperience || 0,
        websiteUrl: values.websiteUrl || null,
        instagramHandle: values.instagramHandle || null,
        tiktokHandle: values.tiktokHandle || null,
        facebookUrl: values.facebookUrl || null,
        profilePhotoUrl: profilePhotoUrl || existingProfilePhotoUrl || null,
        coverPhotoUrl: coverPhotoUrl || existingCoverPhotoUrl || null,
        // Business Details
        businessType: values.businessType || null,
        timezone: values.timezone || null,
      };

      await api.settings.updateProfile(data);
      
      // Update existing URLs if uploaded
      if (profilePhotoUrl) setExistingProfilePhotoUrl(profilePhotoUrl);
      if (coverPhotoUrl) setExistingCoverPhotoUrl(coverPhotoUrl);
      
      // Clear file selections
      setProfilePhotoFile(null);
      setCoverPhotoFile(null);

      setSuccess('Profile settings updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update profile settings');
    } finally {
      setSaving(false);
      setUploadingPhotos(false);
    }
  }

  function handleFileSelect(file: File | null, setter: (file: File | null) => void) {
    if (file && file.type.startsWith('image/')) {
      setter(file);
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
        <Alert variant="success" className="mb-6">
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Profile Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Profile Photo
              </CardTitle>
              <CardDescription>Your main profile picture visible to clients</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <div className="relative h-24 w-24 rounded-full bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {profilePhotoFile ? (
                    <Image
                      src={URL.createObjectURL(profilePhotoFile)}
                      alt="Profile preview"
                      fill
                      className="object-cover"
                    />
                  ) : existingProfilePhotoUrl ? (
                    <Image
                      src={existingProfilePhotoUrl}
                      alt="Profile"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <Camera className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex-1 space-y-2">
                  <Label htmlFor="profile-photo" className="cursor-pointer">
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {profilePhotoFile || existingProfilePhotoUrl ? 'Change profile photo' : 'Upload profile photo'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                    </div>
                  </Label>
                  <Input
                    id="profile-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null, setProfilePhotoFile)}
                  />

                  {(profilePhotoFile || existingProfilePhotoUrl) && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setProfilePhotoFile(null);
                        setExistingProfilePhotoUrl(null);
                      }}
                      className="text-destructive hover:text-destructive"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Cover Photo */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Cover Photo
              </CardTitle>
              <CardDescription>A banner image for your profile (optional)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="relative h-32 w-full rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                  {coverPhotoFile ? (
                    <Image
                      src={URL.createObjectURL(coverPhotoFile)}
                      alt="Cover preview"
                      fill
                      className="object-cover"
                    />
                  ) : existingCoverPhotoUrl ? (
                    <Image
                      src={existingCoverPhotoUrl}
                      alt="Cover"
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <ImageIcon className="h-8 w-8 text-muted-foreground" />
                  )}
                </div>

                <div className="flex gap-2">
                  <Label htmlFor="cover-photo" className="cursor-pointer flex-1">
                    <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">
                        {coverPhotoFile || existingCoverPhotoUrl ? 'Change cover photo' : 'Upload cover photo'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                    </div>
                  </Label>
                  <Input
                    id="cover-photo"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleFileSelect(e.target.files?.[0] || null, setCoverPhotoFile)}
                  />
                </div>

                {(coverPhotoFile || existingCoverPhotoUrl) && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setCoverPhotoFile(null);
                      setExistingCoverPhotoUrl(null);
                    }}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

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

          {/* Instagram Handle - Temporarily hidden */}
          {/* <FormField
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
          /> */}

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

          {/* Business Details Section */}
          <div className="space-y-4 pt-6 border-t">
            <h3 className="text-lg font-semibold">Business Details</h3>
            
            <div className="space-y-4">
              {/* Business Type */}
              <FormField
                control={form.control}
                name="businessType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
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
                    <FormDescription>Type of your beauty business</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
                  <FormDescription>Your business timezone for scheduling</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || uploadingPhotos}>
              {saving || uploadingPhotos ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>

      {/* Instagram Integration Section - Temporarily hidden */}
      {/* <Card className="mt-8">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Instagram className="h-5 w-5" />
                Instagram Integration
              </CardTitle>
              <CardDescription>
                Connect your Instagram to import your portfolio photos
              </CardDescription>
            </div>
            {instagramConnected ? (
              <Badge variant="success" className="gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Connected
              </Badge>
            ) : (
              <Badge variant="secondary">Not Connected</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {instagramConnected ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Connected Account:</span>
                <span className="text-sm font-medium">@{instagramUsername}</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" asChild>
                  <a href="/provider/services" className="gap-2">
                    <LinkIcon className="h-4 w-4" />
                    Import Photos
                  </a>
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleInstagramDisconnect}
                  disabled={disconnecting}
                >
                  {disconnecting ? 'Disconnecting...' : 'Disconnect'}
                </Button>
              </div>
            </>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Connect your Instagram account to easily import photos from your feed to your
                portfolio. This helps showcase your work to potential clients.
              </p>
              <Button onClick={handleInstagramConnect} className="gap-2">
                <Instagram className="h-4 w-4" />
                Connect Instagram
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Instagram Media Import */}
      {/* {instagramConnected && (
        <InstagramMediaImport onImportComplete={() => checkInstagramConnection()} />
      )} */}
    </SettingsLayout>
  );
}
