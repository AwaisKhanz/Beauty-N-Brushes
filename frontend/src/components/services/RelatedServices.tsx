'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Clock, MapPin, Star, User } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';

interface RelatedService {
  id: string;
  title: string;
  description: string;
  priceMin: number;
  priceMax?: number;
  priceType: string;
  currency: string;
  durationMinutes: number;
  category: {
    name: string;
  };
  subcategory?: {
    name: string;
  };
  provider: {
    id: string;
    businessName: string;
    slug: string;
    logoUrl?: string;
    user: {
      firstName: string;
      lastName: string;
    };
  };
  featuredImage?: {
    fileUrl: string;
  };
  bookingCount: number;
}

interface RelatedServicesProps {
  serviceId: string;
  currentServiceTitle: string;
}

export function RelatedServices({ serviceId, currentServiceTitle }: RelatedServicesProps) {
  const [services, setServices] = useState<RelatedService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRelatedServices = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await api.services.getRelated(serviceId);
        setServices(response.data.services);
      } catch (err: unknown) {
        setError(extractErrorMessage(err) || 'Failed to load related services');
      } finally {
        setLoading(false);
      }
    };

    if (serviceId) {
      loadRelatedServices();
    }
  }, [serviceId]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-2xl font-heading font-bold text-foreground">Related Services</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || services.length === 0) {
    return null; // Don't show section if no related services
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-heading font-bold text-foreground">Related Services</h3>
        <p className="text-sm text-muted-foreground">
          Discover more services like "{currentServiceTitle}"
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card
            key={service.id}
            className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-primary/10 hover:border-primary/20"
          >
            <Link href={`/services/${service.id}`} className="block">
              {/* Service Image */}
              <div className="relative h-48 overflow-hidden bg-muted">
                {service.featuredImage ? (
                  <Image
                    src={service.featuredImage.fileUrl}
                    alt={service.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                    sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
                    <span className="text-4xl font-bold text-primary/60">
                      {service.title.charAt(0)}
                    </span>
                  </div>
                )}

                {/* Category Badge */}
                <div className="absolute top-3 left-3">
                  <Badge className="bg-background/90 backdrop-blur text-foreground border-primary/20">
                    {service.category.name}
                  </Badge>
                </div>
              </div>

              <CardContent className="p-4 space-y-3">
                {/* Service Title */}
                <h4 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-2">
                  {service.title}
                </h4>

                {/* Provider Info */}
                <div className="flex items-center gap-3">
                  {service.provider.logoUrl ? (
                    <Image
                      src={service.provider.logoUrl}
                      alt={service.provider.businessName}
                      width={32}
                      height={32}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <User className="h-4 w-4 text-primary" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {service.provider.businessName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {service.provider.user.firstName} {service.provider.user.lastName}
                    </p>
                  </div>
                </div>

                {/* Service Details */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{service.durationMinutes} min</span>
                    </div>
                    <div className="font-semibold text-primary">
                      {service.currency} {service.priceMin}
                      {service.priceType === 'range' &&
                        service.priceMax &&
                        ` - ${service.priceMax}`}
                    </div>
                  </div>

                  {service.bookingCount > 0 && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-accent text-accent" />
                      <span>{service.bookingCount} bookings</span>
                    </div>
                  )}
                </div>

                {/* Subcategory */}
                {service.subcategory && (
                  <Badge variant="outline" className="text-xs">
                    {service.subcategory.name}
                  </Badge>
                )}
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
}
