'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, X, AlertCircle } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { ServiceGrid } from '@/components/search/ServiceGrid';
import { SortDropdown, type SortOption } from '@/components/search/SortDropdown';
import { SaveSearchButton } from '@/components/search/SaveSearchButton';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type {
  ServiceSearchFilters,
  PublicServiceResult,
  CategoryWithCount,
} from '@/shared-types/service.types';

export function SearchContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [services, setServices] = useState<PublicServiceResult[]>([]);
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Parse URL params into filters
  const [filters, setFilters] = useState<ServiceSearchFilters>({});
  const [sort, setSort] = useState<SortOption>({
    field: 'relevance',
    order: 'desc',
    label: 'Most Relevant',
  });
  const [page, setPage] = useState(1);

  // Sync filters from URL on mount and when searchParams change
  useEffect(() => {
    const urlFilters: ServiceSearchFilters = {};

    const query = searchParams.get('q');
    const category = searchParams.get('category');
    const city = searchParams.get('city');
    const state = searchParams.get('state');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');

    if (query) urlFilters.query = query;
    if (category) urlFilters.category = category;
    if (city) urlFilters.city = city;
    if (state) urlFilters.state = state;
    if (minPrice) urlFilters.priceMin = parseFloat(minPrice);
    if (maxPrice) urlFilters.priceMax = parseFloat(maxPrice);

    setFilters(urlFilters);
    setPage(1);
  }, [searchParams]);

  // Load categories on mount
  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await api.services.getCategories();
        setCategories(response.data.categories);
      } catch (err) {
        console.error('Failed to load categories:', err);
      }
    }
    loadCategories();
  }, []);

  // Search services when filters change
  useEffect(() => {
    async function searchServices() {
      try {
        setLoading(true);
        setError(null);

        const response = await api.services.search({
          filters,
          sort: {
            field: sort.field,
            order: sort.order,
          },
          page,
          limit: 12,
        });

        setServices(response.data.services);
        setTotal(response.data.total);
      } catch (err) {
        console.error('Search error:', err);
        setError(extractErrorMessage(err) || 'Failed to search services');
      } finally {
        setLoading(false);
      }
    }

    searchServices();
  }, [filters, page, sort]);

  const handleFiltersChange = (newFilters: ServiceSearchFilters) => {
    setFilters(newFilters);
    setPage(1);

    // Update URL
    const params = new URLSearchParams();
    if (newFilters.query) params.set('q', newFilters.query);
    if (newFilters.category) params.set('category', newFilters.category);
    if (newFilters.city) params.set('city', newFilters.city);
    if (newFilters.state) params.set('state', newFilters.state);
    if (newFilters.priceMin) params.set('minPrice', newFilters.priceMin.toString());
    if (newFilters.priceMax) params.set('maxPrice', newFilters.priceMax.toString());

    router.push(`/search?${params.toString()}`, { scroll: false });
  };

  const handleSearch = (query: string, location: string) => {
    const newFilters = { ...filters, query };
    if (location) {
      // Parse location (assuming format: "City, State")
      const [city, state] = location.split(',').map((s) => s.trim());
      if (city) newFilters.city = city;
      if (state) newFilters.state = state;
    }
    handleFiltersChange(newFilters);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSort(newSort);
    setPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setPage(1);
    router.push('/search', { scroll: false });
  };

  const activeFilterCount = Object.keys(filters).length - (filters.query ? 1 : 0); // Don't count search query

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/5">
      {/* Search Header with Gradient Background */}
      <div className="border-b bg-gradient-to-br from-primary/5 via-accent/10 to-secondary/5 sticky top-0 z-10 backdrop-blur-sm bg-background/95">
        <div className="container mx-auto px-4 py-6">
          <SearchBar
            onSearch={handleSearch}
            initialQuery={filters.query}
            initialLocation={
              filters.city && filters.state ? `${filters.city}, ${filters.state}` : ''
            }
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-32">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filters & Sort Bar */}
            <div className="flex items-center justify-between mb-6 lg:hidden bg-background/80 backdrop-blur-sm rounded-lg p-3 border border-primary/10">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="gap-2 border-primary/20 hover:border-primary/40"
                  >
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="default" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80 overflow-y-auto">
                  <FilterSidebar
                    filters={filters}
                    onFiltersChange={(newFilters) => {
                      handleFiltersChange(newFilters);
                      setMobileFiltersOpen(false);
                    }}
                    categories={categories}
                  />
                </SheetContent>
              </Sheet>

              <SortDropdown currentSort={sort} onSortChange={handleSortChange} />
            </div>

            {/* Results Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-heading font-bold text-foreground mb-1">
                  {filters.query ? `Results for "${filters.query}"` : 'Browse Beauty Services'}
                </h1>
                <p className="text-muted-foreground text-lg">
                  {loading ? (
                    <span className="inline-flex items-center gap-2">
                      <span className="animate-pulse">Searching</span>
                      <span className="animate-bounce">...</span>
                    </span>
                  ) : (
                    `${total} service${total !== 1 ? 's' : ''} found`
                  )}
                </p>
              </div>

              {/* Desktop Sort & Save Search */}
              <div className="hidden lg:flex gap-2">
                {activeFilterCount > 0 && (
                  <SaveSearchButton
                    filters={{
                      category: filters.category,
                      city: filters.city,
                      state: filters.state,
                      priceMin: filters.priceMin,
                      priceMax: filters.priceMax,
                    }}
                  />
                )}
                <SortDropdown currentSort={sort} onSortChange={handleSortChange} />
              </div>
            </div>

            {/* Active Filters Pills */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
                <span className="text-sm font-medium text-muted-foreground">Active filters:</span>
                {filters.category && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                  >
                    Category:{' '}
                    {categories.find((c) => c.slug === filters.category)?.name || 'Selected'}
                    <button
                      onClick={() => handleFiltersChange({ ...filters, category: undefined })}
                      className="ml-1 hover:text-destructive transition-colors"
                      aria-label="Remove category filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.city && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                  >
                    📍 {filters.city}
                    {filters.state && `, ${filters.state}`}
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          ...filters,
                          city: undefined,
                          state: undefined,
                        })
                      }
                      className="ml-1 hover:text-destructive transition-colors"
                      aria-label="Remove location filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(filters.priceMin || filters.priceMax) && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                  >
                    Price: ${filters.priceMin || 0} - ${filters.priceMax || '∞'}
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          ...filters,
                          priceMin: undefined,
                          priceMax: undefined,
                        })
                      }
                      className="ml-1 hover:text-destructive transition-colors"
                      aria-label="Remove price filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.rating && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                  >
                    ⭐ {filters.rating}+ Stars
                    <button
                      onClick={() => handleFiltersChange({ ...filters, rating: undefined })}
                      className="ml-1 hover:text-destructive transition-colors"
                      aria-label="Remove rating filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.mobileService && (
                  <Badge
                    variant="secondary"
                    className="gap-1 bg-secondary/10 hover:bg-secondary/20 border-secondary/30"
                  >
                    📱 Mobile Service
                    <button
                      onClick={() => handleFiltersChange({ ...filters, mobileService: undefined })}
                      className="ml-1 hover:text-destructive transition-colors"
                      aria-label="Remove mobile service filter"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="text-destructive hover:text-destructive/90"
                >
                  Clear All Filters
                </Button>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 border border-destructive/20 text-destructive p-4 rounded-lg mb-6 flex items-center gap-3">
                <AlertCircle className="h-5 w-5 flex-shrink-0" />
                <p>{error}</p>
              </div>
            )}

            {/* Services Grid */}
            <ServiceGrid services={services} loading={loading} showDistance={false} />

            {/* Pagination */}
            {!loading && total > 12 && (
              <div className="flex items-center justify-center gap-3 mt-12 pb-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                  Previous
                </Button>
                <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border border-primary/10 rounded-lg">
                  <span className="text-sm font-medium text-muted-foreground">Page</span>
                  <span className="text-lg font-bold text-primary">{page}</span>
                  <span className="text-sm text-muted-foreground">of {Math.ceil(total / 12)}</span>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 12)}
                  className="border-primary/20 hover:border-primary/40 hover:bg-primary/5"
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
