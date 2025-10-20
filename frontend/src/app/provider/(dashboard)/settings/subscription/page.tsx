'use client';

import { useEffect, useState } from 'react';
import { SettingsLayout } from '@/components/settings/SettingsLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  AlertCircle,
  CreditCard,
  Calendar,
  Download,
  CheckCircle2,
  Clock,
  XCircle,
  ArrowUpDown,
} from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { PaymentMethodModal } from '@/components/settings/PaymentMethodModal';
import { ChangeTierModal } from '@/components/settings/ChangeTierModal';
import { CancelSubscriptionModal } from '@/components/settings/CancelSubscriptionModal';
import type { SubscriptionInfoResponse, BillingRecord } from '@/shared-types/settings.types';

export default function SubscriptionPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [subscription, setSubscription] = useState<SubscriptionInfoResponse | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [changeTierModalOpen, setChangeTierModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  useEffect(() => {
    fetchSubscriptionInfo();
  }, []);

  async function fetchSubscriptionInfo() {
    try {
      setLoading(true);
      setError('');

      const response = await api.settings.getSubscription();
      setSubscription(response.data);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load subscription information');
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case 'trial':
        return (
          <Badge variant="outline" className="gap-1">
            <Clock className="h-3 w-3" />
            Trial
          </Badge>
        );
      case 'active':
        return (
          <Badge className="bg-success gap-1">
            <CheckCircle2 className="h-3 w-3" />
            Active
          </Badge>
        );
      case 'past_due':
        return (
          <Badge variant="destructive" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            Past Due
          </Badge>
        );
      case 'cancelled':
      case 'expired':
        return (
          <Badge variant="secondary" className="gap-1">
            <XCircle className="h-3 w-3" />
            {status === 'cancelled' ? 'Cancelled' : 'Expired'}
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  }

  function formatCurrency(amount: number, currency: string) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  }

  function getDaysRemaining(trialEndDate: string | null) {
    if (!trialEndDate) return 0;
    const end = new Date(trialEndDate);
    const now = new Date();
    const diff = end.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  if (loading) {
    return (
      <SettingsLayout
        title="Subscription & Payment"
        description="Manage subscription plan and payment method"
      >
        <div className="space-y-6">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </SettingsLayout>
    );
  }

  if (error || !subscription) {
    return (
      <SettingsLayout
        title="Subscription & Payment"
        description="Manage subscription plan and payment method"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error || 'Failed to load subscription information'}</AlertDescription>
        </Alert>
      </SettingsLayout>
    );
  }

  const daysRemaining = getDaysRemaining(subscription.trialEndDate);

  return (
    <SettingsLayout
      title="Subscription & Payment"
      description="Manage subscription plan and payment method"
    >
      <div className="space-y-6">
        {/* Current Plan */}
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>Your active subscription details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Plan Type</p>
                <p className="text-2xl font-bold capitalize">{subscription.subscriptionTier}</p>
              </div>
              {getStatusBadge(subscription.subscriptionStatus)}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Monthly Fee</p>
                <p className="text-xl font-semibold">
                  {formatCurrency(subscription.monthlyFee, subscription.currency)}
                </p>
              </div>

              {subscription.subscriptionStatus === 'trial' ? (
                <div>
                  <p className="text-sm text-muted-foreground">Trial Ends</p>
                  <p className="text-xl font-semibold">{daysRemaining} days remaining</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(subscription.trialEndDate)}
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-muted-foreground">Next Billing Date</p>
                  <p className="text-xl font-semibold">
                    {formatDate(subscription.nextBillingDate)}
                  </p>
                </div>
              )}
            </div>

            {subscription.subscriptionStatus === 'trial' && (
              <Alert className="bg-info/10 border-info/20">
                <Calendar className="h-4 w-4 text-info" />
                <AlertDescription className="text-info">
                  You have {daysRemaining} days left in your free trial. You will be charged{' '}
                  {formatCurrency(subscription.monthlyFee, subscription.currency)} after{' '}
                  {formatDate(subscription.trialEndDate)}.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Payment Method */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Payment Method</CardTitle>
                <CardDescription>Your default payment method for subscriptions</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => setPaymentModalOpen(true)}>
                Update Payment Method
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {subscription.last4Digits ? (
              <div className="flex items-center gap-4 p-4 border rounded-lg">
                <div className="p-2 bg-primary/10 rounded">
                  <CreditCard className="h-6 w-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold capitalize">
                    {subscription.cardBrand || 'Card'} ending in {subscription.last4Digits}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Payment provider:{' '}
                    {subscription.paymentProvider === 'stripe' ? 'Stripe' : 'Paystack'}
                  </p>
                </div>
              </div>
            ) : (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  No payment method on file. Please add a payment method to continue after your
                  trial ends.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Subscription Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Subscription Management</CardTitle>
            <CardDescription>Change your plan or cancel subscription</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div>
                <p className="font-medium">Change Subscription Tier</p>
                <p className="text-sm text-muted-foreground">
                  {subscription.subscriptionTier === 'solo'
                    ? 'Upgrade to Salon plan for team features'
                    : 'Downgrade to Solo plan if you no longer need team features'}
                </p>
              </div>
              <Button variant="outline" onClick={() => setChangeTierModalOpen(true)}>
                <ArrowUpDown className="mr-2 h-4 w-4" />
                Change Plan
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg border-destructive/20">
              <div>
                <p className="font-medium text-destructive">Cancel Subscription</p>
                <p className="text-sm text-muted-foreground">
                  End your subscription. Access continues until{' '}
                  {formatDate(subscription.nextBillingDate)}
                </p>
              </div>
              <Button variant="destructive" onClick={() => setCancelModalOpen(true)}>
                Cancel Plan
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Billing History */}
        <Card>
          <CardHeader>
            <CardTitle>Billing History</CardTitle>
            <CardDescription>Your past subscription invoices and payments</CardDescription>
          </CardHeader>
          <CardContent>
            {subscription.billingHistory && subscription.billingHistory.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Invoice</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {subscription.billingHistory.map((record: BillingRecord) => (
                    <TableRow key={record.id}>
                      <TableCell>{formatDate(record.date)}</TableCell>
                      <TableCell>{formatCurrency(record.amount, record.currency)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={record.status === 'paid' ? 'default' : 'secondary'}
                          className="capitalize"
                        >
                          {record.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {record.invoiceUrl ? (
                          <Button variant="ghost" size="sm" asChild>
                            <a
                              href={record.invoiceUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </a>
                          </Button>
                        ) : (
                          <span className="text-sm text-muted-foreground">N/A</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No billing history yet</p>
                <p className="text-sm mt-1">
                  Your invoices will appear here after your first payment
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      {subscription && (
        <>
          <PaymentMethodModal
            open={paymentModalOpen}
            onClose={() => setPaymentModalOpen(false)}
            onSuccess={() => {
              setPaymentModalOpen(false);
              fetchSubscriptionInfo();
            }}
            region={
              subscription.paymentProvider === 'stripe'
                ? subscription.currency === 'USD'
                  ? 'NA'
                  : 'EU'
                : subscription.currency === 'GHS'
                  ? 'GH'
                  : 'NG'
            }
            paymentProvider={subscription.paymentProvider}
          />

          <ChangeTierModal
            open={changeTierModalOpen}
            onClose={() => setChangeTierModalOpen(false)}
            onSuccess={() => {
              setChangeTierModalOpen(false);
              fetchSubscriptionInfo();
            }}
            currentTier={subscription.subscriptionTier}
            currency={subscription.currency}
          />

          <CancelSubscriptionModal
            open={cancelModalOpen}
            onClose={() => setCancelModalOpen(false)}
            onSuccess={(accessUntil) => {
              setCancelModalOpen(false);
              alert(`Subscription cancelled. You'll have access until ${formatDate(accessUntil)}`);
              fetchSubscriptionInfo();
            }}
            subscriptionTier={subscription.subscriptionTier}
            nextBillingDate={subscription.nextBillingDate}
          />
        </>
      )}
    </SettingsLayout>
  );
}
