'use client';

import { ServiceCard } from './ServiceCard';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Search } from 'lucide-react';
import type { PublicServiceResult } from '@/shared-types/service.types';

interface ServiceGridProps {
  services: PublicServiceResult[];
  loading?: boolean;
  showDistance?: boolean;
}

export function ServiceGrid({ services, loading, showDistance }: ServiceGridProps) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border-primary/10 animate-pulse">
            <Skeleton className="h-72 w-full bg-gradient-to-br from-primary/5 to-accent/5" />
            <CardContent className="p-5 space-y-3">
              <Skeleton className="h-7 w-3/4 bg-primary/10" />
              <Skeleton className="h-4 w-full bg-secondary/10" />
              <Skeleton className="h-4 w-5/6 bg-secondary/10" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-6 w-20 bg-accent/10" />
                <Skeleton className="h-6 w-24 bg-accent/10" />
              </div>
              <Skeleton className="h-10 w-full bg-primary/10 mt-4" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 via-accent/20 to-secondary/20 flex items-center justify-center mb-6 ring-8 ring-primary/5">
          <Search className="h-12 w-12 text-primary" />
        </div>
        <h3 className="text-2xl font-heading font-bold mb-3 text-foreground">No services found</h3>
        <p className="text-muted-foreground max-w-md text-lg leading-relaxed">
          Try adjusting your search filters or browse all services in different categories.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {services.map((service) => (
        <ServiceCard key={service.id} service={service} showDistance={showDistance} />
      ))}
    </div>
  );
}
