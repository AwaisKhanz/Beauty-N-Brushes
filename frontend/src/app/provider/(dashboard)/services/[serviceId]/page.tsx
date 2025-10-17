'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import Link from 'next/link';
import Image from 'next/image';
import {
  ArrowLeft,
  Edit,
  DollarSign,
  Clock,
  Package,
  AlertCircle,
  Image as ImageIcon,
  Calendar,
  Star,
  Eye,
  Activity,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { GetServiceResponse } from '../../../../../../../shared-types';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [service, setService] = useState<GetServiceResponse['service'] | null>(null);

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
      setService(response.data.service);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load service');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <ServiceDetailSkeleton />;
  }

  if (error || !service) {
    return (
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Services
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back to Services
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <Link href={`/provider/services/${serviceId}/edit`}>
              <Edit className="h-4 w-4 mr-2" />
              Edit Service
            </Link>
          </Button>
          <Badge variant={service.isActive ? 'default' : 'secondary'}>
            {service.isActive ? 'Active' : 'Inactive'}
          </Badge>
        </div>
      </div>

      {/* Service Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl">{service.title}</CardTitle>
                  <CardDescription className="mt-2">
                    {service.category?.name || 'Uncategorized'}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{service.description}</p>
              </div>

              <Separator />

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Price</p>
                    <p className="font-semibold">
                      {service.priceMax
                        ? `$${service.priceMin}-$${service.priceMax}`
                        : `$${service.priceMin}`}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Duration</p>
                    <p className="font-semibold">{service.durationMinutes} min</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Deposit</p>
                    <p className="font-semibold">
                      {service.depositType === 'percentage'
                        ? `${service.depositAmount}%`
                        : `$${service.depositAmount}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Add-ons */}
              {service.addons && service.addons.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <h3 className="font-semibold mb-3">Add-ons Available</h3>
                    <div className="space-y-2">
                      {service.addons.map((addon) => (
                        <div
                          key={addon.id}
                          className="flex items-center justify-between p-3 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{addon.addonName}</p>
                            {addon.addonDescription && (
                              <p className="text-sm text-muted-foreground">
                                {addon.addonDescription}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-semibold">+${addon.addonPrice}</p>
                            {addon.addonDurationMinutes > 0 && (
                              <p className="text-xs text-muted-foreground">
                                +{addon.addonDurationMinutes} min
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Service Media */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ImageIcon className="h-5 w-5" />
                Service Photos
              </CardTitle>
              <CardDescription>
                {service.media && service.media.length > 0
                  ? `${service.media.length} photo(s)`
                  : 'No photos uploaded yet'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {service.media && service.media.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {service.media.map((media) => (
                    <div key={media.id} className="aspect-square rounded-lg overflow-hidden border">
                      <Image
                        src={media.thumbnailUrl || media.mediaUrl}
                        alt={media.caption || service.title}
                        width={300}
                        height={300}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <p className="text-muted-foreground mb-4">No photos yet</p>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/provider/services/${serviceId}/edit`}>Add Photos</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Stats Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Total Bookings</span>
                </div>
                <span className="font-semibold">{service._count?.bookings || 0}</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Average Rating</span>
                </div>
                <span className="font-semibold">--</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Profile Views</span>
                </div>
                <span className="font-semibold">--</span>
              </div>

              <Separator />

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">Status</span>
                </div>
                <Badge variant={service.isActive ? 'default' : 'secondary'}>
                  {service.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Service Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <p className="text-muted-foreground">Created</p>
                <p className="font-medium">{new Date(service.createdAt).toLocaleDateString()}</p>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground">Last Updated</p>
                <p className="font-medium">{new Date(service.updatedAt).toLocaleDateString()}</p>
              </div>

              <Separator />

              <div>
                <p className="text-muted-foreground">Currency</p>
                <p className="font-medium">{service.currency}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/provider/services/${serviceId}/edit`}>
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Service
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start">
                <Eye className="h-4 w-4 mr-2" />
                Preview Public View
              </Button>

              <Button
                variant="outline"
                className="w-full justify-start"
                onClick={() => {
                  // TODO: Implement toggle active/inactive
                  toast.success(service.isActive ? 'Service deactivated' : 'Service activated');
                }}
              >
                <Activity className="h-4 w-4 mr-2" />
                {service.isActive ? 'Deactivate' : 'Activate'}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function ServiceDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-10 w-32" />
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-16" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-4 w-32 mt-2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
