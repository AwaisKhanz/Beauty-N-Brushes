'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { ServiceCard } from '@/components/search/ServiceCard';
import {
  MapPin,
  Star,
  Building2,
  User,
  ChevronLeft,
  MessageCircle,
  Instagram,
  Smartphone,
  CheckCircle,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { PublicProviderProfile } from '@/shared-types/service.types';

export default function ProviderProfilePage() {
  const params = useParams();
  const router = useRouter();
  const slug = params.slug as string;

  const [provider, setProvider] = useState<PublicProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadProvider = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await api.providers.getPublicProfile(slug);
        setProvider(response.data.provider);
      } catch (err: unknown) {
        setError(extractErrorMessage(err) || 'Failed to load provider profile');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      loadProvider();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-32 mb-6" />
          <Skeleton className="h-64 w-full mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <Skeleton className="h-96 w-full" />
            </div>
            <div>
              <Skeleton className="h-64 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !provider) {
    return (
      <div className="min-h-screen bg-background py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-destructive mb-4">Provider Not Found</h1>
          <p className="text-muted-foreground mb-6">{error || 'This provider does not exist.'}</p>
          <Button onClick={() => router.back()}>Go Back</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => router.back()} className="gap-2">
            <ChevronLeft className="h-4 w-4" />
            Back to Search
          </Button>
        </div>
      </div>

      {/* Cover Photo */}
      {provider.coverPhotoUrl && (
        <div className="relative h-64 md:h-80 bg-gradient-to-br from-primary/20 to-accent/20">
          <Image
            src={provider.coverPhotoUrl}
            alt={provider.businessName}
            fill
            className="object-cover"
            sizes="100vw"
            priority
          />
        </div>
      )}

      {/* Provider Header */}
      <div className="border-b bg-white">
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
            {/* Logo */}
            <div className={`${provider.coverPhotoUrl ? '-mt-20' : ''} relative`}>
              {provider.logoUrl ? (
                <Image
                  src={provider.logoUrl}
                  alt={provider.businessName}
                  width={128}
                  height={128}
                  className="rounded-full border-4 border-white shadow-lg object-cover"
                />
              ) : (
                <div className="w-32 h-32 rounded-full border-4 border-white shadow-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-4xl font-bold text-primary">
                    {provider.businessName.charAt(0)}
                  </span>
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl font-heading font-bold mb-2">{provider.businessName}</h1>
                  {provider.tagline && (
                    <p className="text-lg text-muted-foreground mb-3">{provider.tagline}</p>
                  )}

                  <div className="flex flex-wrap gap-3 mb-3">
                    {/* Location */}
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      <span>
                        {provider.city}, {provider.state}
                      </span>
                    </div>

                    {/* Rating */}
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 fill-accent text-accent" />
                      <span className="font-semibold">{provider.averageRating.toFixed(1)}</span>
                      <span className="text-sm text-muted-foreground">
                        ({provider.totalReviews}{' '}
                        {provider.totalReviews === 1 ? 'review' : 'reviews'})
                      </span>
                    </div>

                    {/* Provider Type */}
                    <Badge variant={provider.isSalon ? 'default' : 'secondary'}>
                      {provider.isSalon ? (
                        <>
                          <Building2 className="h-3 w-3 mr-1" />
                          Salon
                        </>
                      ) : (
                        <>
                          <User className="h-3 w-3 mr-1" />
                          Solo
                        </>
                      )}
                    </Badge>

                    {/* Mobile Service */}
                    {provider.mobileServiceAvailable && (
                      <Badge variant="outline">
                        <Smartphone className="h-3 w-3 mr-1" />
                        Mobile Service
                      </Badge>
                    )}

                    {/* Accepting Clients */}
                    {provider.acceptsNewClients && (
                      <Badge variant="outline" className="border-primary text-primary">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Accepting New Clients
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button variant="outline" size="lg">
                <MessageCircle className="h-5 w-5 mr-2" />
                Message
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="services" className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="services">Services</TabsTrigger>
            <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Services ({provider.services.length})</h2>
              {provider.services.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {provider.services.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <p className="text-muted-foreground">No services available yet</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Portfolio Tab */}
          <TabsContent value="portfolio" className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">
                Portfolio ({provider.portfolioImages.length})
              </h2>
              {provider.portfolioImages.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {provider.portfolioImages.map((image) => (
                    <div
                      key={image.id}
                      className="relative aspect-square rounded-lg overflow-hidden bg-muted group cursor-pointer"
                    >
                      <Image
                        src={image.imageUrl}
                        alt={image.caption || provider.businessName}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-300"
                        sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                      />
                      {image.caption && (
                        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <p className="text-white text-sm line-clamp-2">{image.caption}</p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Instagram className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">
                      No portfolio images yet. Check back soon!
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* About Tab */}
          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>About {provider.businessName}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {provider.description ? (
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                    {provider.description}
                  </p>
                ) : (
                  <p className="text-muted-foreground italic">No description available.</p>
                )}

                {provider.address && (
                  <>
                    <Separator />
                    <div>
                      <h3 className="font-semibold mb-2">Location</h3>
                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-5 w-5 flex-shrink-0 mt-0.5" />
                        <div>
                          <p>{provider.address}</p>
                          <p>
                            {provider.city}, {provider.state}
                          </p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Reviews Section (Placeholder for when reviews are implemented) */}
            <Card>
              <CardHeader>
                <CardTitle>Reviews & Ratings</CardTitle>
                <CardDescription>
                  {provider.totalReviews} {provider.totalReviews === 1 ? 'review' : 'reviews'} •{' '}
                  {provider.averageRating.toFixed(1)} average rating
                </CardDescription>
              </CardHeader>
              <CardContent>
                {provider.reviews.length > 0 ? (
                  <div className="space-y-4">
                    {provider.reviews.map((review) => (
                      <div key={review.id} className="border-b pb-4 last:border-0">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < review.rating
                                    ? 'fill-accent text-accent'
                                    : 'text-muted-foreground'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="font-semibold">{review.clientName}</span>
                          <span className="text-sm text-muted-foreground">
                            • {new Date(review.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-1">{review.serviceTitle}</p>
                        {review.reviewText && (
                          <p className="text-sm leading-relaxed">{review.reviewText}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No reviews yet. Be the first to book and leave a review!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
