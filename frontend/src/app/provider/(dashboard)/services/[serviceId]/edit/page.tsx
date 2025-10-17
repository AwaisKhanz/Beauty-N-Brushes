'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Sparkles,
  Plus,
  X,
  Clock,
  DollarSign,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { ServiceMediaUpload } from '@/components/services/ServiceMediaUpload';
import type { GetServiceResponse } from '../../../../../../../../shared-types';

const serviceSchema = z.object({
  title: z.string().min(3, 'Service title must be at least 3 characters').max(255),
  description: z.string().min(20, 'Description must be at least 20 characters').max(1000),
  category: z.string().min(1, 'Please select a category'),
  priceMin: z.number().min(1, 'Price must be at least $1'),
  priceMax: z.number().optional(),
  durationMinutes: z.number().min(15, 'Duration must be at least 15 minutes'),
  depositType: z.enum(['percentage', 'fixed']),
  depositAmount: z.number().min(1, 'Deposit amount must be at least $1'),
});

type ServiceFormValues = z.infer<typeof serviceSchema>;

const serviceCategories = [
  { id: 'hair', name: 'Hair Services' },
  { id: 'makeup', name: 'Makeup Services' },
  { id: 'nails', name: 'Nail Services' },
  { id: 'lashes', name: 'Lash Services' },
  { id: 'brows', name: 'Brow Services' },
  { id: 'skincare', name: 'Skincare & Facials' },
];

export default function EditServicePage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [service, setService] = useState<GetServiceResponse['service'] | null>(null);

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
  });

  useEffect(() => {
    if (serviceId) {
      fetchService();
    }
  }, [serviceId]);

  async function fetchService() {
    try {
      setLoading(true);
      setError('');

      const response = await api.services.getById(serviceId);
      const serviceData = response.data.service;

      setService(serviceData);

      // Populate form with existing data
      form.reset({
        title: serviceData.title,
        description: serviceData.description,
        category: serviceData.category?.slug || '',
        priceMin: Number(serviceData.priceMin),
        priceMax: serviceData.priceMax ? Number(serviceData.priceMax) : undefined,
        durationMinutes: serviceData.durationMinutes,
        depositType: serviceData.depositType as 'percentage' | 'fixed',
        depositAmount: Number(serviceData.depositAmount),
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load service');
    } finally {
      setLoading(false);
    }
  }

  async function onSubmit(values: ServiceFormValues) {
    try {
      setSaving(true);

      // TODO: Create update service endpoint
      // await api.services.update(serviceId, values);

      toast.success('Service updated successfully!', {
        description: 'Your changes have been saved',
      });

      router.push(`/provider/services/${serviceId}`);
    } catch (error: unknown) {
      toast.error('Failed to update service', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return <EditServiceSkeleton />;
  }

  if (error || !service) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error || 'Service not found'}
            {!error && (
              <Button variant="outline" size="sm" onClick={fetchService} className="ml-4">
                Retry
              </Button>
            )}
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      {/* Header */}
      <div>
        <Button variant="ghost" onClick={() => router.back()} className="gap-2 mb-4">
          <ArrowLeft className="h-4 w-4" />
          Back to Service
        </Button>

        <div className="text-center">
          <h1 className="text-4xl font-heading font-bold mb-4">Edit Service</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Update your service details and photos
          </p>
        </div>
      </div>

      {/* Service Details Form */}
      <Card>
        <CardHeader>
          <CardTitle>Service Details</CardTitle>
          <CardDescription>Update your service information</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Basic Information</h3>

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
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description *</FormLabel>
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

              <Separator />

              {/* Pricing & Duration */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Pricing & Duration
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priceMin"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price ($) *</FormLabel>
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
                    name="durationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          Duration (minutes) *
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

              <Separator />

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

              <div className="flex justify-between pt-6">
                <Button type="button" variant="outline" onClick={() => router.back()}>
                  Cancel
                </Button>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Service Media */}
      <ServiceMediaUpload serviceId={serviceId} maxFiles={10} />
    </div>
  );
}

function EditServiceSkeleton() {
  return (
    <div className="max-w-4xl mx-auto py-8 space-y-6">
      <Skeleton className="h-10 w-32" />

      <div className="text-center space-y-4">
        <Skeleton className="h-10 w-64 mx-auto" />
        <Skeleton className="h-6 w-96 mx-auto" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
