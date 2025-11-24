'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Link from 'next/link';
import { Calendar, Heart, Search, MessageSquare, AlertCircle, Clock, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type {
  GetClientDashboardStatsResponse,
  ClientDashboardBooking,
} from '@/shared-types/dashboard.types';

export default function ClientDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [stats, setStats] = useState<GetClientDashboardStatsResponse['stats'] | null>(null);
  const [recentBookings, setRecentBookings] = useState<ClientDashboardBooking[]>([]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError('');
      const [statsRes, bookingsRes] = await Promise.all([
        api.dashboard.getClientStats(),
        api.dashboard.getClientRecentBookings(5),
      ]);
      setStats(statsRes.data.stats);
      setRecentBookings(bookingsRes.data.bookings);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <DashboardSkeleton />;
  if (error)
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back! Here's your booking overview.</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.upcomingBookings}</div>
            <p className="text-xs text-muted-foreground">{stats.totalBookings} total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.completedBookings}</div>
            <p className="text-xs text-muted-foreground">Services received</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Favorites</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.favoriteProviders}</div>
            <p className="text-xs text-muted-foreground">Saved providers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Messages</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.unreadMessages}</div>
            <p className="text-xs text-muted-foreground">Unread</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Bookings & Action Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Bookings */}
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bookings</CardTitle>
            <CardDescription>Your scheduled appointments</CardDescription>
          </CardHeader>
          <CardContent>
            {recentBookings.length > 0 ? (
              <div className="space-y-4">
                {recentBookings.slice(0, 3).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium">{booking.service}</h4>
                      <p className="text-sm text-muted-foreground">{booking.businessName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">
                          {new Date(booking.date).toLocaleDateString()} at {booking.time}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={booking.status === 'confirmed' ? 'default' : 'secondary'}>
                        {booking.status}
                      </Badge>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full mt-4" asChild>
                  <Link href="/client/bookings">View All Bookings</Link>
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground mb-2">No bookings yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Discover and book beauty services near you
                </p>
                <Button className="gap-2" asChild>
                  <Link href="/search">
                    <Search className="h-4 w-4" />
                    Browse Services
                  </Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Pending Reviews */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Reviews</CardTitle>
            <CardDescription>Share your experience</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Star className="h-12 w-12 mx-auto mb-4 opacity-50 text-rating-filled" />
              <p className="text-sm text-muted-foreground mb-4">No pending reviews at this time</p>
              <p className="text-xs text-muted-foreground">
                Complete a booking to leave your first review
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Manage your beauty appointments</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="default" className="gap-2" asChild>
              <Link href="/search">
                <Search className="h-4 w-4" />
                Browse Services
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/client/favorites">
                <Heart className="h-4 w-4" />
                View Favorites
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/client/messages">
                <MessageSquare className="h-4 w-4" />
                Messages
                {stats.unreadMessages > 0 && (
                  <Badge variant="destructive" className="ml-2">
                    {stats.unreadMessages}
                  </Badge>
                )}
              </Link>
            </Button>
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/client/reviews">
                <Star className="h-4 w-4" />
                My Reviews
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-4 w-96" />
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
    </div>
  );
}
