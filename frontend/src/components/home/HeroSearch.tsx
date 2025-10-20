'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, MapPin, Upload, Sparkles, Star, Shield, CheckCircle2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ROUTES } from '@/constants';

export function HeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [location, setLocation] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (query) params.append('query', query);
    if (location) params.append('location', location);
    router.push(`${ROUTES.SEARCH}?${params.toString()}`);
  };

  const handleVisualSearch = () => {
    router.push(ROUTES.VISUAL_SEARCH);
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
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="What service are you looking for?"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="pl-10 h-14 text-base"
                    />
                  </div>

                  {/* Location Input */}
                  <div className="relative sm:w-56">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="City or zip code"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="pl-10 h-14 text-base"
                    />
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
