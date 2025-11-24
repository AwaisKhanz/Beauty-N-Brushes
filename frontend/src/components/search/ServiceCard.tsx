'use client';

import Image from 'next/image';
import Link from 'next/link';
import { MapPin, Star, Clock, DollarSign, Building2, User } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { getServiceDetailRoute, getProviderProfileRoute } from '@/constants';
import type { PublicServiceResult } from '@/shared-types/service.types';

interface ServiceCardProps {
  service: PublicServiceResult;
  showDistance?: boolean;
}

export function ServiceCard({ service, showDistance }: ServiceCardProps) {
  return (
    <Card className="group hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 overflow-hidden border-primary/10">
      {/* Service Image with Overlay */}
      <Link
        href={getServiceDetailRoute(service.id)}
        className="block relative h-72 bg-gradient-to-br from-primary/10 to-accent/10 overflow-hidden"
      >
        {service.featuredImageUrl ? (
          <>
            <Image
              src={service.featuredImageUrl}
              alt={service.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
            {/* Subtle overlay for better text readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 via-accent/10 to-secondary/10">
            <span className="text-6xl opacity-30">💇</span>
          </div>
        )}

        {/* Provider Type Badge */}
        <div className="absolute top-3 left-3">
          <Badge
            variant={service.providerIsSalon ? 'default' : 'secondary'}
            className={
              service.providerIsSalon ? 'bg-button-dark text-white' : 'bg-secondary text-white'
            }
          >
            {service.providerIsSalon ? (
              <>
                <Building2 className="h-3 w-3 mr-1" />
                Salon
              </>
            ) : (
              <>
                <User className="h-3 w-3 mr-1" />
                Solo Pro
              </>
            )}
          </Badge>
        </div>

        {/* Distance Badge */}
        {showDistance && service.distance && (
          <div className="absolute top-3 right-3">
            <Badge variant="accent" className="backdrop-blur-sm">
              {service.distance.toFixed(1)} mi
            </Badge>
          </div>
        )}
      </Link>

      <CardContent className="p-5 space-y-3">
        {/* Service Title */}
        <Link href={getServiceDetailRoute(service.id)}>
          <h3 className="font-heading font-bold text-xl line-clamp-2 group-hover:text-primary transition-colors leading-tight">
            {service.title}
          </h3>
        </Link>

        {/* Description */}
        <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
          {service.description}
        </p>

        {/* Category */}
        <div className="flex items-center gap-2 text-xs">
          <Badge variant="outline">{service.category}</Badge>
          {service.subcategory && <Badge variant="outline">{service.subcategory}</Badge>}
        </div>

        <Separator className="my-3" />

        {/* Provider Info */}
        <Link
          href={getProviderProfileRoute(service.providerSlug)}
          className="flex items-center gap-2 text-sm hover:text-primary transition-colors group/provider"
        >
          {service.providerLogoUrl ? (
            <Image
              src={service.providerLogoUrl}
              alt={service.providerName}
              width={32}
              height={32}
              className="rounded-full object-cover ring-2 ring-primary/10 group-hover/provider:ring-primary/30 transition-all"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center ring-2 ring-primary/10 group-hover/provider:ring-primary/30 transition-all">
              <span className="text-sm font-bold text-primary">
                {service.providerName.charAt(0)}
              </span>
            </div>
          )}
          <span className="font-semibold group-hover/provider:text-primary transition-colors">
            {service.providerName}
          </span>
        </Link>

        {/* Location */}
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4 flex-shrink-0 text-secondary" />
          <span className="line-clamp-1">
            {service.providerCity}, {service.providerState}
          </span>
        </div>

        {/* Rating */}
        <div className="flex items-center gap-2 text-sm">
          <div className="flex items-center gap-1 bg-accent/10 px-2 py-1 rounded-md">
            <Star className="h-4 w-4 fill-accent text-accent" />
            <span className="font-bold text-foreground">{service.providerRating.toFixed(1)}</span>
          </div>
          <span className="text-muted-foreground">
            ({service.providerReviewCount}{' '}
            {service.providerReviewCount === 1 ? 'review' : 'reviews'})
          </span>
        </div>

        {/* Price and Duration */}
        <div className="flex items-center justify-between pt-3 border-t border-primary/10">
          <div className="flex items-center gap-1.5 text-primary font-bold text-lg">
            <DollarSign className="h-5 w-5" />
            <span>
              {service.priceType === 'fixed'
                ? `${service.priceMin.toFixed(0)}`
                : service.priceType === 'range'
                  ? `${service.priceMin.toFixed(0)}-${service.priceMax?.toFixed(0)}`
                  : `${service.priceMin.toFixed(0)}+`}
            </span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted-foreground bg-secondary/10 px-2 py-1 rounded-md">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{service.durationMinutes} min</span>
          </div>
        </div>

        {/* Book Now Button */}
        <Button
          variant="dark"
          size="sm"
          className="w-full mt-2 bg-button-dark hover:bg-button-dark/90 text-white font-semibold"
          asChild
        >
          <Link href={getServiceDetailRoute(service.id)}>View Details & Book</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
