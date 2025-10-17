'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  Plus,
  X,
  Clock,
  DollarSign,
  Package,
  Loader2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { ServiceMediaUpload } from '@/components/services/ServiceMediaUpload';

const serviceSchema = z.object({
  title: z.string().min(3, 'Service title must be at least 3 characters').max(255),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  category: z.string().min(1, 'Please select a category'),
  subcategory: z.string().optional(),
  priceMin: z.number().min(1, 'Price must be at least $1'),
  priceMax: z.number().optional(),
  priceType: z.enum(['fixed', 'range', 'starting_at']),
  durationMinutes: z.number().min(15, 'Duration must be at least 15 minutes'),
  depositRequired: z.boolean().default(true),
  depositType: z.enum(['percentage', 'fixed']),
  depositAmount: z.number().min(1, 'Deposit amount must be at least $1'),
  addons: z
    .array(
      z.object({
        name: z.string().min(2, 'Add-on name must be at least 2 characters'),
        description: z.string().optional(),
        price: z.number().min(0, 'Price must be positive'),
        duration: z.number().min(0, 'Duration must be positive'),
      })
    )
    .optional(),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const serviceCategories = [
  {
    id: 'hair',
    name: 'Hair Services',
    subcategories: [
      'Hair Styling & Cutting',
      'Hair Coloring & Highlights',
      'Braids & Extensions',
      'Hair Treatments',
      'Wedding Hairstyles',
      'Special Occasion Styling',
    ],
  },
  {
    id: 'makeup',
    name: 'Makeup Services',
    subcategories: [
      'Bridal Makeup',
      'Special Events',
      'Everyday Makeup',
      'Photoshoot Makeup',
      'SFX Makeup',
    ],
  },
  {
    id: 'nails',
    name: 'Nail Services',
    subcategories: ['Manicure', 'Pedicure', 'Nail Art', 'Gel Extensions', 'Acrylic Nails'],
  },
  {
    id: 'lashes',
    name: 'Lash Services',
    subcategories: ['Lash Extensions', 'Lash Lifts', 'Lash Tints'],
  },
  {
    id: 'brows',
    name: 'Brow Services',
    subcategories: ['Brow Shaping', 'Brow Tinting', 'Microblading'],
  },
  {
    id: 'skincare',
    name: 'Skincare & Facials',
    subcategories: ['Facials', 'Skincare Treatments', 'Anti-aging Treatments'],
  },
];

export default function CreateServicePage() {
  const router = useRouter();
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [serviceFlow, setServiceFlow] = useState<'preset' | 'custom'>('preset');
  const [createdServiceId, setCreatedServiceId] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState<'details' | 'media'>('details');

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: {
      depositRequired: true,
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
        toast.success('AI description generated', {
          description: 'Review and edit the description as needed',
        });
      }
    } catch (error: unknown) {
      console.error('Error generating description:', error);
      toast.error('AI generation failed', {
        description: extractErrorMessage(error) || 'Please write the description manually',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  async function onSubmit(values: ServiceFormValues) {
    try {
      setIsSubmitting(true);

      // Create service
      const serviceResponse = await api.services.create(values);
      const serviceId = serviceResponse.data?.service?.id;

      if (!serviceId) {
        throw new Error('Failed to create service');
      }

      setCreatedServiceId(serviceId);

      toast.success('Service created successfully!', {
        description: 'Now add photos to showcase your work',
      });

      // Move to media upload step
      setCurrentStep('media');
    } catch (error: unknown) {
      console.error('Error saving service:', error);
      toast.error('Failed to create service', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleMediaUploaded = (urls: string[]) => {
    // Media URLs are automatically saved to service by the component
    console.log('Media uploaded:', urls);
  };

  const handleSkipMedia = () => {
    toast.success('Service published', {
      description: 'You can add photos later from the service edit page',
    });
    router.push('/provider/services');
  };

  const handleFinish = () => {
    toast.success('Service published with photos!', {
      description: 'Your service is now live and ready for bookings',
    });
    router.push('/provider/services');
  };

  const selectedCategoryData = serviceCategories.find((c) => c.id === selectedCategory);

  // Media Upload Step
  if (currentStep === 'media' && createdServiceId) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="mb-8">
          <div className="text-center">
            <Badge variant="secondary" className="gap-2 mb-4">
              <Package className="h-4 w-4" />
              Step 2 of 2
            </Badge>
            <h1 className="text-4xl font-heading font-bold mb-4">Add Service Photos</h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Showcase your work with high-quality photos. Services with photos get 3x more
              bookings!
            </p>
          </div>
        </div>

        <div className="space-y-6">
          <ServiceMediaUpload
            serviceId={createdServiceId}
            onMediaUploaded={handleMediaUploaded}
            maxFiles={10}
          />

          <div className="flex justify-between">
            <Button variant="outline" onClick={handleSkipMedia}>
              Skip for Now
            </Button>
            <Button onClick={handleFinish}>Finish & Publish</Button>
          </div>
        </div>
      </div>
    );
  }

  // Service Details Step
  return (
    <div className="max-w-4xl mx-auto py-8">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Button>

        <div className="text-center">
          <Badge variant="secondary" className="gap-2 mb-4">
            <Package className="h-4 w-4" />
            Step 1 of 2
          </Badge>
          <h1 className="text-4xl font-heading font-bold mb-4">Add a New Service</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Create a service listing with AI-powered descriptions and pricing suggestions
          </p>
        </div>
      </div>

      <Tabs
        value={serviceFlow}
        onValueChange={(value) => setServiceFlow(value as 'preset' | 'custom')}
      >
        <TabsList className="grid w-full grid-cols-2 mb-6">
          <TabsTrigger value="preset">Preset Service</TabsTrigger>
          <TabsTrigger value="custom">Custom Service</TabsTrigger>
        </TabsList>

        <TabsContent value="preset" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Choose Service Template</CardTitle>
              <CardDescription>
                Select from our curated service templates with AI-generated descriptions and pricing
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {serviceCategories.map((category) => (
                  <Card
                    key={category.id}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedCategory === category.id
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold mb-2">{category.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        {category.subcategories.length} service templates available
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {selectedCategoryData && (
            <Card>
              <CardHeader>
                <CardTitle>Select Service Type</CardTitle>
                <CardDescription>
                  Choose the specific service you offer in {selectedCategoryData.name}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {selectedCategoryData.subcategories.map((subcategory) => (
                    <Button
                      key={subcategory}
                      variant="outline"
                      className="justify-start h-auto p-4"
                      onClick={() => {
                        form.setValue('title', subcategory);
                        form.setValue('subcategory', subcategory);
                        generateAIDescription();
                      }}
                    >
                      <div className="text-left">
                        <div className="font-medium">{subcategory}</div>
                        <div className="text-xs text-muted-foreground">
                          Click to auto-fill details
                        </div>
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="custom" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create Custom Service</CardTitle>
              <CardDescription>
                Build your own service from scratch with AI assistance
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
                            <Select
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedCategory(value);
                              }}
                            >
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
                              disabled={isGenerating || !form.watch('title')}
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
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <DollarSign className="h-5 w-5" />
                      Pricing & Duration
                    </h3>

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
                          <FormLabel className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            Duration (minutes)
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

                  {/* Deposit Requirements */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Deposit Requirements</h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="depositType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Deposit Type</FormLabel>
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
                              {form.watch('depositType') === 'percentage' ? '(%)' : '($)'}
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

                  {/* Add-ons */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold">Add-ons & Variations</h3>
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

                    <div className="space-y-4">
                      {fields.map((field, index) => (
                        <Card key={field.id}>
                          <CardContent className="p-4">
                            <div className="flex items-start gap-4">
                              <div className="flex-1 space-y-3">
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
                                  name={`addons.${index}.description`}
                                  render={({ field }) => (
                                    <FormItem>
                                      <FormLabel>Description (Optional)</FormLabel>
                                      <FormControl>
                                        <Input placeholder="Brief description..." {...field} />
                                      </FormControl>
                                      <FormMessage />
                                    </FormItem>
                                  )}
                                />

                                <div className="grid grid-cols-2 gap-3">
                                  <FormField
                                    control={form.control}
                                    name={`addons.${index}.price`}
                                    render={({ field }) => (
                                      <FormItem>
                                        <FormLabel>Additional Price ($)</FormLabel>
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
                                        <FormLabel>Additional Time (min)</FormLabel>
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

                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => remove(index)}
                                className="text-destructive hover:text-destructive"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between pt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => router.back()}
                      className="gap-2"
                      disabled={isSubmitting}
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Cancel
                    </Button>

                    <Button type="submit" className="gap-2" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        <>
                          Next: Add Photos
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
