'use client';

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Filter, X } from 'lucide-react';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { ServiceGrid } from '@/components/search/ServiceGrid';
import { SortDropdown, type SortOption } from '@/components/search/SortDropdown';
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
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <SearchBar
            onSearch={handleSearch}
            initialQuery={filters.query}
            initialLocation={
              filters.city && filters.state ? `${filters.city}, ${filters.state}` : ''
            }
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-24">
              <FilterSidebar
                filters={filters}
                onFiltersChange={handleFiltersChange}
                categories={categories}
              />
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1">
            {/* Mobile Filters & Sort */}
            <div className="flex items-center justify-between mb-6 lg:hidden">
              <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Filters
                    {activeFilterCount > 0 && (
                      <Badge variant="secondary" className="ml-1">
                        {activeFilterCount}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-80">
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
                <h1 className="text-2xl font-bold">
                  {filters.query ? `Results for "${filters.query}"` : 'Browse Services'}
                </h1>
                <p className="text-muted-foreground">
                  {loading ? 'Searching...' : `${total} service${total !== 1 ? 's' : ''} found`}
                </p>
              </div>

              {/* Desktop Sort */}
              <div className="hidden lg:block">
                <SortDropdown currentSort={sort} onSortChange={handleSortChange} />
              </div>
            </div>

            {/* Active Filters */}
            {activeFilterCount > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {filters.category && (
                  <Badge variant="secondary" className="gap-1">
                    Category:{' '}
                    {categories.find((c) => c.id === filters.category)?.name || 'Selected'}
                    <button
                      onClick={() => handleFiltersChange({ ...filters, category: undefined })}
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {filters.city && (
                  <Badge variant="secondary" className="gap-1">
                    {filters.city}
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          ...filters,
                          city: undefined,
                          state: undefined,
                        })
                      }
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                {(filters.priceMin || filters.priceMax) && (
                  <Badge variant="secondary" className="gap-1">
                    Price: ${filters.priceMin || 0} - ${filters.priceMax || '∞'}
                    <button
                      onClick={() =>
                        handleFiltersChange({
                          ...filters,
                          priceMin: undefined,
                          priceMax: undefined,
                        })
                      }
                      className="ml-1"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  Clear All
                </Button>
              </div>
            )}

            {/* Error State */}
            {error && (
              <div className="bg-destructive/10 text-destructive p-4 rounded-lg mb-6">{error}</div>
            )}

            {/* Services Grid */}
            <ServiceGrid services={services} loading={loading} showDistance={false} />

            {/* Pagination */}
            {!loading && total > 12 && (
              <div className="flex justify-center gap-2 mt-8">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  Previous
                </Button>
                <span className="flex items-center px-4">
                  Page {page} of {Math.ceil(total / 12)}
                </span>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={page >= Math.ceil(total / 12)}
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
