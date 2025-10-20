'use client';

import { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface LocationData {
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  latitude?: number;
  longitude?: number;
}

interface LocationAutocompleteProps {
  onLocationSelect: (location: LocationData) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  defaultAddress?: string;
}

interface NominatimResult {
  display_name: string;
  place_rank: number;
  importance: number;
  address: {
    house_number?: string;
    road?: string;
    house_name?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    subdistrict?: string;
    municipality?: string;
    district?: string;
    hamlet?: string;
    locality?: string;
    state?: string;
    province?: string;
    region?: string;
    administrative?: string;
    county?: string;
    postcode?: string;
    postal_code?: string;
    country?: string;
    country_code?: string;
  };
  lat: string;
  lon: string;
}

export function LocationAutocomplete({
  onLocationSelect,
  placeholder = 'Start typing your address...',
  className,
  disabled = false,
  defaultAddress = '',
}: LocationAutocompleteProps) {
  const [query, setQuery] = useState(defaultAddress);
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Debounce search
  useEffect(() => {
    if (query.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeoutId = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [query]);

  // Handle clicks outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        inputRef.current &&
        !inputRef.current.contains(event.target as Node) &&
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const searchLocations = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      // Try with different search strategies for better results
      const searchUrl =
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&` +
        `q=${encodeURIComponent(searchQuery)}&` +
        `limit=15&` +
        `addressdetails=1&` +
        `extratags=1`;

      const response = await fetch(searchUrl);

      if (response.ok) {
        const results: NominatimResult[] = await response.json();
        // Sort by importance (higher importance first) and place rank
        const sortedResults = results.sort((a, b) => {
          // Prioritize by place rank (lower number = more important)
          if (a.place_rank !== b.place_rank) {
            return a.place_rank - b.place_rank;
          }
          // Then by importance
          return b.importance - a.importance;
        });
        setSuggestions(sortedResults);
        setShowSuggestions(true);
        setSelectedIndex(-1);
      }
    } catch (error) {
      console.error('Location search failed:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  const parseLocationData = (result: NominatimResult): LocationData => {
    const { address, display_name } = result;

    // Smart address parsing - try to extract meaningful parts from display_name
    // This handles cases where address fields are incomplete
    const displayParts = display_name.split(',').map((part) => part.trim());

    // Build street address (try multiple address components)
    const streetParts = [];
    if (address.house_number) streetParts.push(address.house_number);
    if (address.road) streetParts.push(address.road);
    if (address.house_name) streetParts.push(address.house_name);
    if (address.suburb) streetParts.push(address.suburb);
    if (address.neighbourhood) streetParts.push(address.neighbourhood);
    const streetAddress = streetParts.join(' ');

    // Smart city detection - try address fields first, then fallback to display_name parsing
    let city =
      address.city ||
      address.town ||
      address.village ||
      address.subdistrict ||
      address.municipality ||
      address.district ||
      address.hamlet ||
      address.locality ||
      '';

    // If no city found in address fields, try to extract from display_name
    if (!city && displayParts.length > 1) {
      // Usually city is the first or second part
      city = displayParts[0] || displayParts[1] || '';
    }

    // Smart state detection
    let state =
      address.state ||
      address.province ||
      address.region ||
      address.administrative ||
      address.county ||
      '';

    // If no state found in address fields, try to extract from display_name
    if (!state && displayParts.length > 2) {
      // State is usually in the middle parts
      state = displayParts[1] || displayParts[2] || '';
    }

    // ZIP code detection
    const zipCode = address.postcode || address.postal_code || '';

    // Country detection
    const country =
      address.country ||
      (displayParts.length > 0 ? displayParts[displayParts.length - 1] : '') ||
      '';

    // If we still don't have a city, use the first part of display_name
    if (!city) {
      city = displayParts[0] || '';
    }

    // If we still don't have an address, use city or first meaningful part
    const finalAddress = streetAddress || city || displayParts[0] || '';

    return {
      address: finalAddress,
      city: city,
      state: state,
      zipCode: zipCode,
      country: country,
      latitude: parseFloat(result.lat),
      longitude: parseFloat(result.lon),
    };
  };

  const handleSuggestionSelect = (suggestion: NominatimResult) => {
    const locationData = parseLocationData(suggestion);
    setQuery(suggestion.display_name);
    setShowSuggestions(false);
    onLocationSelect(locationData);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionSelect(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedIndex(-1);
        break;
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    if (e.target.value.length < 3) {
      setShowSuggestions(false);
    }
  };

  return (
    <div className={cn('relative w-full', className)}>
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="pl-10 pr-10"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
        {!isLoading && query.length >= 3 && (
          <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        )}
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <Card
          ref={suggestionsRef}
          className="absolute z-50 w-full mt-1 max-h-64 overflow-y-auto border shadow-lg"
        >
          <div className="p-1">
            {suggestions.map((suggestion, index) => {
              const locationData = parseLocationData(suggestion);
              const isSelected = index === selectedIndex;

              return (
                <Button
                  key={`${suggestion.lat}-${suggestion.lon}`}
                  variant="ghost"
                  className={cn(
                    'w-full justify-start h-auto p-3 text-left',
                    isSelected && 'bg-primary/10 text-primary'
                  )}
                  onClick={() => handleSuggestionSelect(suggestion)}
                >
                  <div className="flex items-start gap-3">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {locationData.city || locationData.address || 'Location'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {[locationData.state, locationData.zipCode].filter(Boolean).join(', ')}
                        {locationData.state && locationData.zipCode && locationData.country && ', '}
                        {locationData.country}
                      </p>
                      {locationData.address && locationData.address !== locationData.city && (
                        <p className="text-xs text-muted-foreground truncate">
                          {locationData.address}
                        </p>
                      )}
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </Card>
      )}

      {/* No results message */}
      {showSuggestions && query.length >= 3 && suggestions.length === 0 && !isLoading && (
        <Card className="absolute z-50 w-full mt-1 border shadow-lg">
          <div className="p-4 text-center">
            <MapPin className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              No locations found. Try a different search term.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}

// Helper component for manual address entry fallback
export function ManualAddressForm({
  onLocationSubmit,
  defaultValues,
  className,
}: {
  onLocationSubmit: (location: LocationData) => void;
  defaultValues?: Partial<LocationData>;
  className?: string;
}) {
  const [formData, setFormData] = useState<LocationData>({
    address: defaultValues?.address || '',
    city: defaultValues?.city || '',
    state: defaultValues?.state || '',
    zipCode: defaultValues?.zipCode || '',
    country: defaultValues?.country || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLocationSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className={cn('space-y-4', className)}>
      <div>
        <label className="block text-sm font-medium mb-1">Street Address</label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="123 Main Street"
          required
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">City</label>
          <Input
            value={formData.city}
            onChange={(e) => setFormData((prev) => ({ ...prev, city: e.target.value }))}
            placeholder="City"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">State</label>
          <Input
            value={formData.state}
            onChange={(e) => setFormData((prev) => ({ ...prev, state: e.target.value }))}
            placeholder="State"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">ZIP Code</label>
          <Input
            value={formData.zipCode}
            onChange={(e) => setFormData((prev) => ({ ...prev, zipCode: e.target.value }))}
            placeholder="12345"
            required
          />
        </div>
      </div>

      <Button type="submit" className="w-full">
        Use This Address
      </Button>
    </form>
  );
}
