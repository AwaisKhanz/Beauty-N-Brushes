'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { ArrowLeft, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import {
  ServiceCreationWizard,
  ServiceWizardData,
} from '@/components/services/ServiceCreationWizard';

export default function CreateServicePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const editServiceId = searchParams.get('edit');
  const isEdit = Boolean(editServiceId);

  const [loading, setLoading] = useState(isEdit);
  const [error, setError] = useState('');
  const [initialData, setInitialData] = useState<Partial<ServiceWizardData> | undefined>(undefined);

  // Fetch service data for editing
  useEffect(() => {
    if (isEdit && editServiceId) {
      fetchService();
    }
  }, [isEdit, editServiceId]);

  async function fetchService() {
    try {
      setLoading(true);
      setError('');

      const response = await api.services.getById(editServiceId!);
      const serviceData = response.data.service;

      // Populate wizard with existing data
      setInitialData({
        title: serviceData.title,
        description: serviceData.description,
        category: serviceData.category?.slug || '',
        subcategory: serviceData.subcategory?.slug || '',
        // Template tracking
        createdFromTemplate: serviceData.createdFromTemplate || false,
        templateId: serviceData.templateId || undefined,
        templateName: serviceData.templateName || undefined,
        priceMin: Number(serviceData.priceMin),
        priceMax: serviceData.priceMax ? Number(serviceData.priceMax) : 0,
        priceType: serviceData.priceType as 'fixed' | 'range' | 'starting_at',
        durationMinutes: serviceData.durationMinutes,
        depositType: serviceData.depositType as 'percentage' | 'fixed',
        depositAmount: Number(serviceData.depositAmount),
        hashtags: [],
        keywords: [],
        media:
          serviceData.media?.map((media) => ({
            url: media.fileUrl,
            thumbnailUrl: media.thumbnailUrl || media.fileUrl,
            mediaType: media.mediaType as 'image' | 'video',
            caption: media.caption || '',
            isFeatured: media.isFeatured || false,
            displayOrder: media.displayOrder,
          })) || [],
        addons:
          serviceData.addons?.map((addon) => ({
            name: addon.addonName,
            description: addon.addonDescription || '',
            price: Number(addon.addonPrice),
            duration: addon.addonDurationMinutes,
          })) || [],
        variations: [],
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load service');
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete(data: ServiceWizardData) {
    try {
      // Transform wizard data to API format
      const serviceData = {
        title: data.title,
        description: data.description,
        category: data.category,
        subcategory: data.subcategory,
        priceMin: data.priceMin,
        priceMax: data.priceMax,
        priceType: data.priceType,
        durationMinutes: data.durationMinutes,
        depositType: data.depositType,
        depositAmount: data.depositAmount,
        addons: data.addons,
        // Template tracking
        createdFromTemplate: data.createdFromTemplate,
        templateId: data.templateId,
        templateName: data.templateName,
      };

      if (isEdit && editServiceId) {
        // Update existing service
        await api.services.update(editServiceId, serviceData);

        // Update media if provided
        if (data.media && data.media.length > 0) {
          const mediaUrls = data.media.map((media) => ({
            url: media.url,
            thumbnailUrl: media.thumbnailUrl || media.url,
            mediaType: media.mediaType,
            caption: media.caption,
            displayOrder: media.displayOrder,
            isFeatured: media.isFeatured,
          }));

          await api.services.saveMedia(editServiceId, { mediaUrls });
        }

        toast.success('Service updated successfully!', {
          description: 'Your changes have been saved',
        });
      } else {
        // Create new service
        const serviceResponse = await api.services.create(serviceData);
        const serviceId = serviceResponse.data?.service?.id;

        if (!serviceId) {
          throw new Error('Failed to create service');
        }

        // Upload media if provided
        if (data.media && data.media.length > 0) {
          const mediaUrls = data.media.map((media) => ({
            url: media.url,
            thumbnailUrl: media.thumbnailUrl || media.url,
            mediaType: media.mediaType,
            caption: media.caption,
            displayOrder: media.displayOrder,
            isFeatured: media.isFeatured,
          }));

          await api.services.saveMedia(serviceId, { mediaUrls });
        }

        toast.success('Service created successfully!', {
          description: 'Your service is now live and ready for bookings',
        });
      }

      router.push('/provider/services');
    } catch (error: unknown) {
      console.error(`Error ${isEdit ? 'updating' : 'creating'} service:`, error);
      toast.error(`Failed to ${isEdit ? 'update' : 'create'} service`, {
        description: extractErrorMessage(error) || 'Please try again',
      });
      throw error; // Re-throw to let wizard handle the error state
    }
  }

  // Loading state for edit mode
  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-8 space-y-6">
        <Skeleton className="h-10 w-32" />
        <div className="text-center space-y-4">
          <Skeleton className="h-10 w-64 mx-auto" />
          <Skeleton className="h-6 w-96 mx-auto" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      </div>
    );
  }

  // Error state for edit mode
  if (error) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>

        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {error}
            <Button variant="outline" size="sm" onClick={fetchService} className="ml-4">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <ServiceCreationWizard onComplete={handleComplete} initialData={initialData} isEdit={isEdit} />
  );
}
