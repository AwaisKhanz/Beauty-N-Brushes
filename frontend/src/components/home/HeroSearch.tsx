'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Upload, Sparkles, Star, Shield, CheckCircle2, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants';
import { LocationAutocomplete } from '@/components/location/LocationAutocomplete';
import { LocationData } from '@/shared-types/google-places.types';
import { toast } from 'sonner';

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState<LocationData | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [isLocating, setIsLocating] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    
    if (location) {
      if (location.city) params.append('city', location.city);
      if (location.state) params.append('state', location.state);
      if (location.country) params.append('country', location.country);
      if (location.latitude) params.append('lat', location.latitude.toString());
      if (location.longitude) params.append('lng', location.longitude.toString());
    } else if (locationInput) {
      // Fallback for manual text entry without selection
      params.append('city', locationInput);
    }

    router.push(`${ROUTES.SEARCH}?${params.toString()}`);
  };

  const handleVisualSearch = () => {
    router.push(ROUTES.VISUAL_SEARCH);
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
          
          // Reverse geocode to get city/state (optional, but good for UI)
          // For now, we'll just set the coordinates and let the search page handle it
          // Or we can use the Google Maps Geocoding API if we had a helper for it.
          // Since we have useGooglePlaces, let's see if we can use it or just pass lat/lng.
          
          // We'll construct a partial LocationData object
          const locData: LocationData = {
            addressLine1: '',
            city: '', // We don't know the city yet, backend/search page will handle radius search
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
    <section className="relative py-16 lg:py-24 overflow-hidden">
      {/* Background Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-background via-accent/5 to-primary/10 -z-10" />

      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Badge */}
          <Badge variant="secondary" className="gap-2 text-base px-4 py-2">
            <Sparkles className="h-4 w-4" />
            AI-Powered Beauty Marketplace
          </Badge>

          {/* Main Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold leading-tight">
            Find Your Perfect Beauty Professional{' '}
            <span className="text-primary block mt-2">Through Real Work</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
            Visual-first booking platform connecting clients with beauty professionals. See real
            examples, upload inspiration photos, and book with confidence.
          </p>

          {/* Search Card */}
          <Card className="max-w-3xl mx-auto shadow-lg">
            <CardContent className="p-6">
              <form onSubmit={handleSearch}>
                <div className="flex flex-col sm:flex-row gap-3">
                  {/* Service Input */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground z-10" />
                    <Input
                      type="text"
                      placeholder="What service are you looking for?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10 h-14 text-base"
                    />
                  </div>

                  {/* Location Input */}
                  <div className="relative sm:w-72">
                    <div className="relative">
                      <LocationAutocomplete
                        onLocationSelect={handleLocationSelect}
                        defaultValue={locationInput}
                        placeholder="City or zip code"
                        className="h-14"
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
                          <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                          <MapPin className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Search Button */}
                  <Button type="submit" variant="dark" size="lg" className="h-14 px-8 text-base">
                    <Search className="h-5 w-5 sm:mr-2" />
                    <span className="hidden sm:inline">Search</span>
                  </Button>
                </div>
              </form>

              {/* Divider */}
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-background px-4 text-muted-foreground">OR</span>
                </div>
              </div>

              {/* AI Visual Search Button */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={handleVisualSearch}
                className="w-full h-14 border-2 border-primary/20 hover:border-primary hover:bg-primary/5 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                    <Upload className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-semibold flex items-center gap-2 group-hover:text-primary transition-colors">
                      Upload Inspiration Photo
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="text-xs text-muted-foreground">
                      AI will find matching professionals for you
                    </div>
                  </div>
                </div>
              </Button>
            </CardContent>
          </Card>

          {/* Trust Indicators */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Badge variant="outline" className="gap-2 py-2 px-4">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              Verified Professionals
            </Badge>
            <Badge variant="outline" className="gap-2 py-2 px-4">
              <Star className="h-4 w-4 text-accent" />
              Real Reviews
            </Badge>
            <Badge variant="outline" className="gap-2 py-2 px-4">
              <Shield className="h-4 w-4 text-secondary" />
              Secure Booking
            </Badge>
          </div>
        </div>
      </div>
    </section>
  );
}
