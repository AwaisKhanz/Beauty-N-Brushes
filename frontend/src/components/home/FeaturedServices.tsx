'use client';

import { ServiceCard } from '../search/ServiceCard';
import { Button } from '@/components/ui/button';
import { ArrowRight, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ROUTES } from '@/constants';
import type { PublicServiceResult } from '@/shared-types/service.types';

interface FeaturedServicesProps {
  services: PublicServiceResult[];
}

export function FeaturedServices({ services }: FeaturedServicesProps) {
  const router = useRouter();

  if (services.length === 0) {
    return null;
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="h-6 w-6 text-primary" />
              <h2 className="text-3xl md:text-4xl font-heading font-bold">Featured Services</h2>
            </div>
            <p className="text-muted-foreground">Popular services from top-rated professionals</p>
          </div>

          {/* View All Button - Desktop */}
          <Button
            variant="outline"
            className="hidden md:inline-flex"
            onClick={() => router.push(ROUTES.SEARCH)}
          >
            View All
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.slice(0, 6).map((service) => (
            <ServiceCard key={service.id} service={service} />
          ))}
        </div>

        {/* View All Button - Mobile */}
        <div className="mt-8 text-center md:hidden">
          <Button
            variant="outline"
            size="lg"
            onClick={() => router.push(ROUTES.SEARCH)}
            className="w-full sm:w-auto"
          >
            View All Services
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}
