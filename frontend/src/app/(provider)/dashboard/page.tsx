'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
} from 'lucide-react';

export default function ProviderDashboardPage() {
  // Mock data - replace with real data from API
  const stats = {
    totalBookings: 12,
    upcomingBookings: 3,
    totalRevenue: 2450,
    averageRating: 4.8,
    profileViews: 156,
    unreadMessages: 2,
  };

  const recentBookings = [
    {
      id: '1',
      clientName: 'Sarah Johnson',
      service: 'Hair Color & Cut',
      date: '2025-01-20',
      time: '2:00 PM',
      status: 'confirmed',
    },
    {
      id: '2',
      clientName: 'Maria Garcia',
      service: 'Bridal Makeup',
      date: '2025-01-22',
      time: '10:00 AM',
      status: 'pending',
    },
    {
      id: '3',
      clientName: 'Emma Davis',
      service: 'Nail Art',
      date: '2025-01-25',
      time: '3:30 PM',
      status: 'confirmed',
    },
  ];

  const onboardingProgress = 75; // Mock progress

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Welcome back! Here's what's happening with your business.
          </p>
        </div>
        <Button className="gap-2" asChild>
          <Link href="/provider/services/create">
            <Plus className="h-4 w-4" />
            Create Service
          </Link>
        </Button>
      </div>

      {/* Onboarding Progress */}
      {onboardingProgress < 100 && (
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
                <Link href="/provider/profile">Complete Profile</Link>
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
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${stats.totalRevenue}</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.averageRating}</div>
            <p className="text-xs text-muted-foreground">Based on 8 reviews</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileViews}</div>
            <p className="text-xs text-muted-foreground">+23% from last week</p>
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
                    <Button variant="ghost" size="sm">
                      <ArrowRight className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4" asChild>
              <Link href="/provider/bookings">View All Bookings</Link>
            </Button>
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
                <Link href="/provider/calendar">
                  <Calendar className="h-4 w-4" />
                  Manage Calendar
                </Link>
              </Button>

              <Button variant="outline" className="w-full justify-start gap-3" asChild>
                <Link href="/provider/messages">
                  <MessageSquare className="h-4 w-4" />
                  Messages ({stats.unreadMessages})
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
    </div>
  );
}
