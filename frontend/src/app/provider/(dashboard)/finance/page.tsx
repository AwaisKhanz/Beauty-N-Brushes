'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { DollarSign, TrendingUp, Clock, CreditCard } from 'lucide-react';

export default function FinancePage() {
  // Mock data - will be replaced with actual API data
  const financialSummary = {
    totalEarnings: 0,
    depositsReceived: 0,
    balanceOwed: 0,
    cashCollected: 0,
    platformCommission: 0,
    totalBookings: 0,
  };

  const hasBookings = financialSummary.totalBookings > 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">Finance</h1>
        <p className="text-muted-foreground">Track your earnings, deposits, and payment activity</p>
      </div>

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
            <div className="text-2xl font-bold">${financialSummary.totalEarnings.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">All time earnings</p>
          </CardContent>
        </Card>

        {/* Deposits Received */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deposits Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${financialSummary.depositsReceived.toFixed(2)}
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
              ${financialSummary.balanceOwed.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Remaining payment due</p>
          </CardContent>
        </Card>

        {/* Cash Collected */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cash Collected</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${financialSummary.cashCollected.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">In-person payments</p>
          </CardContent>
        </Card>

        {/* Platform Commission */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Platform Commission</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${financialSummary.platformCommission.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Service fees collected</p>
          </CardContent>
        </Card>

        {/* Total Bookings */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Bookings</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.totalBookings}</div>
            <p className="text-xs text-muted-foreground mt-1">All time bookings</p>
          </CardContent>
        </Card>
      </div>

      {/* Upcoming Features */}
      {hasBookings && (
        <Card>
          <CardHeader>
            <CardTitle>Transaction History</CardTitle>
            <CardDescription>View detailed transaction history and export reports</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-sm">Transaction history will appear here</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
