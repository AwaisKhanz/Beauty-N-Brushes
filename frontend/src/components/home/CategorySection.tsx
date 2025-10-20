'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ArrowRight,
  Scissors,
  Palette,
  Hand,
  Eye,
  Sparkles,
  Heart,
  Flame,
  Users,
} from 'lucide-react';
import { ROUTES } from '@/constants';
import type { CategoryWithCount } from '@/shared-types/service.types';

interface CategorySectionProps {
  categories: CategoryWithCount[];
}

// Icon mapping for categories
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  hair: Scissors,
  makeup: Palette,
  nails: Hand,
  lashes: Eye,
  brows: Sparkles,
  skincare: Heart,
  waxing: Flame,
  'kids-teens': Users,
};

export function CategorySection({ categories }: CategorySectionProps) {
  const router = useRouter();

  const handleCategoryClick = (categorySlug: string) => {
    router.push(`${ROUTES.SEARCH}?category=${categorySlug}`);
  };

  // Show only essential categories (first 8)
  const essentialCategories = categories.filter((cat) => cat.serviceCount > 0).slice(0, 8);

  return (
    <section className="py-16 bg-muted/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Explore Beauty Services
          </h2>
          <p className="text-lg text-muted-foreground">
            Browse by category to find the perfect service for your needs
          </p>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-6xl mx-auto">
          {essentialCategories.map((category) => {
            const Icon = CATEGORY_ICONS[category.slug] || Sparkles;

            return (
              <Card
                key={category.id}
                className="group cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-300"
                onClick={() => handleCategoryClick(category.slug)}
              >
                <CardContent className="p-6 text-center space-y-3">
                  {/* Icon */}
                  <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-primary/10 to-accent/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-accent/20 transition-colors">
                    <Icon className="h-8 w-8 text-primary group-hover:scale-110 transition-transform" />
                  </div>

                  {/* Category Name */}
                  <h3 className="font-semibold text-lg group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>

                  {/* Service Count */}
                  <Badge variant="secondary" className="text-xs">
                    {category.serviceCount} {category.serviceCount === 1 ? 'Service' : 'Services'}
                  </Badge>

                  {/* Hover Arrow */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowRight className="h-5 w-5 mx-auto text-primary" />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* View All Button */}
        {categories.length > 8 && (
          <div className="text-center mt-8">
            <button
              onClick={() => router.push(ROUTES.SEARCH)}
              className="text-primary hover:underline font-semibold inline-flex items-center gap-2"
            >
              View All Categories
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
