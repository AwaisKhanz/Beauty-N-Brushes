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
  User,
  ChevronLeft,
  MessageCircle,
  Instagram,
  CheckCircle,
  Calendar,
  Award,
  Sparkles,
  Globe,
  Mail,
  Facebook,
} from 'lucide-react';
import Header from '@/components/shared/Header';
import { LoginGate } from '@/components/auth/LoginGate';
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
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
          <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-8 w-32 mb-6" />
            <Skeleton className="h-80 w-full mb-6 rounded-2xl" />
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
      </>
    );
  }

  if (error || !provider) {
    return (
      <>
        <Header />
        <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5 flex items-center justify-center">
          <Card className="max-w-md mx-4">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
                <User className="h-8 w-8 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold mb-2">Provider Not Found</h1>
              <p className="text-muted-foreground mb-6">
                {error || 'This provider does not exist.'}
              </p>
              <Button onClick={() => router.back()} variant="default">
                Go Back
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/5 to-primary/5">
        {/* Hero Section with Cover Photo */}
        <div className="relative">
          {/* Cover Photo */}
          <div className="relative h-64 md:h-96 bg-gradient-to-br from-primary via-secondary to-tertiary overflow-hidden">
            {provider.coverPhotoUrl ? (
              <Image
                src={provider.coverPhotoUrl}
                alt={provider.businessName}
                fill
                className="object-cover opacity-90"
                sizes="100vw"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent opacity-20" />
            )}
            {/* Overlay Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent" />

            {/* Back Button */}
            <div className="absolute top-4 left-4 z-10">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => router.back()}
                className="gap-2 bg-background/90 backdrop-blur hover:bg-background"
              >
                <ChevronLeft className="h-4 w-4" />
                Back
              </Button>
            </div>
          </div>

          {/* Provider Info Card - Overlapping Cover */}
          <div className="container mx-auto px-4">
            <div className="relative -mt-24 md:-mt-32">
              <Card className="border-primary/20 bg-background/95 backdrop-blur-xl shadow-2xl">
                <CardContent className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row gap-6 items-start">
                    {/* Logo */}
                    <div className="relative flex-shrink-0">
                      {provider.logoUrl ? (
                        <div className="relative w-32 h-32 md:w-40 md:h-40">
                          <Image
                            src={provider.logoUrl}
                            alt={provider.businessName}
                            fill
                            className="rounded-2xl object-cover border-4 border-background shadow-xl ring-4 ring-primary/10"
                          />
                        </div>
                      ) : (
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-xl ring-4 ring-primary/10">
                          <span className="text-5xl font-bold text-white">
                            {provider.businessName.charAt(0)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Title & Tagline */}
                      <div className="mb-4">
                        <h1 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-2">
                          {provider.businessName}
                        </h1>
                        {provider.tagline && (
                          <p className="text-lg text-muted-foreground">{provider.tagline}</p>
                        )}
                      </div>

                      {/* Meta row - compact, fewer badges */}
                      <div className="flex flex-wrap items-center gap-3 mb-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {provider.city}, {provider.state}
                          </span>
                        </div>
                        <span className="hidden md:inline text-border">•</span>
                        <Badge
                          variant="secondary"
                          className="gap-1.5 px-2.5 py-1 bg-accent/10 text-accent border-accent/20"
                        >
                          <Star className="h-3.5 w-3.5 fill-accent" />
                          {provider.averageRating.toFixed(1)} ({provider.totalReviews})
                        </Badge>
                        {provider.acceptsNewClients && (
                          <Badge variant="secondary" className="px-2.5 py-1">
                            Accepting Clients
                          </Badge>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="flex flex-wrap gap-3">
                        <LoginGate action="book an appointment with this provider">
                          <Button variant="dark" size="lg" className="gap-2">
                            <Calendar className="h-5 w-5" />
                            Book Appointment
                          </Button>
                        </LoginGate>

                        <LoginGate action="send a message to this provider">
                          <Button variant="outline" size="lg" className="gap-2">
                            <MessageCircle className="h-5 w-5" />
                            Message
                          </Button>
                        </LoginGate>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-3">
              <Tabs defaultValue="services" className="space-y-8">
                <TabsList className="grid w-full max-w-md grid-cols-3 h-12 bg-background/60 backdrop-blur border border-primary/10">
                  <TabsTrigger
                    value="services"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Services
                  </TabsTrigger>
                  <TabsTrigger
                    value="portfolio"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    Portfolio
                  </TabsTrigger>
                  <TabsTrigger
                    value="about"
                    className="data-[state=active]:bg-primary data-[state=active]:text-white"
                  >
                    About
                  </TabsTrigger>
                </TabsList>

                {/* Services Tab */}
                <TabsContent value="services" className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                      Services <span className="text-primary">({provider.services.length})</span>
                    </h2>
                  </div>

                  {provider.services.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                      {provider.services.map((service) => (
                        <ServiceCard key={service.id} service={service} />
                      ))}
                    </div>
                  ) : (
                    <Card className="border-primary/10">
                      <CardContent className="py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                          <Sparkles className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">No Services Yet</h3>
                        <p className="text-muted-foreground">
                          This provider is setting up their services. Check back soon!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Portfolio Tab */}
                <TabsContent value="portfolio" className="space-y-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground">
                      Portfolio{' '}
                      <span className="text-primary">({provider.portfolioImages.length})</span>
                    </h2>
                  </div>

                  {provider.portfolioImages.length > 0 ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {provider.portfolioImages.map((image) => (
                        <div
                          key={image.id}
                          className="relative aspect-square rounded-xl overflow-hidden bg-muted group cursor-pointer ring-1 ring-primary/10 hover:ring-primary/30 transition-all"
                        >
                          <Image
                            src={image.imageUrl}
                            alt={image.caption || provider.businessName}
                            fill
                            className="object-cover group-hover:scale-110 transition-transform duration-500"
                            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                          />
                          {image.caption && (
                            <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-button-dark/90 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
                              <p className="text-white text-sm font-medium line-clamp-2">
                                {image.caption}
                              </p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <Card className="border-primary/10">
                      <CardContent className="py-16 text-center">
                        <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                          <Instagram className="h-8 w-8 text-accent" />
                        </div>
                        <h3 className="font-semibold text-lg mb-2">Portfolio Coming Soon</h3>
                        <p className="text-muted-foreground">
                          This provider is building their portfolio. Check back later!
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* About Tab */}
                <TabsContent value="about" className="space-y-6">
                  {/* About Section */}
                  <Card className="border-primary/10 bg-background/60 backdrop-blur">
                    <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
                      <CardTitle className="text-xl">About {provider.businessName}</CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {provider.description ? (
                        <p className="text-muted-foreground leading-relaxed whitespace-pre-line">
                          {provider.description}
                        </p>
                      ) : (
                        <p className="text-muted-foreground italic">No description available.</p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Location */}
                  {provider.address && (
                    <Card className="border-primary/10 bg-background/60 backdrop-blur">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl">
                          <MapPin className="h-5 w-5 text-primary" />
                          Location
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-muted-foreground space-y-1">
                          <p className="font-medium text-foreground">{provider.address}</p>
                          <p>
                            {provider.city}, {provider.state}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Reviews */}
                  <Card className="border-primary/10 bg-background/60 backdrop-blur">
                    <CardHeader className="bg-gradient-to-r from-accent/5 to-primary/5">
                      <CardTitle className="flex items-center gap-2 text-xl">
                        <Award className="h-5 w-5 text-accent" />
                        Reviews & Ratings
                      </CardTitle>
                      <CardDescription className="text-base">
                        {provider.totalReviews} {provider.totalReviews === 1 ? 'review' : 'reviews'}{' '}
                        •{' '}
                        <span className="text-accent font-semibold">
                          {provider.averageRating.toFixed(1)}
                        </span>{' '}
                        average rating
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {provider.reviews && provider.reviews.length > 0 ? (
                        <div className="space-y-6">
                          {provider.reviews.map((review: any) => (
                            <div
                              key={review.id}
                              className="pb-6 border-b border-border/50 last:border-0 last:pb-0"
                            >
                              <div className="flex items-start gap-3 mb-3">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                                  {review.clientName.charAt(0)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="font-semibold">{review.clientName}</span>
                                    <span className="text-sm text-muted-foreground">
                                      • {new Date(review.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 mb-2">
                                    <div className="flex">
                                      {[...Array(5)].map((_, i) => (
                                        <Star
                                          key={i}
                                          className={`h-4 w-4 ${
                                            i < review.rating
                                              ? 'fill-accent text-accent'
                                              : 'text-muted-foreground/30'
                                          }`}
                                        />
                                      ))}
                                    </div>
                                    <Badge variant="outline" className="text-xs">
                                      {review.serviceTitle}
                                    </Badge>
                                  </div>
                                  {review.reviewText && (
                                    <p className="text-sm text-muted-foreground leading-relaxed">
                                      {review.reviewText}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto mb-4">
                            <Star className="h-8 w-8 text-accent" />
                          </div>
                          <h3 className="font-semibold text-lg mb-2">No Reviews Yet</h3>
                          <p className="text-muted-foreground">
                            Be the first to book and leave a review!
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Actions */}
              <Card className="border-primary/20 bg-gradient-to-br from-primary/5 via-accent/5 to-background shadow-lg sticky top-24">
                <CardHeader className="space-y-1">
                  <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <LoginGate action="book an appointment">
                    <Button variant="dark" size="lg" className="w-full gap-2 h-12">
                      <Calendar className="h-5 w-5" />
                      Book Now
                    </Button>
                  </LoginGate>

                  <LoginGate action="send a message">
                    <Button variant="outline" size="lg" className="w-full gap-2 h-12">
                      <MessageCircle className="h-5 w-5" />
                      Send Message
                    </Button>
                  </LoginGate>

                  <Separator />
                  <div className="text-xs text-center text-muted-foreground">
                    Instant booking • Secure payment • Easy cancellation
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card className="border-primary/10 bg-background/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Mail className="h-5 w-5 text-primary" />
                    Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {provider.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium text-foreground">{provider.address}</p>
                        <p className="text-muted-foreground">
                          {provider.city}, {provider.state}
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Social Links */}
              <Card className="border-primary/10 bg-background/60 backdrop-blur">
                <CardHeader>
                  <CardTitle className="text-lg">Connect</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    size="sm"
                    asChild
                  >
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <Instagram className="h-4 w-4 text-pink-600" />
                      <span className="text-sm">Instagram</span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    size="sm"
                    asChild
                  >
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <Facebook className="h-4 w-4 text-blue-600" />
                      <span className="text-sm">Facebook</span>
                    </a>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-3"
                    size="sm"
                    asChild
                  >
                    <a href="#" target="_blank" rel="noopener noreferrer">
                      <Globe className="h-4 w-4 text-primary" />
                      <span className="text-sm">Website</span>
                    </a>
                  </Button>
                </CardContent>
              </Card>

              {/* Trust Badges */}
              <Card className="border-accent/20 bg-gradient-to-br from-accent/10 to-primary/5">
                <CardContent className="pt-6 space-y-3">
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Verified Professional</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Secure Booking</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <span className="text-muted-foreground">Satisfaction Guaranteed</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
