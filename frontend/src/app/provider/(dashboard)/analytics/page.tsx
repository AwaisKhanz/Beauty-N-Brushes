'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  TrendingUp,
  Users,
  DollarSign,
  Calendar,
  Star,
  Eye,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Download,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type {
  AnalyticsSummary,
  BookingTrend,
  ServicePerformance,
  ClientDemographics,
  RevenueBreakdown,
} from '@/shared-types/analytics.types';
import { toast } from 'sonner';

export default function AnalyticsPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [trends, setTrends] = useState<BookingTrend[]>([]);
  const [topServices, setTopServices] = useState<ServicePerformance[]>([]);
  const [demographics, setDemographics] = useState<ClientDemographics | null>(null);
  const [revenueBreakdown, setRevenueBreakdown] = useState<RevenueBreakdown | null>(null);
  const [error, setError] = useState('');
  const [dateRange] = useState({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadAnalytics();
  }, []);

  async function loadAnalytics() {
    try {
      setLoading(true);
      setError('');

      // Load all analytics data (last 30 days default)
      const [summaryRes, trendsRes, servicesRes, clientsRes, revenueRes] = await Promise.all([
        api.analytics.getSummary(),
        api.analytics.getTrends({
          startDate: dateRange.startDate,
          endDate: dateRange.endDate,
          interval: 'day',
        }),
        api.analytics.getServices({ sortBy: 'bookings', limit: 5 }),
        api.analytics.getClients(),
        api.analytics.getRevenue(),
      ]);

      setSummary(summaryRes.data.summary);
      setTrends(trendsRes.data.trends);
      setTopServices(servicesRes.data.services);
      setDemographics(clientsRes.data.demographics);
      setRevenueBreakdown(revenueRes.data.breakdown);
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to load analytics';
      setError(message);
      toast.error('Failed to load analytics', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  }

  function formatPercentage(value: number) {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Track your performance and growth</p>
        </div>
        <Card className="border-destructive/20">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || 'Failed to load analytics'}</p>
            <Button onClick={loadAnalytics} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasBookings = summary.totalBookings > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Analytics</h1>
          <p className="text-muted-foreground">Last 30 days performance overview</p>
        </div>
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* No Data State */}
      {!hasBookings && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <TrendingUp className="h-12 w-12 mx-auto text-primary" />
              <h3 className="font-semibold text-lg">No Data Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your analytics will appear once you start receiving bookings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics Row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
              {summary.monthOverMonthGrowth >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              <span
                className={summary.monthOverMonthGrowth >= 0 ? 'text-success' : 'text-destructive'}
              >
                {formatPercentage(summary.monthOverMonthGrowth)}
              </span>
              {' vs previous period'}
            </p>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.completedBookings} completed • {summary.cancelledBookings} cancelled
            </p>
          </CardContent>
        </Card>

        {/* Total Clients */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.totalClients}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {summary.newClients} new • {summary.returningClients} returning
            </p>
          </CardContent>
        </Card>

        {/* Average Rating */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Average Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              {summary.averageRating.toFixed(1)}
              <Star className="h-5 w-5 fill-rating-filled text-rating-filled" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">{summary.totalReviews} reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Key Metrics Row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Average Booking Value */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Booking Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.averageBookingValue)}</div>
            <p className="text-xs text-muted-foreground mt-1">Per completed booking</p>
          </CardContent>
        </Card>

        {/* Profile Views */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.profileViews}</div>
            <p className="text-xs text-muted-foreground mt-1">Total views</p>
          </CardContent>
        </Card>

        {/* Conversion Rate */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Views to bookings</p>
          </CardContent>
        </Card>

        {/* Client Retention */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Client Retention</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{summary.clientRetentionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground mt-1">Returning clients</p>
          </CardContent>
        </Card>
      </div>

      {/* Booking Trends Chart */}
      {trends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Booking Trends</CardTitle>
            <CardDescription>Daily bookings and revenue over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-1">
              {trends.map((trend, index) => {
                const maxBookings = Math.max(...trends.map((t) => t.bookingCount));
                const height = maxBookings > 0 ? (trend.bookingCount / maxBookings) * 100 : 0;

                return (
                  <div
                    key={index}
                    className="flex-1 flex flex-col items-center justify-end group cursor-pointer"
                  >
                    <div
                      className="w-full bg-primary/70 hover:bg-primary transition-colors rounded-t"
                      style={{ height: `${height}%` }}
                      title={`${trend.date}: ${trend.bookingCount} bookings, ${formatCurrency(trend.revenue)} revenue`}
                    />
                    {index % 3 === 0 && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(trend.date).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-4 flex items-center justify-center gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-primary" />
                <span>Bookings per day</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Services and Client Demographics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Services */}
        {topServices.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Top Services</CardTitle>
              <CardDescription>Your most popular services by bookings</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service</TableHead>
                    <TableHead className="text-right">Bookings</TableHead>
                    <TableHead className="text-right">Revenue</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {topServices.map((service, index) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Badge
                            variant="outline"
                            className="h-6 w-6 rounded-full p-0 flex items-center justify-center"
                          >
                            {index + 1}
                          </Badge>
                          <div>
                            <p className="font-medium">{service.title}</p>
                            <p className="text-xs text-muted-foreground">{service.category}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {service.bookingCount}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(service.revenue)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Client Demographics */}
        {demographics && (
          <Card>
            <CardHeader>
              <CardTitle>Top Clients</CardTitle>
              <CardDescription>Your most loyal clients</CardDescription>
            </CardHeader>
            <CardContent>
              {demographics.topClients.length > 0 ? (
                <div className="space-y-4">
                  {demographics.topClients.map((client, index) => (
                    <div key={client.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge
                          variant="outline"
                          className="h-8 w-8 rounded-full p-0 flex items-center justify-center"
                        >
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {client.bookingCount} bookings
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatCurrency(client.totalSpent)}</p>
                        <p className="text-xs text-muted-foreground">
                          Last:{' '}
                          {new Date(client.lastBookingDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No client data yet</p>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Revenue Breakdown */}
      {revenueBreakdown && revenueBreakdown.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Revenue by Service Category</CardTitle>
            <CardDescription>How your revenue breaks down across service types</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {revenueBreakdown.byCategory.map((cat) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{cat.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {formatCurrency(cat.revenue)} ({cat.percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${cat.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Client Demographics by Category */}
      {demographics && demographics.byCategory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Client Preferences</CardTitle>
            <CardDescription>Which services attract the most clients</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {demographics.byCategory.map((cat) => (
                <div key={cat.category} className="text-center p-4 border rounded-lg">
                  <p className="text-2xl font-bold text-primary">{cat.clientCount}</p>
                  <p className="text-sm font-medium mt-1">{cat.category}</p>
                  <p className="text-xs text-muted-foreground">{cat.percentage.toFixed(1)}%</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Insights Card */}
      <Card className="border-info/20 bg-info/5">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-info/10 rounded-full">
              <TrendingUp className="h-5 w-5 text-info" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold mb-2">Key Insights</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                {summary.topService && (
                  <p className="text-muted-foreground">
                    ✨ <strong>{summary.topService.title}</strong> is your most popular service with{' '}
                    {summary.topService.bookingCount} bookings
                  </p>
                )}
                <p className="text-muted-foreground">
                  📈 Your conversion rate is <strong>{summary.conversionRate.toFixed(1)}%</strong>{' '}
                  (profile views → bookings)
                </p>
                <p className="text-muted-foreground">
                  👥 <strong>{demographics?.repeatClientRate.toFixed(1)}%</strong> of your clients
                  are repeat customers
                </p>
                <p className="text-muted-foreground">
                  💰 Average booking value is{' '}
                  <strong>{formatCurrency(summary.averageBookingValue)}</strong>
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
