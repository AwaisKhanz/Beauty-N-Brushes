'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Palette, Type, RefreshCw } from 'lucide-react';
import { BRAND_COLORS } from '@/constants/colors';

const brandCustomizationSchema = z.object({
  brandColorPrimary: z.string().min(1, 'Primary color required'),
  brandColorSecondary: z.string().min(1, 'Secondary color required'),
  brandColorAccent: z.string().min(1, 'Accent color required'),
  brandFontHeading: z.string(),
  brandFontBody: z.string(),
});

type BrandCustomizationFormValues = z.infer<typeof brandCustomizationSchema>;

// Convert HSL to hex for color inputs
function hslToHex(hsl: string): string {
  const match = hsl.match(/hsl\((\d+)\s+(\d+)%\s+(\d+)%\)/);
  if (!match) return BRAND_COLORS.PRIMARY;

  const h = parseInt(match[1]);
  const s = parseInt(match[2]);
  const l = parseInt(match[3]);

  const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l / 100 - c / 2;

  let r, g, b;
  if (h >= 0 && h < 60) [r, g, b] = [c, x, 0];
  else if (h >= 60 && h < 120) [r, g, b] = [x, c, 0];
  else if (h >= 120 && h < 180) [r, g, b] = [0, c, x];
  else if (h >= 180 && h < 240) [r, g, b] = [0, x, c];
  else if (h >= 240 && h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (n: number) => {
    const hex = Math.round((n + m) * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

// Convert hex to HSL for text display
function hexToHsl(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0,
    s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }

  return `hsl(${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%)`;
}

const DEFAULT_COLORS = {
  primary: 'hsl(11 36% 55%)',
  secondary: 'hsl(12 36% 66%)',
  accent: 'hsl(18 100% 80%)',
};

const DEFAULT_COLORS_HEX = {
  primary: hslToHex('hsl(11 36% 55%)'),
  secondary: hslToHex('hsl(12 36% 66%)'),
  accent: hslToHex('hsl(18 100% 80%)'),
};

const FONT_OPTIONS = [
  { value: 'Playfair Display', label: 'Playfair Display', category: 'Elegant Serif' },
  { value: 'Inter', label: 'Inter', category: 'Modern Sans-Serif' },
  { value: 'Montserrat', label: 'Montserrat', category: 'Clean Sans-Serif' },
  { value: 'Lora', label: 'Lora', category: 'Readable Serif' },
  { value: 'Poppins', label: 'Poppins', category: 'Friendly Sans-Serif' },
];

interface Step4BrandCustomizationProps {
  defaultValues?: Partial<BrandCustomizationFormValues>;
  onNext: (data: BrandCustomizationFormValues) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step4BrandCustomization({
  defaultValues,
  onNext,
  onBack,
  isLoading,
}: Step4BrandCustomizationProps) {
  const form = useForm<BrandCustomizationFormValues>({
    resolver: zodResolver(brandCustomizationSchema),
    defaultValues: {
      brandColorPrimary: defaultValues?.brandColorPrimary || DEFAULT_COLORS.primary,
      brandColorSecondary: defaultValues?.brandColorSecondary || DEFAULT_COLORS.secondary,
      brandColorAccent: defaultValues?.brandColorAccent || DEFAULT_COLORS.accent,
      brandFontHeading: defaultValues?.brandFontHeading || 'Playfair Display',
      brandFontBody: defaultValues?.brandFontBody || 'Inter',
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({
        brandColorPrimary: defaultValues.brandColorPrimary || DEFAULT_COLORS.primary,
        brandColorSecondary: defaultValues.brandColorSecondary || DEFAULT_COLORS.secondary,
        brandColorAccent: defaultValues.brandColorAccent || DEFAULT_COLORS.accent,
        brandFontHeading: defaultValues.brandFontHeading || 'Playfair Display',
        brandFontBody: defaultValues.brandFontBody || 'Inter',
      });
    }
  }, [defaultValues, form]);

  const currentColors = form.watch([
    'brandColorPrimary',
    'brandColorSecondary',
    'brandColorAccent',
  ]);
  const currentFonts = form.watch(['brandFontHeading', 'brandFontBody']);

  const handleResetToDefaults = () => {
    form.setValue('brandColorPrimary', DEFAULT_COLORS.primary);
    form.setValue('brandColorSecondary', DEFAULT_COLORS.secondary);
    form.setValue('brandColorAccent', DEFAULT_COLORS.accent);
    form.setValue('brandFontHeading', 'Playfair Display');
    form.setValue('brandFontBody', 'Inter');
  };

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Brand Customization</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Personalize your booking page with custom colors and fonts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Form */}
        <div className="space-y-6">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Color Palette
              </CardTitle>
              <CardDescription>Choose colors that represent your brand</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onNext)} className="space-y-6">
                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="brandColorPrimary"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Primary Color</FormLabel>
                          <div className="flex items-center gap-3">
                            <FormControl>
                              <input
                                type="color"
                                value={
                                  field.value ? hslToHex(field.value) : DEFAULT_COLORS_HEX.primary
                                }
                                onChange={(e) => field.onChange(hexToHsl(e.target.value))}
                                className="h-12 w-20 rounded cursor-pointer border-2 border-border"
                              />
                            </FormControl>
                            <FormControl>
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-md"
                                placeholder="hsl(11 36% 55%)"
                              />
                            </FormControl>
                          </div>
                          <FormDescription>Main brand color for headings and CTAs</FormDescription>
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
                          <div className="flex items-center gap-3">
                            <FormControl>
                              <input
                                type="color"
                                value={
                                  field.value ? hslToHex(field.value) : DEFAULT_COLORS_HEX.secondary
                                }
                                onChange={(e) => field.onChange(hexToHsl(e.target.value))}
                                className="h-12 w-20 rounded cursor-pointer border-2 border-border"
                              />
                            </FormControl>
                            <FormControl>
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-md"
                                placeholder="hsl(12 36% 66%)"
                              />
                            </FormControl>
                          </div>
                          <FormDescription>Supporting elements and borders</FormDescription>
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
                          <div className="flex items-center gap-3">
                            <FormControl>
                              <input
                                type="color"
                                value={
                                  field.value ? hslToHex(field.value) : DEFAULT_COLORS_HEX.accent
                                }
                                onChange={(e) => field.onChange(hexToHsl(e.target.value))}
                                className="h-12 w-20 rounded cursor-pointer border-2 border-border"
                              />
                            </FormControl>
                            <FormControl>
                              <input
                                type="text"
                                value={field.value}
                                onChange={(e) => field.onChange(e.target.value)}
                                className="flex-1 px-3 py-2 border rounded-md"
                                placeholder="hsl(18 100% 80%)"
                              />
                            </FormControl>
                          </div>
                          <FormDescription>Highlights and buttons</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleResetToDefaults}
                      className="gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Reset to Defaults
                    </Button>
                  </div>

                  <div className="border-t pt-6 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                      <Type className="h-5 w-5" />
                      <h3 className="font-semibold">Typography</h3>
                    </div>

                    <FormField
                      control={form.control}
                      name="brandFontHeading"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Heading Font</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  <span className="font-medium">{font.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({font.category})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Font for titles and headings</FormDescription>
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
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {FONT_OPTIONS.map((font) => (
                                <SelectItem key={font.value} value={font.value}>
                                  <span className="font-medium">{font.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">
                                    ({font.category})
                                  </span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>Font for body text and descriptions</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button type="button" variant="outline" onClick={onBack} className="gap-2">
                      Back
                    </Button>

                    <Button type="submit" disabled={isLoading} className="gap-2">
                      {isLoading ? 'Saving...' : 'Continue'}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Live Preview</CardTitle>
              <CardDescription>See how your brand colors will look</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Mock Booking Card */}
              <div
                className="border-2 rounded-lg p-6 space-y-4"
                style={{ borderColor: currentColors[1] }}
              >
                <h2
                  className="text-2xl font-bold"
                  style={{
                    color: currentColors[0],
                    fontFamily: currentFonts[0],
                  }}
                >
                  Your Business Name
                </h2>
                <p
                  className="text-sm"
                  style={{
                    fontFamily: currentFonts[1],
                  }}
                >
                  This is how your service descriptions will appear to clients. The body text uses
                  your selected body font.
                </p>
                <Button
                  className="w-full"
                  style={{
                    backgroundColor: currentColors[2],
                    color: 'white',
                  }}
                  type="button"
                >
                  Book Now
                </Button>
              </div>

              {/* Color Swatches */}
              <div>
                <Label className="mb-3 block">Color Swatches</Label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-2">
                    <div
                      className="h-16 rounded-lg border-2"
                      style={{ backgroundColor: currentColors[0] }}
                    ></div>
                    <p className="text-xs text-center text-muted-foreground">Primary</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-16 rounded-lg border-2"
                      style={{ backgroundColor: currentColors[1] }}
                    ></div>
                    <p className="text-xs text-center text-muted-foreground">Secondary</p>
                  </div>
                  <div className="space-y-2">
                    <div
                      className="h-16 rounded-lg border-2"
                      style={{ backgroundColor: currentColors[2] }}
                    ></div>
                    <p className="text-xs text-center text-muted-foreground">Accent</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
