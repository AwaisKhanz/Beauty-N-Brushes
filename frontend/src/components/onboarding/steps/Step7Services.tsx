'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
import { Sparkles, Plus, X, Package, Upload } from 'lucide-react';
import { api } from '@/lib/api';
import { uploadService } from '@/lib/upload';

const serviceSchema = z.object({
  title: z.string().min(3, 'Service title must be at least 3 characters').max(255),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().optional(),
  priceMin: z.coerce.number().min(1, 'Price must be at least $1'),
  priceMax: z.coerce.number().optional(),
  priceType: z.enum(['fixed', 'range', 'starting_at']),
  durationMinutes: z.coerce.number().min(15, 'Duration must be at least 15 minutes'),
  depositType: z.enum(['percentage', 'fixed']),
  depositAmount: z.coerce.number().min(1, 'Deposit amount required'),
  addons: z
    .array(
      z.object({
        name: z.string().min(2, 'Add-on name required'),
        description: z.string().optional(),
        price: z.coerce.number().min(0, 'Price must be positive'),
        duration: z.coerce.number().min(0, 'Duration must be positive'),
      })
    )
    .optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const serviceCategories = [
  { id: 'hair', name: 'Hair Services' },
  { id: 'makeup', name: 'Makeup Services' },
  { id: 'nails', name: 'Nail Services' },
  { id: 'lashes', name: 'Lash Services' },
  { id: 'brows', name: 'Brow Services' },
  { id: 'skincare', name: 'Skincare & Facials' },
  { id: 'waxing', name: 'Waxing Services' },
];

interface Step7ServicesProps {
  onNext: () => Promise<void>;
  onBack: () => void;
  isLoading: boolean;
}

export function Step7Services({ onNext, onBack, isLoading }: Step7ServicesProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [servicePhoto, setServicePhoto] = useState<File | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      depositType: 'percentage',
      depositAmount: 50,
      priceType: 'fixed',
      durationMinutes: 60,
      addons: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'addons',
  });

  const generateAIDescription = async () => {
    const title = form.getValues('title');
    const category = form.getValues('category');

    if (!title || !category) {
      toast.error('Required fields missing', {
        description: 'Please enter a service title and select a category first',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const response = await api.services.generateDescription({
        title,
        category,
      });

      if (response.data?.description) {
        form.setValue('description', response.data.description);
      }
    } catch (error: any) {
      console.error('Error generating description:', error);
      toast.error('AI generation failed', {
        description:
          error.response?.data?.message ||
          'AI service description generation failed. Please write the description manually.',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePhotoUpload = (file: File | null) => {
    if (file && file.type.startsWith('image/')) {
      setServicePhoto(file);
    }
  };

  async function onSubmit(values: ServiceFormValues) {
    if (!servicePhoto) {
      toast.error('Service photo required', {
        description: 'Please upload at least one service photo',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const uploadedPhoto = await uploadService.uploadFile(servicePhoto, 'service');
      const serviceResponse = await api.services.create(values);
      const serviceId = serviceResponse.data?.service?.id;

      if (!serviceId) {
        throw new Error('Failed to create service');
      }

      await api.services.saveMedia(serviceId, {
        mediaUrls: [
          {
            url: uploadedPhoto.url,
            thumbnailUrl: uploadedPhoto.thumbnailUrl || uploadedPhoto.url,
          },
        ],
      });

      await onNext();
    } catch (error: any) {
      console.error('Error saving service:', error);
      toast.error('Failed to create service', {
        description: error.message || error.response?.data?.message || 'Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Create Your First Service</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Add at least one service to complete your profile and start accepting bookings
        </p>
      </div>

      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Service Details
          </CardTitle>
          <CardDescription>
            Create a service that showcases your skills and attracts clients
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Service Title *</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Hair Color & Cut" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Category *</FormLabel>
                        <Select onValueChange={field.onChange}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {serviceCategories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
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
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        Description *
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={generateAIDescription}
                          disabled={isGenerating || !form.watch('title') || !form.watch('category')}
                          className="gap-1"
                        >
                          {isGenerating ? (
                            <>
                              <Sparkles className="h-3 w-3 animate-spin" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <Sparkles className="h-3 w-3" />
                              AI Generate
                            </>
                          )}
                        </Button>
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe your service in detail..."
                          className="min-h-[120px]"
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Tell clients what to expect from your service
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Pricing & Duration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Pricing & Duration</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="priceType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="fixed">Fixed Price</SelectItem>
                            <SelectItem value="range">Price Range</SelectItem>
                            <SelectItem value="starting_at">Starting At</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="priceMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          {form.watch('priceType') === 'range' ? 'Min Price ($)' : 'Price ($)'}
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {form.watch('priceType') === 'range' && (
                    <FormField
                      control={form.control}
                      name="priceMax"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Price ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>

                <FormField
                  control={form.control}
                  name="durationMinutes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duration (minutes) *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Deposit Requirements */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Deposit Requirements</h3>
                <p className="text-sm text-muted-foreground">
                  Deposits are required for all bookings
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="depositType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deposit Type *</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="percentage">Percentage</SelectItem>
                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="depositAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>
                          Deposit Amount{' '}
                          {form.watch('depositType') === 'percentage' ? '(%)' : '($)'}*
                        </FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Service Photo */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Service Photo *</h3>
                <p className="text-sm text-muted-foreground">
                  Upload at least one photo that showcases this service
                </p>

                <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
                  {servicePhoto ? (
                    <div className="space-y-4">
                      <div className="relative inline-block">
                        <img
                          src={URL.createObjectURL(servicePhoto)}
                          alt="Service preview"
                          className="h-32 w-32 object-cover rounded-lg"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2"
                          onClick={() => setServicePhoto(null)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">{servicePhoto.name}</p>
                    </div>
                  ) : (
                    <label className="cursor-pointer">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm font-medium">Upload service photo</p>
                      <p className="text-xs text-muted-foreground mt-1">PNG, JPG up to 10MB</p>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handlePhotoUpload(e.target.files?.[0] || null)}
                      />
                    </label>
                  )}
                </div>
              </div>

              {/* Optional Add-ons */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">Add-ons (Optional)</h3>
                    <p className="text-sm text-muted-foreground">
                      Offer optional extras clients can select
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ name: '', description: '', price: 0, duration: 0 })}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    Add Add-on
                  </Button>
                </div>

                {fields.length > 0 && (
                  <div className="space-y-3">
                    {fields.map((field, index) => (
                      <Card key={field.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 grid grid-cols-3 gap-3">
                              <FormField
                                control={form.control}
                                name={`addons.${index}.name`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Add-on Name</FormLabel>
                                    <FormControl>
                                      <Input placeholder="e.g., Home Service" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`addons.${index}.price`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Price ($)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />

                              <FormField
                                control={form.control}
                                name={`addons.${index}.duration`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormLabel>Time (min)</FormLabel>
                                    <FormControl>
                                      <Input
                                        type="number"
                                        {...field}
                                        onChange={(e) => field.onChange(Number(e.target.value))}
                                      />
                                    </FormControl>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                            </div>

                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => remove(index)}
                              className="text-destructive hover:text-destructive mt-8"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>

              <div className="bg-accent/10 text-accent-foreground p-4 rounded-lg border border-accent/20 text-sm">
                <p className="font-medium mb-1">💡 Tip</p>
                <p>
                  You can add more services later from your dashboard. This first service helps
                  clients understand what you offer.
                </p>
              </div>

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={onBack} className="gap-2">
                  Back
                </Button>

                <Button
                  type="submit"
                  disabled={isSubmitting || !servicePhoto || isLoading}
                  className="gap-2"
                >
                  {isSubmitting || isLoading ? 'Creating Service...' : 'Continue'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
