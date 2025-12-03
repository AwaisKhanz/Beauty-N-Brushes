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
  DollarSign,
  TrendingUp,
  Clock,
  CreditCard,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { FinanceSummary, BookingFinancialDetail, Payout } from '@/shared-types/finance.types';
import { toast } from 'sonner';

export default function FinancePage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummary | null>(null);
  const [recentBookings, setRecentBookings] = useState<BookingFinancialDetail[]>([]);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFinanceData();
  }, []);

  async function loadFinanceData() {
    try {
      setLoading(true);
      setError('');

      // Load finance summary (last 30 days by default)
      const [summaryRes, bookingsRes, payoutsRes] = await Promise.all([
        api.finance.getSummary(),
        api.finance.getBookings({ limit: 10, page: 1 }),
        api.finance.getPayouts({ limit: 10, page: 1 }),
      ]);

      setSummary(summaryRes.data.summary);
      setRecentBookings(bookingsRes.data.bookings);
      setPayouts(payoutsRes.data.data.payouts);
    } catch (error: unknown) {
      const message = extractErrorMessage(error) || 'Failed to load finance data';
      setError(message);
      toast.error('Failed to load finance data', {
        description: message,
      });
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number, currency: string = 'USD') {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
    }).format(amount);
  }

  function formatDate(dateString: string) {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  function getPaymentStatusColor(status: string) {
    switch (status) {
      case 'FULLY_PAID':
        return 'bg-success/10 text-success';
      case 'DEPOSIT_PAID':
        return 'bg-warning/10 text-warning';
      case 'PENDING':
        return 'bg-muted text-muted-foreground';
      case 'REFUNDED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  function getPayoutStatusColor(status: string) {
    switch (status) {
      case 'COMPLETED':
        return 'bg-success/10 text-success';
      case 'PROCESSING':
        return 'bg-info/10 text-info';
      case 'PENDING':
        return 'bg-warning/10 text-warning';
      case 'FAILED':
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-5 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
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
          <h1 className="text-3xl font-heading font-bold mb-2">Finance</h1>
          <p className="text-muted-foreground">
            Track your earnings, deposits, and payment activity
          </p>
        </div>
        <Card className="border-destructive/20">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{error || 'Failed to load finance data'}</p>
            <Button onClick={loadFinanceData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasBookings = summary.totalBookings > 0;
  const earningsGrowth = summary.monthlyEarnings - summary.weeklyEarnings * 4;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Finance</h1>
          <p className="text-muted-foreground">Last 30 days • {summary.currency}</p>
        </div>
        <Button variant="outline" disabled>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>

      {/* No Bookings State */}
      {!hasBookings && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-6">
            <div className="text-center space-y-2">
              <DollarSign className="h-12 w-12 mx-auto text-primary" />
              <h3 className="font-semibold text-lg">No Bookings Yet</h3>
              <p className="text-sm text-muted-foreground">
                Your financial dashboard will display data once you receive your first booking.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Total Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalEarnings, summary.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              {earningsGrowth >= 0 ? (
                <ArrowUpRight className="h-3 w-3 text-success" />
              ) : (
                <ArrowDownRight className="h-3 w-3 text-destructive" />
              )}
              {summary.completedBookings} completed bookings
            </p>
          </CardContent>
        </Card>

        {/* Monthly Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Earnings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {formatCurrency(summary.monthlyEarnings, summary.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 30 days</p>
          </CardContent>
        </Card>

        {/* Weekly Earnings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Earnings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.weeklyEarnings, summary.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Last 7 days</p>
          </CardContent>
        </Card>

        {/* Deposits Received */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposits Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalDepositsReceived, summary.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Advance payments</p>
          </CardContent>
        </Card>

        {/* Balance Owed */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Balance Owed</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {formatCurrency(summary.balanceOwed, summary.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Remaining payment due</p>
          </CardContent>
        </Card>

        {/* Platform Service Fees */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Service Fees (Client Paid)</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalServiceFees, summary.currency)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Platform fees (charged to clients)</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Bookings */}
      {hasBookings && recentBookings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Bookings</CardTitle>
            <CardDescription>Latest financial transactions from your bookings</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Service</TableHead>
                  <TableHead className="text-right">Price</TableHead>
                  <TableHead className="text-right">Deposit</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell className="font-medium">{formatDate(booking.bookingDate)}</TableCell>
                    <TableCell>{booking.clientName}</TableCell>
                    <TableCell className="max-w-[200px] truncate">{booking.serviceName}</TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(booking.servicePrice, booking.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(booking.depositAmount, booking.currency)}
                    </TableCell>
                    <TableCell className="text-right">
                      {formatCurrency(booking.balanceOwed, booking.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="secondary"
                        className={getPaymentStatusColor(booking.paymentStatus)}
                      >
                        {booking.paymentStatus.replace('_', ' ')}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Payout History */}
      {payouts.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Payout History</CardTitle>
            <CardDescription>Your recent payout transactions</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Provider</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Reference</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payouts.map((payout) => (
                  <TableRow key={payout.id}>
                    <TableCell className="font-medium">{formatDate(payout.createdAt)}</TableCell>
                    <TableCell className="font-semibold">
                      {formatCurrency(payout.amount, payout.currency)}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{payout.paymentProvider}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className={getPayoutStatusColor(payout.status)}>
                        {payout.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {payout.referenceId || '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}


    </div>
  );
}
