'use client';

import { useState, useEffect } from 'react';
import { X, Filter, Star, Building2, User, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { ServiceSearchFilters, CategoryWithCount } from '@/shared-types/service.types';

interface FilterSidebarProps {
  filters: ServiceSearchFilters;
  onFiltersChange: (filters: ServiceSearchFilters) => void;
  categories?: CategoryWithCount[];
  onClose?: () => void; // For mobile drawer
}

export function FilterSidebar({
  filters,
  onFiltersChange,
  categories = [],
  onClose,
}: FilterSidebarProps) {
  const [localFilters, setLocalFilters] = useState<ServiceSearchFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApplyFilters = () => {
    onFiltersChange(localFilters);
    onClose?.();
  };

  const handleClearAll = () => {
    const clearedFilters: ServiceSearchFilters = {};
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const activeFilterCount = Object.keys(localFilters).filter(
    (key) => localFilters[key as keyof ServiceSearchFilters] !== undefined
  ).length;

  return (
    <Card className="h-fit border-primary/10 shadow-sm">
      <CardHeader className="pb-3 bg-gradient-to-br from-primary/5 to-accent/5 border-b border-primary/10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-primary/10">
              <Filter className="h-5 w-5 text-primary" />
            </div>
            <CardTitle className="text-foreground">Filters</CardTitle>
            {activeFilterCount > 0 && (
              <Badge variant="default" className="ml-2">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6 pt-6">
        {/* Category Filter */}
        {categories.length > 0 && (
          <div className="space-y-3">
            <Label>Category</Label>
            <Select
              value={localFilters.category || 'all'}
              onValueChange={(value) =>
                setLocalFilters({ ...localFilters, category: value === 'all' ? undefined : value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.slug}>
                    {cat.name} ({cat.serviceCount})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Subcategory Filter */}
            {localFilters.category && (
              <Select
                value={localFilters.subcategory || 'all'}
                onValueChange={(value) =>
                  setLocalFilters({
                    ...localFilters,
                    subcategory: value === 'all' ? undefined : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="All Subcategories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Subcategories</SelectItem>
                  {categories
                    .find((cat) => cat.slug === localFilters.category)
                    ?.subcategories?.map((sub) => (
                      <SelectItem key={sub.id} value={sub.slug}>
                        {sub.name} ({sub.serviceCount})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <Separator />

        {/* Price Range Filter */}
        <div className="space-y-3">
          <Label>Price Range</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Input
                type="number"
                placeholder="Min"
                value={localFilters.priceMin || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    priceMin: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
            <div>
              <Input
                type="number"
                placeholder="Max"
                value={localFilters.priceMax || ''}
                onChange={(e) =>
                  setLocalFilters({
                    ...localFilters,
                    priceMax: e.target.value ? parseFloat(e.target.value) : undefined,
                  })
                }
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Rating Filter */}
        <div className="space-y-3">
          <Label>Minimum Rating</Label>
          <div className="space-y-2">
            {[5, 4, 3].map((rating) => (
              <button
                key={rating}
                onClick={() =>
                  setLocalFilters({
                    ...localFilters,
                    rating: localFilters.rating === rating ? undefined : rating,
                  })
                }
                className={`w-full flex items-center gap-2 p-2 rounded-md border transition-colors ${
                  localFilters.rating === rating
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex">
                  {[...Array(rating)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-accent text-accent" />
                  ))}
                </div>
                <span className="text-sm">& Up</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Distance Filter */}
        {localFilters.latitude && localFilters.longitude && (
          <>
            <div className="space-y-3">
              <Label>Distance (miles)</Label>
              <Slider
                value={[localFilters.radius || 200]}
                onValueChange={([value]) => setLocalFilters({ ...localFilters, radius: value })}
                max={500}
                min={1}
                step={5}
                className="py-4"
              />
              <div className="text-sm text-center text-muted-foreground">
                Within {localFilters.radius || 200} miles
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Provider Type Filter */}
        <div className="space-y-3">
          <Label>Provider Type</Label>
          <div className="space-y-2">
            <button
              onClick={() =>
                setLocalFilters({
                  ...localFilters,
                  isSalon: localFilters.isSalon === true ? undefined : true,
                })
              }
              className={`w-full flex items-center gap-2 p-3 rounded-md border transition-colors ${
                localFilters.isSalon === true
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <Building2 className="h-5 w-5" />
              <span className="text-sm font-medium">Salon / Business</span>
            </button>
            <button
              onClick={() =>
                setLocalFilters({
                  ...localFilters,
                  isSalon: localFilters.isSalon === false ? undefined : false,
                })
              }
              className={`w-full flex items-center gap-2 p-3 rounded-md border transition-colors ${
                localFilters.isSalon === false
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <User className="h-5 w-5" />
              <span className="text-sm font-medium">Solo Professional</span>
            </button>
          </div>
        </div>

        <Separator />

        {/* Mobile Service Filter */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-muted-foreground" />
            <Label htmlFor="mobile-service" className="cursor-pointer">
              Mobile Service Available
            </Label>
          </div>
          <Switch
            id="mobile-service"
            checked={localFilters.mobileService || false}
            onCheckedChange={(checked) =>
              setLocalFilters({
                ...localFilters,
                mobileService: checked || undefined,
              })
            }
          />
        </div>

        <Separator />

        {/* Action Buttons */}
        <div className="space-y-2">
          <Button onClick={handleApplyFilters} className="w-full" variant="dark">
            Apply Filters
          </Button>
          {activeFilterCount > 0 && (
            <Button onClick={handleClearAll} variant="outline" className="w-full">
              Clear All
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
