'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Clock, DollarSign, Building2, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getServiceDetailRoute, getProviderProfileRoute } from '@/constants';
import type { PublicServiceResult } from '@/shared-types/service.types';

interface ServiceCardProps {
  service: PublicServiceResult;
  showDistance?: boolean;
}

export function ServiceCard({ service, showDistance }: ServiceCardProps) {
  return (
    <Card className="group hover:shadow-xl transition-all duration-300 overflow-hidden">
      {/* Service Image */}
      <Link
        href={getServiceDetailRoute(service.id)}
        className="block relative h-64 bg-muted overflow-hidden"
      >
        {service.featuredImageUrl ? (
          <Image
            src={service.featuredImageUrl}
            alt={service.title}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/10">
            <span className="text-4xl text-muted-foreground">💇</span>
          </div>
        )}

        {/* Provider Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant={service.providerIsSalon ? 'default' : 'secondary'}
            className="backdrop-blur-sm bg-white/90"
          >
            {service.providerIsSalon ? (
              <>
                <Building2 className="h-3 w-3 mr-1" />
                Salon
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                Solo
              </>
            )}
          </Badge>
        </div>

        {/* Distance Badge */}
        {showDistance && service.distance && (
          <div className="absolute top-3 right-3">
            <Badge variant="secondary" className="backdrop-blur-sm bg-white/90">
              {service.distance.toFixed(1)} mi
            </Badge>
          </div>
        )}
      </Link>

      <CardContent className="p-4 space-y-3">
        {/* Service Title */}
        <Link href={getServiceDetailRoute(service.id)}>
          <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-primary transition-colors">
            {service.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2">{service.description}</p>

        {/* Category */}
        <div className="flex items-center gap-2 text-sm">
          <Badge variant="outline">{service.category}</Badge>
          {service.subcategory && (
            <Badge variant="outline" className="text-xs">
              {service.subcategory}
            </Badge>
          )}
        </div>

        {/* Provider Info */}
        <Link
          href={getProviderProfileRoute(service.providerSlug)}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors"
        >
          {service.providerLogoUrl ? (
            <Image
              src={service.providerLogoUrl}
              alt={service.providerName}
              width={24}
              height={24}
              className="rounded-full object-cover"
            />
          ) : (
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {service.providerName.charAt(0)}
              </span>
            </div>
          )}
          <span className="font-medium">{service.providerName}</span>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0" />
          <span className="line-clamp-1">
            {service.providerCity}, {service.providerState}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-semibold">{service.providerRating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground">
            ({service.providerReviewCount}{' '}
            {service.providerReviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Price and Duration */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-1 text-foreground font-semibold">
            <DollarSign className="h-4 w-4" />
            <span>
              {service.priceType === 'fixed'
                ? `${service.currency} ${service.priceMin.toFixed(2)}`
                : service.priceType === 'range'
                  ? `${service.currency} ${service.priceMin.toFixed(2)} - ${service.priceMax?.toFixed(2)}`
                  : `From ${service.currency} ${service.priceMin.toFixed(2)}`}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{service.durationMinutes} min</span>
          </div>
        </div>

        {/* Book Now Button */}
        <Button variant="dark" size="sm" className="w-full" asChild>
          <Link href={getServiceDetailRoute(service.id)}>View Details</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
