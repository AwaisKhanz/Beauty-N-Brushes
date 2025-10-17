'use client';

import Link from 'next/link';
import Header from '@/components/shared/Header';
import Footer from '@/components/shared/Footer';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Sparkles,
  Search,
  MapPin,
  Star,
  Calendar,
  Shield,
  Zap,
  Upload,
  MessageSquare,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
  Image as ImageIcon,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <Badge variant="secondary" className="gap-2">
                <Sparkles className="h-4 w-4" />
                AI-Powered Beauty Marketplace
              </Badge>

              <h1 className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold leading-tight">
                Find Your Perfect Beauty Professional{' '}
                <span className="text-primary">Through Real Work</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                Visual-first booking platform connecting clients with beauty professionals. See real
                examples, upload inspiration photos, and book with confidence.
              </p>

              {/* Search Card */}
              <Card className="max-w-3xl mx-auto">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="What service are you looking for?" className="pl-9" />
                    </div>
                    <div className="relative sm:w-48">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input placeholder="City or zip code" className="pl-9" />
                    </div>
                    <Button variant="dark" size="lg" asChild>
                      <Link href="/search">Search</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* AI Upload */}
              <Button variant="outline" size="lg" asChild>
                <Link href="/ai-match">
                  <Upload className="h-5 w-5" />
                  Upload Inspiration Photo
                </Link>
              </Button>

              {/* Trust Indicators */}
              <div className="flex flex-wrap items-center justify-center gap-4 pt-8">
                <Badge variant="outline" className="gap-2">
                  <CheckCircle2 className="h-4 w-4" />
                  Verified Professionals
                </Badge>
                <Badge variant="outline" className="gap-2">
                  <Star className="h-4 w-4" />
                  Real Reviews
                </Badge>
                <Badge variant="outline" className="gap-2">
                  <Shield className="h-4 w-4" />
                  Secure Booking
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
                Why <Logo size="lg" showText className="inline" />?
              </h2>
              <p className="text-lg text-muted-foreground">
                The first visual-first beauty booking platform powered by AI
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <ImageIcon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Visual-First Booking</CardTitle>
                  <CardDescription>
                    Browse real work examples before booking. See exactly what you'll get with
                    photos and videos from actual clients.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>AI Inspiration Matching</CardTitle>
                  <CardDescription>
                    Upload a photo of your dream look. Our AI finds professionals who've created
                    similar styles near you.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Calendar className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Easy Booking</CardTitle>
                  <CardDescription>
                    Book appointments instantly with real-time availability. Secure deposits, clear
                    pricing, no hidden fees.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Star className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Verified Reviews</CardTitle>
                  <CardDescription>
                    Read authentic reviews from real clients. Only people who've booked can leave
                    reviews.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <MessageSquare className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Direct Messaging</CardTitle>
                  <CardDescription>
                    Chat with professionals before booking. Ask questions, share inspiration, get
                    instant responses.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle>Secure Payments</CardTitle>
                  <CardDescription>
                    Protected bookings with secure deposit payments. Full refund protection if
                    provider cancels.
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* For Providers CTA */}
        <section className="">
          <div className="">
            <Card className="rounded-none bg-gradient-to-br from-primary via-secondary to-accent border-0 text-primary-foreground">
              <CardContent className="p-12">
                <div className="text-center space-y-8">
                  <h2 className="text-3xl md:text-5xl font-heading font-bold">
                    Are You a Beauty Professional?
                  </h2>
                  <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto">
                    Join <Logo size="lg" showText className="inline" /> and grow your business with
                    AI-powered tools, instant booking, and zero platform fees.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
                    <div className="text-center space-y-2">
                      <div className="h-16 w-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto">
                        <Zap className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-semibold">2-Month Free Trial</h3>
                      <p className="text-sm text-primary-foreground/80">
                        Start for free, no credit card required
                      </p>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="h-16 w-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto">
                        <TrendingUp className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-semibold">Zero Fees</h3>
                      <p className="text-sm text-primary-foreground/80">
                        No payment processing fees. Keep 100% of your earnings
                      </p>
                    </div>

                    <div className="text-center space-y-2">
                      <div className="h-16 w-16 rounded-full bg-primary-foreground/20 flex items-center justify-center mx-auto">
                        <Sparkles className="h-8 w-8" />
                      </div>
                      <h3 className="text-xl font-semibold">AI-Powered</h3>
                      <p className="text-sm text-primary-foreground/80">
                        Smart messaging, auto-scheduling, and more
                      </p>
                    </div>
                  </div>

                  <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      variant="outline"
                      size="lg"
                      asChild
                      className="bg-primary-foreground hover:text-button-dark text-button-dark hover:bg-primary-foreground/90 border-0"
                    >
                      <Link href="/register?role=provider">
                        Get Started Free
                        <ArrowRight className="h-5 w-5" />
                      </Link>
                    </Button>
                  </div>

                  <p className="text-sm text-primary-foreground/70">
                    From $19/month after trial. Cancel anytime.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">How It Works</h2>
              <p className="text-lg text-muted-foreground">
                Book your perfect beauty service in three simple steps
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              <Card>
                <CardHeader className="text-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-primary">1</span>
                  </div>
                  <CardTitle>Search or Upload</CardTitle>
                  <CardDescription>
                    Browse services or upload an inspiration photo to find professionals with
                    similar work
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-primary">2</span>
                  </div>
                  <CardTitle>Review & Book</CardTitle>
                  <CardDescription>
                    Check out real work examples, read reviews, and book instantly with secure
                    deposit
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader className="text-center">
                  <div className="h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                    <span className="text-3xl font-bold text-primary">3</span>
                  </div>
                  <CardTitle>Get Glam</CardTitle>
                  <CardDescription>
                    Show up for your appointment and leave looking amazing. Leave a review to help
                    others
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center space-y-8">
              <h2 className="text-3xl md:text-5xl font-heading font-bold">
                Ready to Find Your Perfect Look?
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Join thousands of happy clients who've found their ideal beauty professionals
                through real work examples
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="dark" size="lg" asChild>
                  <Link href="/search">
                    <Search className="h-5 w-5" />
                    Browse Services
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link href="/register?role=client">Get Started</Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
