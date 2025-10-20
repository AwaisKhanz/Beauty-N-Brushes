'use client';

import { useState } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface SearchBarProps {
  onSearch: (query: string, location: string) => void;
  initialQuery?: string;
  initialLocation?: string;
  quickFilters?: { label: string; value: string }[];
  onQuickFilterClick?: (value: string) => void;
}

export function SearchBar({
  onSearch,
  initialQuery = '',
  initialLocation = '',
  quickFilters = [],
  onQuickFilterClick,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState(initialLocation);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query, location);
  };

  const handleClearQuery = () => {
    setQuery('');
  };

  const handleClearLocation = () => {
    setLocation('');
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Query Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="What service are you looking for?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-9 pr-8 h-12"
            />
            {query && (
              <button
                type="button"
                onClick={handleClearQuery}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Location Input */}
          <div className="relative sm:w-64">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="City or zip code"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="pl-9 pr-8 h-12"
            />
            {location && (
              <button
                type="button"
                onClick={handleClearLocation}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Search Button */}
          <Button
            type="submit"
            variant="dark"
            size="lg"
            className="h-12 px-8"
          >
            <Search className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Search</span>
          </Button>
        </div>
      </form>

      {/* Quick Filters */}
      {quickFilters.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {quickFilters.map((filter) => (
            <Badge
              key={filter.value}
              variant="outline"
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground transition-colors"
              onClick={() => onQuickFilterClick?.(filter.value)}
            >
              {filter.label}
            </Badge>
          ))}
        </div>
      )}
    </div>
  );
}

