'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Clock,
  DollarSign,
  Star,
  Building2,
  User,
  ChevronLeft,
  Share2,
  Heart,
  Sparkles,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { getProviderProfileRoute } from '@/constants';
import type { Service } from '@/shared-types/service.types';

export default function ServiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const serviceId = params.serviceId as string;

  const [service, setService] = useState<Service | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadService = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.services.getById(serviceId);
        setService(response.data.service);
      } catch (err: unknown) {
        setError(extractErrorMessage(err) || 'Failed to load service');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      loadService();
    }
  }, [serviceId]);

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4">
            <Skeleton className="h-8 w-32 mb-6" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-4">
                <Skeleton className="h-96 w-full" />
                <div className="grid grid-cols-4 gap-2">
                  {[...Array(4)].map((_, i) => (
                    <Skeleton key={i} className="h-24" />
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  if (error || !service) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-background py-8">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-2xl font-bold text-destructive mb-4">Service Not Found</h1>
            <p className="text-muted-foreground mb-6">{error || 'This service does not exist.'}</p>
            <Button onClick={() => router.back()}>Go Back</Button>
          </div>
        </div>
      </>
    );
  }

  const featuredImage = service.media.find((m) => m.isFeatured) || service.media[0];
  const galleryImages = service.media.filter((m) => m.id !== featuredImage?.id).slice(0, 4);

  return (
    <>
      <Header />
      <div className="min-h-screen bg-background">
        {/* Breadcrumb / Back Navigation */}
        <div className="border-b bg-background">
          <div className="container mx-auto px-4 py-4">
            <Button variant="ghost" onClick={() => router.back()} className="gap-2">
              <ChevronLeft className="h-4 w-4" />
              Back to Search
            </Button>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Image Gallery */}
              <div className="space-y-4">
                {/* Featured Image */}
                {featuredImage && (
                  <div className="relative h-96 rounded-lg overflow-hidden bg-muted">
                    <Image
                      src={featuredImage.fileUrl}
                      alt={service.title}
                      fill
                      className="object-cover"
                      sizes="(max-width: 1024px) 100vw, 66vw"
                      priority
                    />
                  </div>
                )}

                {/* Gallery Thumbnails */}
                {galleryImages.length > 0 && (
                  <div className="grid grid-cols-4 gap-2">
                    {galleryImages.map((media) => (
                      <div
                        key={media.id}
                        className="relative h-24 rounded-md overflow-hidden bg-muted cursor-pointer hover:opacity-75 transition-opacity"
                      >
                        <Image
                          src={media.fileUrl}
                          alt={media.caption || service.title}
                          fill
                          className="object-cover"
                          sizes="120px"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Service Details */}
              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-3xl font-heading mb-2">{service.title}</CardTitle>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{service.category.name}</Badge>
                        {service.subcategory && (
                          <Badge variant="outline" className="text-xs">
                            {service.subcategory.name}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="icon">
                        <Heart className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon">
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-muted-foreground leading-relaxed">{service.description}</p>

                  <Separator />

                  {/* Service Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Duration</p>
                        <p className="font-semibold">{service.durationMinutes} minutes</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <DollarSign className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm text-muted-foreground">Price</p>
                        <p className="font-semibold">
                          {service.priceType === 'fixed'
                            ? `${service.currency} ${service.priceMin}`
                            : service.priceType === 'range'
                              ? `${service.currency} ${service.priceMin} - ${service.priceMax}`
                              : `From ${service.currency} ${service.priceMin}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Deposit Info */}
                  {service.depositRequired && (
                    <div className="bg-accent/10 border border-accent/20 rounded-md p-4">
                      <p className="text-sm font-medium mb-1">Deposit Required</p>
                      <p className="text-sm text-muted-foreground">
                        {service.depositType === 'PERCENTAGE'
                          ? `${service.depositAmount}% of service price`
                          : `${service.currency} ${service.depositAmount} flat fee`}
                      </p>
                    </div>
                  )}

                  {/* Add-ons */}
                  {service.addons && service.addons.length > 0 && (
                    <>
                      <Separator />
                      <div>
                        <h3 className="font-semibold mb-3 flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-primary" />
                          Available Add-ons
                        </h3>
                        <div className="space-y-2">
                          {service.addons.map((addon) => (
                            <div
                              key={addon.id}
                              className="flex items-center justify-between p-3 bg-muted rounded-md"
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
                                <p className="font-semibold">
                                  +{service.currency} {addon.addonPrice}
                                </p>
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Provider Card */}
              {service.provider && (
                <Card>
                  <CardHeader>
                    <CardTitle>Provider</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Link
                      href={getProviderProfileRoute(service.provider.slug)}
                      className="block group"
                    >
                      <div className="flex items-center gap-3 mb-4">
                        {service.provider.logoUrl ? (
                          <Image
                            src={service.provider.logoUrl}
                            alt={service.provider.businessName}
                            width={64}
                            height={64}
                            className="rounded-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-2xl font-semibold text-primary">
                              {service.provider.businessName.charAt(0)}
                            </span>
                          </div>
                        )}

                        <div className="flex-1">
                          <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                            {service.provider.businessName}
                          </h3>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            {service.provider.user?.avatarUrl ? (
                              <Building2 className="h-4 w-4" />
                            ) : (
                              <User className="h-4 w-4" />
                            )}
                            <span>Professional</span>
                          </div>
                        </div>
                      </div>
                    </Link>

                    <Separator />

                    <Button variant="dark" className="w-full" asChild>
                      <Link href={getProviderProfileRoute(service.provider.slug)}>
                        View Full Profile
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Booking Card */}
              <Card className="border-primary/20">
                <CardHeader className="bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardTitle>Book This Service</CardTitle>
                  <CardDescription>Secure your appointment now</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Price</span>
                      <span className="font-semibold">
                        {service.currency} {service.priceMin}
                        {service.priceType === 'range' && ` - ${service.priceMax}`}
                      </span>
                    </div>
                    {service.depositRequired && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Deposit Required</span>
                        <span className="font-semibold">
                          {service.depositType === 'PERCENTAGE'
                            ? `${service.depositAmount}%`
                            : `${service.currency} ${service.depositAmount}`}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator />

                  <Button className="w-full" size="lg" variant="dark">
                    Book Now
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    Instant booking • Secure payment • Easy cancellation
                  </p>
                </CardContent>
              </Card>

              {/* Quick Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Quick Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span>{service.durationMinutes} minutes</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{service.provider?.slug && `View location on profile`}</span>
                  </div>
                  {service._count && service._count.bookings > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-accent fill-accent" />
                      <span>{service._count.bookings} bookings</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
