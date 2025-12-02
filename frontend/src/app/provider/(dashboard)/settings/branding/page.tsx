'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Image from 'next/image';
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
import { Label } from '@/components/ui/label';
import { CheckCircle2, AlertCircle, Upload, Palette, ImageIcon, X } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/lib/api';
import { uploadService } from '@/lib/upload';
import { extractErrorMessage } from '@/lib/error-utils';
import type { UpdateBrandingRequest } from '@/shared-types/settings.types';

const brandingSchema = z.object({
  logoUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
  brandColorPrimary: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
    .optional()
    .or(z.literal('')),
  brandColorSecondary: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
    .optional()
    .or(z.literal('')),
  brandColorAccent: z
    .string()
    .regex(/^#[0-9A-F]{6}$/i, 'Invalid hex color')
    .optional()
    .or(z.literal('')),
  brandFontHeading: z.string().optional(),
  brandFontBody: z.string().optional(),
});

type BrandingFormValues = z.infer<typeof brandingSchema>;

// Available fonts (matching BNB design system)
const AVAILABLE_FONTS = {
  heading: [
    { value: 'Playfair Display', label: 'Playfair Display (Elegant Serif)' },
    { value: 'Cormorant', label: 'Cormorant (Elegant Serif)' },
    { value: 'Lora', label: 'Lora (Refined Serif)' },
    { value: 'Cinzel', label: 'Cinzel (Luxurious Serif)' },
    { value: 'Montserrat', label: 'Montserrat (Modern Sans)' },
    { value: 'Raleway', label: 'Raleway (Refined Sans)' },
  ],
  body: [
    { value: 'Inter', label: 'Inter (Modern Sans)' },
    { value: 'Roboto', label: 'Roboto (Clean Sans)' },
    { value: 'Open Sans', label: 'Open Sans (Friendly Sans)' },
    { value: 'Lato', label: 'Lato (Warm Sans)' },
    { value: 'Source Sans Pro', label: 'Source Sans Pro (Professional Sans)' },
    { value: 'Nunito', label: 'Nunito (Rounded Sans)' },
  ],
};

// BNB Official Colors (for suggestions)
const BNB_COLORS = {
  primary: '#B06F64',
  accent: '#FFB09E',
  secondary: '#CA8D80',
  tertiary: '#DF9C8C',
};

export default function BrandingSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [existingLogoUrl, setExistingLogoUrl] = useState<string | null>(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const form = useForm<BrandingFormValues>({
    resolver: zodResolver(brandingSchema),
    defaultValues: {
      logoUrl: '',
      brandColorPrimary: '',
      brandColorSecondary: '',
      brandColorAccent: '',
      brandFontHeading: '',
      brandFontBody: '',
    },
  });

  useEffect(() => {
    fetchBrandingSettings();
  }, []);

  async function fetchBrandingSettings() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getBranding();
      const branding = response.data.branding;

      form.reset({
        logoUrl: branding.logoUrl || '',
        brandColorPrimary: branding.brandColorPrimary || '',
        brandColorSecondary: branding.brandColorSecondary || '',
        brandColorAccent: branding.brandColorAccent || '',
        brandFontHeading: branding.brandFontHeading || '',
        brandFontBody: branding.brandFontBody || '',
      });

      // Set existing logo URL
      if (branding.logoUrl) {
        setExistingLogoUrl(branding.logoUrl);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load branding settings');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: BrandingFormValues) {
    try {
      setSaving(true);
      setUploadingLogo(true);
      setError('');
      setSuccess('');

      // Upload logo if new file is selected
      let logoUrl = existingLogoUrl;

      if (logoFile) {
        try {
          const uploadResult = await uploadService.uploadFile(logoFile, 'logo');
          logoUrl = uploadResult.url;
        } catch (uploadError) {
          setError(extractErrorMessage(uploadError) || 'Failed to upload logo');
          setSaving(false);
          setUploadingLogo(false);
          return;
        }
      }

      // Use uploaded logo URL or form URL (form URL takes precedence if manually entered)
      const finalLogoUrl = values.logoUrl || logoUrl;

      const data: UpdateBrandingRequest = {
        logoUrl: finalLogoUrl || null,
        brandColorPrimary: values.brandColorPrimary || null,
        brandColorSecondary: values.brandColorSecondary || null,
        brandColorAccent: values.brandColorAccent || null,
        brandFontHeading: values.brandFontHeading || null,
        brandFontBody: values.brandFontBody || null,
      };

      await api.settings.updateBranding(data);
      
      // Update existing logo URL if uploaded
      if (logoUrl) setExistingLogoUrl(logoUrl);
      
      // Clear file selection
      setLogoFile(null);

      setSuccess('Branding settings updated successfully');

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to update branding settings');
    } finally {
      setSaving(false);
      setUploadingLogo(false);
    }
  }

  function handleFileSelect(file: File | null) {
    if (file && file.type.startsWith('image/')) {
      setLogoFile(file);
    }
  }

  function applyBNBDefaults() {
    form.setValue('brandColorPrimary', BNB_COLORS.primary);
    form.setValue('brandColorSecondary', BNB_COLORS.secondary);
    form.setValue('brandColorAccent', BNB_COLORS.accent);
    form.setValue('brandFontHeading', 'Playfair Display');
    form.setValue('brandFontBody', 'Inter');
  }

  if (loading) {
    return (
      <SettingsLayout title="Branding" description="Customize your colors, fonts, and logo">
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
    <SettingsLayout title="Branding" description="Customize your colors, fonts, and logo">
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
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Quick Apply Defaults */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">Use BNB Default Theme</h3>
                  <p className="text-sm text-muted-foreground">
                    Apply our recommended color palette and fonts
                  </p>
                </div>
                <Button type="button" variant="outline" onClick={applyBNBDefaults}>
                  <Palette className="mr-2 h-4 w-4" />
                  Apply Defaults
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Logo Upload */}
          <Card>
            <CardContent className="pt-6">
              <Label className="text-base font-semibold mb-4 block">Logo</Label>
              <div className="space-y-4">
                <div className="flex items-center gap-6">
                  <div className="relative h-20 w-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden border-2 border-border">
                    {logoFile ? (
                      <Image
                        src={URL.createObjectURL(logoFile)}
                        alt="Logo preview"
                        fill
                        className="object-cover"
                      />
                    ) : existingLogoUrl ? (
                      <Image
                        src={existingLogoUrl}
                        alt="Logo"
                        fill
                        className="object-cover"
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 space-y-2">
                    <Label htmlFor="logo-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-border rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                        <Upload className="h-5 w-5 mx-auto mb-2 text-muted-foreground" />
                        <p className="text-sm font-medium">
                          {logoFile || existingLogoUrl ? 'Change logo' : 'Upload logo'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 5MB</p>
                      </div>
                    </Label>
                    <Input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => handleFileSelect(e.target.files?.[0] || null)}
                    />

                    {(logoFile || existingLogoUrl) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setLogoFile(null);
                          setExistingLogoUrl(null);
                        }}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remove
                      </Button>
                    )}
                  </div>
                </div>

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Or enter logo URL</FormLabel>
                      <FormControl>
                        <Input placeholder="https://example.com/logo.png" {...field} />
                      </FormControl>
                      <FormDescription>Alternatively, enter a URL to your logo image</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>

          {/* Color Palette */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Color Palette</h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="brandColorPrimary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Primary Color</FormLabel>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        className="w-16 h-10" 
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                      <FormControl>
                        <Input 
                          placeholder="#B06F64" 
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>Main brand color</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brandColorSecondary"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Secondary Color</FormLabel>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        className="w-16 h-10" 
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                      <FormControl>
                        <Input 
                          placeholder="#CA8D80" 
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>Secondary color</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brandColorAccent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Accent Color</FormLabel>
                    <div className="flex gap-2">
                      <Input 
                        type="color" 
                        className="w-16 h-10" 
                        value={field.value || ''}
                        onChange={field.onChange}
                      />
                      <FormControl>
                        <Input 
                          placeholder="#FFB09E" 
                          {...field}
                        />
                      </FormControl>
                    </div>
                    <FormDescription>Accent/highlight color</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Typography */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Typography</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="brandFontHeading"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Heading Font</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select heading font" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABLE_FONTS.heading.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Font for headings and titles</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="brandFontBody"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Body Font</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select body font" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {AVAILABLE_FONTS.body.map((font) => (
                          <SelectItem key={font.value} value={font.value}>
                            {font.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormDescription>Font for body text and paragraphs</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Preview Section */}
          <Card>
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-4">Preview</h3>
              <div
                className="p-6 border rounded-lg"
                style={{
                  backgroundColor: form.watch('brandColorPrimary') || 'hsl(var(--muted))',
                  color: form.watch('brandColorPrimary')
                    ? 'hsl(var(--primary-foreground))'
                    : 'hsl(var(--foreground))',
                }}
              >
                <h2
                  style={{
                    fontFamily: form.watch('brandFontHeading') || 'inherit',
                    fontSize: '24px',
                    marginBottom: '8px',
                  }}
                >
                  Your Business Name
                </h2>
                <p
                  style={{
                    fontFamily: form.watch('brandFontBody') || 'inherit',
                  }}
                >
                  This is how your branding will look on your booking page.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button type="submit" disabled={saving || uploadingLogo}>
              {saving || uploadingLogo ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </Form>
    </SettingsLayout>
  );
}
