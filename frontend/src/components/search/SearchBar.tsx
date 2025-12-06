import { useState, useEffect } from 'react';
import { Search, MapPin, X, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LocationAutocomplete } from '@/components/location/LocationAutocomplete';
import { LocationData } from '@/shared-types/google-places.types';
import { toast } from 'sonner';

interface SearchBarProps {
  onSearch: (
    query: string, 
    location: string, 
    lat?: number, 
    lng?: number,
    city?: string,
    state?: string,
    country?: string
  ) => void;
  initialQuery?: string;
  initialLocation?: string;
  initialCity?: string;
  initialState?: string;
  initialCountry?: string;
  initialLat?: number;
  initialLng?: number;
  quickFilters?: { label: string; value: string }[];
  onQuickFilterClick?: (value: string) => void;
}

export function SearchBar({
  onSearch,
  initialQuery = '',
  initialLocation = '',
  initialCity,
  initialState,
  initialCountry,
  initialLat,
  initialLng,
  quickFilters = [],
  onQuickFilterClick,
}: SearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationInput, setLocationInput] = useState(initialLocation);
  const [isLocating, setIsLocating] = useState(false);

  useEffect(() => {
    setQuery(initialQuery);
  }, [initialQuery]);

  useEffect(() => {
    setLocationInput(initialLocation);
  }, [initialLocation]);

  // Reconstruct location state from structured props when they change
  useEffect(() => {
    if (initialCity || initialState || initialCountry || (initialLat && initialLng)) {
      const reconstructedLocation: LocationData = {
        addressLine1: '',
        city: initialCity || '',
        state: initialState || '',
        country: initialCountry || '',
        formattedAddress: initialLocation,
        placeId: 'from-url',
        latitude: initialLat,
        longitude: initialLng,
        addressComponents: [],
        zipCode: '',
      };
      setLocation(reconstructedLocation);
    }
  }, [initialCity, initialState, initialCountry, initialLat, initialLng, initialLocation]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (location) {
      onSearch(
        query, 
        location.formattedAddress || '', 
        location.latitude, 
        location.longitude,
        location.city,
        location.state,
        location.country
      );
    } else {
      onSearch(query, locationInput);
    }
  };

  const handleClearQuery = () => {
    setQuery('');
  };

  const handleLocationSelect = (data: LocationData) => {
    setLocation(data);
    setLocationInput(data.formattedAddress || '');
  };

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by your browser');
      return;
    }

    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          const locData: LocationData = {
            addressLine1: '',
            city: '',
            state: '',
            country: '',
            formattedAddress: 'Current Location',
            placeId: 'current-location',
            latitude,
            longitude,
            addressComponents: [],
            zipCode: '',
          };
          
          setLocation(locData);
          setLocationInput('Current Location');
        } catch (error) {
          console.error('Geolocation error:', error);
          toast.error('Failed to get your location');
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        let errorMessage = 'Failed to get your location';
        if (error.code === error.PERMISSION_DENIED) {
          errorMessage = 'Location permission denied';
        }
        toast.error(errorMessage);
        setIsLocating(false);
      }
    );
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Query Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
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
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Location Input */}
          <div className="relative sm:w-72">
            <div className="relative">
              <LocationAutocomplete
                onLocationSelect={handleLocationSelect}
                defaultValue={locationInput}
                placeholder="City or zip code"
                className="h-12"
              />
              {/* Current Location Button */}
              <button
                type="button"
                onClick={handleCurrentLocation}
                disabled={isLocating}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-muted-foreground hover:text-primary transition-colors"
                title="Use my current location"
              >
                {isLocating ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <MapPin className="h-4 w-4" />
                )}
              </button>
            </div>
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

