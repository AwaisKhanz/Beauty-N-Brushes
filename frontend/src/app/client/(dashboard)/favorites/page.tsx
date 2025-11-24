'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Heart, MapPin, Star, AlertCircle, Search } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { FavoriteProvider } from '@/shared-types/favorite.types';
import { toast } from 'sonner';

export default function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [removingId, setRemovingId] = useState<string | null>(null);

  useEffect(() => {
    fetchFavorites();
  }, []);

  async function fetchFavorites() {
    try {
      setLoading(true);
      setError('');
      const res = await api.favorites.getAll();
      setFavorites(res.data.favorites);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load favorites');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveFavorite(providerId: string) {
    try {
      setRemovingId(providerId);
      await api.favorites.toggle(providerId);

      // Remove from local state
      setFavorites((prev) => prev.filter((fav) => fav.id !== providerId));

      toast.success('Removed from favorites');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to remove favorite');
    } finally {
      setRemovingId(null);
    }
  }

  if (loading) {
    return <FavoritesSkeleton />;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-heading font-bold">Favorites</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Favorites</h1>
          <p className="text-muted-foreground">Your saved beauty professionals</p>
        </div>
        <Button asChild>
          <Link href="/search">
            <Search className="h-4 w-4 mr-2" />
            Find More
          </Link>
        </Button>
      </div>

      {/* Favorites Grid */}
      {favorites.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((provider) => (
            <Card key={provider.id} className="hover:shadow-lg transition-shadow overflow-hidden">
              {/* Cover Image */}
              {provider.coverImageUrl && (
                <div className="relative h-32 w-full overflow-hidden bg-gradient-to-br from-primary/20 to-accent/20">
                  <Image
                    src={provider.coverImageUrl}
                    alt={`${provider.businessName} cover`}
                    fill
                    className="object-cover"
                  />
                </div>
              )}

              <CardContent className="p-6 space-y-4">
                {/* Provider Info */}
                <div className="flex items-start gap-4">
                  {/* Logo/Avatar */}
                  <div className="flex-shrink-0">
                    {provider.logoUrl ? (
                      <Image
                        src={provider.logoUrl}
                        alt={provider.businessName}
                        width={64}
                        height={64}
                        className="rounded-full object-cover border-2 border-primary/20"
                      />
                    ) : (
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-2xl font-heading font-bold text-primary">
                          {provider.businessName.charAt(0)}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg truncate">{provider.businessName}</h3>
                    {provider.tagline && (
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {provider.tagline}
                      </p>
                    )}
                  </div>
                </div>

                {/* Rating & Location */}
                <div className="space-y-2">
                  {provider.averageRating > 0 && (
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 fill-rating-filled text-rating-filled" />
                      <span className="font-medium">{provider.averageRating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({provider.totalReviews}{' '}
                        {provider.totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    <span>
                      {provider.city}, {provider.state}
                    </span>
                  </div>
                </div>

                {/* Services Preview */}
                {provider.servicesCount > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{provider.servicesCount} services</Badge>
                    {provider.instantBooking && <Badge variant="secondary">Instant Booking</Badge>}
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <Button asChild variant="dark" className="flex-1">
                    <Link href={`/providers/${provider.slug}`}>Book Now</Link>
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={() => handleRemoveFavorite(provider.id)}
                    disabled={removingId === provider.id}
                    className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                  >
                    <Heart className="h-4 w-4 fill-current" />
                    <span className="sr-only">Remove from favorites</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        // Empty State
        <div className="text-center py-12">
          <Heart className="h-16 w-16 mx-auto mb-4 opacity-50 text-primary" />
          <h3 className="text-lg font-medium mb-2">No favorites yet</h3>
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            Start exploring and save your favorite beauty professionals for easy access later
          </p>
          <Button asChild>
            <Link href="/search">
              <Search className="h-4 w-4 mr-2" />
              Browse Services
            </Link>
          </Button>
        </div>
      )}
    </div>
  );
}

function FavoritesSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Card key={i}>
            <Skeleton className="h-32 w-full" />
            <CardContent className="p-6 space-y-4">
              <div className="flex items-start gap-4">
                <Skeleton className="w-16 h-16 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-32" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-40" />
              <div className="flex gap-2">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-10" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
