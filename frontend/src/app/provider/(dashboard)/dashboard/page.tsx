'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useBookingSocket } from '@/hooks/use-booking-socket';
import { useReviewSocket } from '@/hooks/use-review-socket';
import { useLikeSocket } from '@/hooks/use-like-socket';
import { useTeamSocket } from '@/hooks/use-team-socket';
import { useSystemSocket } from '@/hooks/use-system-socket';
import { ShareBookingPageDialog } from '@/components/provider/ShareBookingPageDialog';
import Link from 'next/link';
import {
  Calendar,
  Package,
  TrendingUp,
  MessageSquare,
  Star,
  Plus,
  ArrowRight,
  Clock,
  DollarSign,
  Eye,
  AlertCircle,
  Share2,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { GetDashboardStatsResponse, DashboardBooking } from '@/shared-types/dashboard.types';

export default function ProviderDashboardPage() {
  useBookingSocket(); // Enable real-time booking updates
  useReviewSocket(); // Enable real-time review updates
  useLikeSocket(); // Enable real-time like updates
  useTeamSocket(); // Enable real-time team updates
  useSystemSocket(); // Enable real-time service & system updates
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dashboardData, setDashboardData] = useState<GetDashboardStatsResponse | null>(null);
  const [recentBookings, setRecentBookings] = useState<DashboardBooking[]>([]);
  const [showShareDialog, setShowShareDialog] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError('');

      // Fetch dashboard stats and recent bookings
      const [statsResponse, bookingsResponse] = await Promise.all([
        api.dashboard.getStats(),
        api.dashboard.getRecentBookings(),
      ]);

      setDashboardData(statsResponse.data);
      setRecentBookings(bookingsResponse.data.bookings);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <DashboardSkeleton />;
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (!dashboardData) {
    return null;
  }

  const { stats, onboardingProgress, profile } = dashboardData;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back{profile.businessName ? `, ${profile.businessName}` : ''}! Here's what's
            happening with your business.
          </p>
        </div>
        <div className="flex gap-2">
          {profile.slug && (
            <Button variant="outline" className="gap-2" onClick={() => setShowShareDialog(true)}>
              <Share2 className="h-4 w-4" />
              Share Page
            </Button>
          )}
          <Button className="gap-2" asChild>
            <Link href="/provider/services/create">
              <Plus className="h-4 w-4" />
              Create Service
            </Link>
          </Button>
        </div>
      </div>

      {/* Profile Status Alerts */}
      {profile.isPaused && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is currently paused. You're not receiving new bookings.{' '}
            <Link href="/provider/settings" className="text-primary hover:underline font-medium">
              Resume your profile
            </Link>
          </AlertDescription>
        </Alert>
      )}

      {/* Onboarding Progress */}
      {onboardingProgress < 100 && !profile.profileCompleted && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-lg">Complete Your Profile</CardTitle>
            <CardDescription>
              Finish setting up your profile to start receiving bookings
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>Profile completion</span>
                <span>{onboardingProgress}%</span>
              </div>
              <Progress value={onboardingProgress} className="h-2" />
              <Button variant="outline" size="sm" asChild>
                <Link href="/provider/onboarding">Complete Profile</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalBookings}</div>
            <p className="text-xs text-muted-foreground">{stats.upcomingBookings} upcoming</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Total earned</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageRating > 0 ? stats.averageRating.toFixed(1) : '--'}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats.totalReviews > 0 ? `Based on ${stats.totalReviews} reviews` : 'No reviews yet'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileViews}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Bookings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Recent Bookings
            </CardTitle>
            <CardDescription>Your upcoming and recent appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{booking.clientName}</h4>
                      <p className="text-sm text-muted-foreground">{booking.service}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/provider/bookings/${booking.id}`}>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/provider/bookings">View All Bookings</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No bookings yet</p>
                <p className="text-sm mt-1">Your bookings will appear here</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks to manage your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link href="/provider/services/create">
                  <Package className="h-4 w-4" />
                  Create New Service
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link href="/provider/services">
                  <Package className="h-4 w-4" />
                  Manage Services ({stats.totalServices})
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link href="/provider/calendar">
                  <Calendar className="h-4 w-4" />
                  Manage Calendar
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link href="/provider/messages">
                  <MessageSquare className="h-4 w-4" />
                  Messages
                  {stats.unreadMessages > 0 && ` (${stats.unreadMessages})`}
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link href="/provider/analytics">
                  <TrendingUp className="h-4 w-4" />
                  View Analytics
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tips & Resources */}
      <Card className="border-accent/20 bg-accent/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
            Tips to Grow Your Business
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Upload More Photos</h4>
              <p className="text-sm text-muted-foreground">
                Providers with 10+ photos get 3x more bookings
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Set Competitive Prices</h4>
              <p className="text-sm text-muted-foreground">
                Research local rates to attract more clients
              </p>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Respond Quickly</h4>
              <p className="text-sm text-muted-foreground">
                Fast responses increase booking conversion by 40%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Share Booking Page Dialog */}
      {profile.slug && profile.businessName && (
        <ShareBookingPageDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          businessName={profile.businessName}
          slug={profile.slug}
        />
      )}
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-10 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-40" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-16 mb-2" />
              <Skeleton className="h-3 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
