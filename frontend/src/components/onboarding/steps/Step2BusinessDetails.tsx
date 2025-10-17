'use client';

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
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
import { MapPin, Phone, Instagram, Navigation } from 'lucide-react';

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
  address: z.string().min(5, 'Please enter a complete address'),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  zipCode: z.string().min(5, 'Valid zip code is required'),
  country: z.string().default('US'),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
  phone: z.string().min(10, 'Valid phone number is required'),
  email: z.string().email('Valid email is required'),
  instagramHandle: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
  serviceSpecializations: z.array(z.string()).min(1, 'Select at least one service specialization'),
});

type BusinessDetailsFormValues = z.infer<typeof businessDetailsSchema>;

const serviceSpecializations = [
  'Hair Styling & Cutting',
  'Hair Coloring & Highlights',
  'Braids & Extensions',
  'Makeup Artistry',
  'Nail Services',
  'Lash Services',
  'Brow Services',
  'Skincare & Facials',
  'Waxing Services',
  'Bridal Services',
  'Special Event Styling',
  'Hair Treatments',
];

interface Step2BusinessDetailsProps {
  defaultValues?: Partial<BusinessDetailsFormValues>;
  accountType?: 'solo' | 'salon';
  onNext: (data: any) => Promise<void>;
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
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  const form = useForm<BusinessDetailsFormValues>({
    resolver: zodResolver(businessDetailsSchema),
    defaultValues: {
      country: 'US',
      serviceSpecializations: [],
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

  const handleUseCurrentLocation = async () => {
    setIsGettingLocation(true);
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        });
      });

      const { latitude, longitude } = position.coords;

      // Reverse geocode using Nominatim
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }

      const data = await response.json();
      const addr = data.address;

      // Fill in the form with the geocoded address
      const road = addr.road || addr.street || '';
      const houseNumber = addr.house_number || '';
      const address = houseNumber ? `${houseNumber} ${road}` : road;

      form.setValue('address', address || addr.suburb || addr.neighbourhood || '');
      form.setValue('city', addr.city || addr.town || addr.village || addr.municipality || '');
      form.setValue('state', addr.state || addr.province || addr.region || '');
      form.setValue('zipCode', addr.postcode || '');
      form.setValue('country', addr.country || 'US');
      form.setValue('latitude', latitude);
      form.setValue('longitude', longitude);

      toast.success('Location detected successfully!', {
        description: 'Your address has been filled in automatically',
      });
    } catch (error: any) {
      console.error('Geolocation error:', error);
      if (error.code === 1) {
        toast.error('Location permission denied', {
          description: 'Please allow location access to use this feature',
        });
      } else if (error.code === 2) {
        toast.error('Location unavailable', {
          description: 'Please check your device settings',
        });
      } else if (error.code === 3) {
        toast.error('Location request timed out', {
          description: 'Please try again',
        });
      } else {
        toast.error('Failed to get your location', {
          description: 'Please enter your address manually',
        });
      }
    } finally {
      setIsGettingLocation(false);
    }
  };

  async function onSubmit(values: BusinessDetailsFormValues) {
    await onNext({
      businessName: values.businessName,
      tagline: values.tagline,
      businessType: values.businessType,
      city: values.city,
      state: values.state,
      zipCode: values.zipCode,
      country: values.country,
      address: values.address,
      phone: values.phone,
      email: values.email,
      website: values.website,
      instagramHandle: values.instagramHandle,
      description: values.description,
      serviceSpecializations: values.serviceSpecializations,
      yearsExperience: values.yearsExperience,
      latitude: values.latitude,
      longitude: values.longitude,
    });
  }

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
                          <SelectItem value="salon">Salon</SelectItem>
                          <SelectItem value="spa">Spa</SelectItem>
                          <SelectItem value="home-based">Home-Based</SelectItem>
                          <SelectItem value="mobile">Mobile Service</SelectItem>
                          <SelectItem value="studio">Studio</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
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
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Location Information
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleUseCurrentLocation}
                    disabled={isGettingLocation}
                    className="gap-2"
                  >
                    <Navigation className="h-4 w-4" />
                    {isGettingLocation ? 'Detecting...' : 'Use My Location'}
                  </Button>
                </div>

                {/* Manual Address Fields */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Street Address *</FormLabel>
                        <FormControl>
                          <Input placeholder="123 Main Street" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>City *</FormLabel>
                          <FormControl>
                            <Input placeholder="City" {...field} />
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
                            <Input placeholder="State" {...field} />
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
                          <FormLabel>ZIP Code *</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
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
                  <FormField
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
                  />

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
                  {serviceSpecializations.map((specialization) => (
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
                        {...field}
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
