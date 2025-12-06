'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
import { MapPin, Phone /* Instagram */ } from 'lucide-react';
import { LocationAutocomplete } from '@/components/location/LocationAutocomplete';
import { LocationData } from '@/shared-types/google-places.types';
import { BUSINESS_TYPES, SERVICE_SPECIALIZATIONS } from '../../../../../shared-constants';

const businessDetailsSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255),
  tagline: z
    .string()
    .max(100, 'Tagline must be at most 100 characters')
    .optional()
    .or(z.literal('')),
  businessType: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').max(500),
  yearsExperience: z.coerce
    .number()
    .min(0, 'Years must be 0 or more')
    .max(99, 'Must be less than 100')
    .optional(),
  // Google Places fields
  placeId: z.string().optional(),
  formattedAddress: z.string().optional(),
  addressComponents: z.array(z.unknown()).optional(),
  // Standard address fields
  addressLine1: z.string().min(5, 'Please enter a complete address'),
  addressLine2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().optional().or(z.literal('')),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  // instagramHandle: z.string().optional(), // Temporarily hidden
  website: z.string().url().optional().or(z.literal('')),
  serviceSpecializations: z.array(z.string()).min(1, 'Select at least one service specialization'),
});

type BusinessDetailsFormValues = z.infer<typeof businessDetailsSchema>;

interface Step2BusinessDetailsProps {
  defaultValues?: Partial<BusinessDetailsFormValues>;
  accountType?: 'solo' | 'salon';
  onNext: (data: BusinessDetailsFormValues) => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step2BusinessDetails({
  defaultValues,
  accountType = 'solo',
  onNext,
  onBack,
  isLoading,
}: Step2BusinessDetailsProps) {
  const [selectedSpecializations, setSelectedSpecializations] = useState<string[]>(
    defaultValues?.serviceSpecializations || []
  );

  const form = useForm<BusinessDetailsFormValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      businessName: '',
      tagline: '',
      businessType: '',
      description: '',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'US',
      phone: '',
      email: '',
      // instagramHandle: '', // Temporarily hidden
      website: '',
      serviceSpecializations: [],
      yearsExperience: undefined,
      latitude: undefined,
      longitude: undefined,
      ...defaultValues,
    },
  });

  useEffect(() => {
    if (defaultValues) {
      form.reset({ ...defaultValues, country: defaultValues.country || 'US' });
      if (defaultValues.serviceSpecializations) {
        setSelectedSpecializations(defaultValues.serviceSpecializations);
      }
    }
  }, [defaultValues, form]);

  const handleSpecializationToggle = (specialization: string) => {
    const updated = selectedSpecializations.includes(specialization)
      ? selectedSpecializations.filter((s) => s !== specialization)
      : [...selectedSpecializations, specialization];

    setSelectedSpecializations(updated);
    form.setValue('serviceSpecializations', updated);
  };

  const handleLocationSelect = (location: LocationData) => {
    // Update all address fields from Google Places data
    form.setValue('placeId', location.placeId);
    form.setValue('formattedAddress', location.formattedAddress);
    form.setValue('addressComponents', location.addressComponents as any);
    // Use addressLine1 or formattedAddress for the address field
    form.setValue('addressLine1', location.addressLine1 || location.formattedAddress || '');
    form.setValue('addressLine2', '');
    form.setValue('city', location.city);
    form.setValue('state', location.state);
    form.setValue('zipCode', location.zipCode ?? '');
    form.setValue('country', location.country);
    form.setValue('latitude', location.latitude);
    form.setValue('longitude', location.longitude);
  };

  const onSubmit = async (data: BusinessDetailsFormValues) => {
    try {
      console.log('📝 Form data being submitted:', data);
      await onNext(data);
    } catch (error) {
      console.error('❌ Error submitting business details:', error);
      // Assuming 'toast' is available globally or imported elsewhere
      // toast.error('Failed to save business details', {
      //   description:
      //     error instanceof Error
      //       ? error.message
      //       : 'An unexpected error occurred. Please try again.',
      // });
    }
  };

  const onError = (errors: any) => {
    console.error('❌ Form validation errors:', errors);
    // Assuming 'toast' is available globally or imported elsewhere
    // toast.error('Please fix the errors in the form', {
    //   description: 'Check the highlighted fields and try again.',
    // });
  };

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Business Details</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Tell us about your {accountType === 'solo' ? 'business' : 'salon'} so clients can find you
        </p>
      </div>

      <Card className="w-full">
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit, onError)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="businessName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter your business name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="businessType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Business Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="tagline"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tagline (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="e.g., 'Where Beauty Meets Excellence' or 'Your Beauty, Our Passion'"
                        maxLength={100}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      A short, catchy phrase that represents your brand (max 100 characters)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Business Description *</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe your business, specialties, and what makes you unique..."
                        className="min-h-[100px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      This will help clients understand what you offer
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Location Information
                </h3>

                {/* Google Places Autocomplete */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Business Address *
                    </label>
                    <LocationAutocomplete
                      onLocationSelect={handleLocationSelect}
                      defaultValue={defaultValues?.addressLine1 || ''}
                      placeholder="Start typing your business address..."
                      disabled={isLoading}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      Start typing to see suggestions, or use your current location
                    </p>
                  </div>

                  {/* Manual Address Fields (read-only, auto-filled) */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} readOnly className="bg-muted" />
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
                          <FormLabel>State *</FormLabel>
                          <FormControl>
                            <Input placeholder="State" {...field} readOnly className="bg-muted" />
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
                          <FormLabel>ZIP Code</FormLabel>
                          <FormControl>
                            <Input placeholder="12345 (optional)" {...field} />
                          </FormControl>
                          <FormDescription className="text-xs">
                            Auto-filled from address, or enter manually
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact Information
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number *</FormLabel>
                        <FormControl>
                          <Input placeholder="(555) 123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Business Email *</FormLabel>
                        <FormControl>
                          <Input placeholder="business@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Instagram Handle - Temporarily hidden */}
                  {/* <FormField
                    control={form.control}
                    name="instagramHandle"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Instagram className="h-4 w-4" />
                          Instagram Handle
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="@yourhandle" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  /> */}

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Website (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="https://yourwebsite.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Specializations *</h3>
                <p className="text-sm text-muted-foreground">
                  Select all services you offer to help clients find you
                </p>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {SERVICE_SPECIALIZATIONS.map((specialization) => (
                    <Button
                      key={specialization}
                      type="button"
                      variant={
                        selectedSpecializations.includes(specialization) ? 'default' : 'outline'
                      }
                      className="justify-start h-auto p-3"
                      onClick={() => handleSpecializationToggle(specialization)}
                    >
                      {specialization}
                    </Button>
                  ))}
                </div>
                {form.formState.errors.serviceSpecializations && (
                  <p className="text-sm text-destructive">
                    {form.formState.errors.serviceSpecializations.message}
                  </p>
                )}
              </div>

              <FormField
                control={form.control}
                name="yearsExperience"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Years of Experience (Optional)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        min="0"
                        max="99"
                        value={field.value ?? ''}
                        onChange={(e) =>
                          field.onChange(e.target.value ? Number(e.target.value) : undefined)
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      How many years have you been working in the beauty industry?
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

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
  );
}
