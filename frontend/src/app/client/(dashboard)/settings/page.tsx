'use client';

import { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CreditCard, Bell, Lock, Trash2, Globe } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import { ClientPaymentMethodModal } from '@/components/booking/ClientPaymentMethodModal';
import { RegionSelectionModal } from '@/components/settings/RegionSelectionModal';

interface UserSettings {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  emailNotificationsEnabled?: boolean;
  smsNotificationsEnabled?: boolean;
}

interface PaymentMethod {
  id: string;
  last4: string | null;
  brand: string | null;
  type: 'stripe' | 'paystack';
}

export default function ClientSettingsPage() {
  const [_userData, setUserData] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(true);
  const [savingNotifications, setSavingNotifications] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loadingPaymentMethods, setLoadingPaymentMethods] = useState(true);
  const [regionCode, setRegionCode] = useState<'NA' | 'EU' | 'GH' | 'NG' | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [regionModalOpen, setRegionModalOpen] = useState(false);

  useEffect(() => {
    fetchUserData();
    fetchPaymentMethods();
    
    // Handle Paystack payment method callback
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('payment_method_callback') === 'true') {
      // Paystack may send 'reference' or 'trxref' parameter
      // Also check localStorage as fallback (stored during initialization)
      const reference = urlParams.get('reference') || urlParams.get('trxref') || localStorage.getItem('paystack_payment_method_reference');
      
      if (reference) {
        // Clear stored reference
        localStorage.removeItem('paystack_payment_method_reference');
        handlePaystackCallback(reference);
      } else {
        // If no reference, show error
        console.error('No reference found in URL params or localStorage:', window.location.search);
        toast.error('Payment reference not found. Please try again.');
      }
      // Clean up URL after processing
      // Delay to ensure callback completes
      setTimeout(() => {
        window.history.replaceState({}, '', '/client/settings');
      }, 1000);
    }
  }, []);

  async function handlePaystackCallback(reference: string) {
    try {
      setLoadingPaymentMethods(true);
      // Verify the transaction
      const verifyRes = await api.payment.verifyPaystack(reference);

      if (verifyRes.data.status === 'success' && verifyRes.data.authorization?.authorization_code) {
        // Save the payment method with authorization details
        await api.users.addPaymentMethod({
          paymentMethodId: verifyRes.data.authorization.authorization_code,
          last4: verifyRes.data.authorization.last4 || null,
          brand: verifyRes.data.authorization.brand || null,
        });

        // Refresh payment methods
        await fetchPaymentMethods();
        toast.success('Payment method added successfully');
      } else {
        toast.error('Failed to verify payment method. Please try again.');
      }
    } catch (err: unknown) {
      console.error('Paystack callback error:', err);
      toast.error(extractErrorMessage(err) || 'Failed to save payment method');
    } finally {
      setLoadingPaymentMethods(false);
    }
  }

  async function fetchUserData() {
    try {
      setLoading(true);
      setError('');
      const res = await api.auth.me();
      setUserData(res.data.user);
      setEmailNotifications(res.data.user.emailNotifications ?? true);
      setSmsNotifications(res.data.user.smsNotifications ?? true);
      
      // Set regionCode from user data if available
      if (res.data.user.regionCode) {
        setRegionCode(res.data.user.regionCode as 'NA' | 'EU' | 'GH' | 'NG');
      } else {
        // No region set - will show region selection modal
        setRegionCode(null);
      }
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }

  async function fetchPaymentMethods() {
    try {
      setLoadingPaymentMethods(true);
      const res = await api.users.getPaymentMethods();
      setPaymentMethods(res.data.paymentMethods || []);
      if (res.data.regionCode) {
        setRegionCode(res.data.regionCode as 'NA' | 'EU' | 'GH' | 'NG');
      }
    } catch (err: unknown) {
      // Silently fail - payment methods are optional
      console.error('Failed to load payment methods:', err);
    } finally {
      setLoadingPaymentMethods(false);
    }
  }

  async function handleNotificationChange() {
    try {
      setSavingNotifications(true);

      await api.users.updateNotifications({
        emailNotificationsEnabled: emailNotifications,
        smsNotificationsEnabled: smsNotifications,
      });

      toast.success('Notification preferences updated');
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to update preferences');
    } finally {
      setSavingNotifications(false);
    }
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (
      !passwordData.currentPassword ||
      !passwordData.newPassword ||
      !passwordData.confirmPassword
    ) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      setSavingPassword(true);

      await api.users.updatePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });

      toast.success('Password updated successfully');

      // Clear form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
    } catch (err: unknown) {
      toast.error(extractErrorMessage(err) || 'Failed to update password');
    } finally {
      setSavingPassword(false);
    }
  }

  if (loading) {
    return <SettingsSkeleton />;
  }

  if (error) {
    return (
      <div className="max-w-3xl space-y-6">
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Settings</h1>
        <p className="text-muted-foreground">Manage your account preferences</p>
      </div>

      {/* Notifications */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Manage how you receive notifications</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive booking confirmations and updates via email
              </p>
            </div>
            <Switch
              checked={emailNotifications}
              onCheckedChange={(checked) => {
                setEmailNotifications(checked);
                handleNotificationChange();
              }}
              disabled={savingNotifications}
            />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>SMS Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive text message reminders for appointments
              </p>
            </div>
            <Switch
              checked={smsNotifications}
              onCheckedChange={(checked) => {
                setSmsNotifications(checked);
                handleNotificationChange();
              }}
              disabled={savingNotifications}
            />
          </div>
        </CardContent>
      </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Payment Methods</CardTitle>
                  <CardDescription>
                    {regionCode
                      ? `Manage your saved payment methods (${regionCode === 'NA' ? 'North America' : regionCode === 'EU' ? 'Europe' : regionCode === 'GH' ? 'Ghana' : 'Nigeria'})`
                      : 'Select your region first to enable payment methods'}
                  </CardDescription>
                </div>
              </div>
              {regionCode && (
                <Button
                  onClick={() => setRegionModalOpen(true)}
                  variant="ghost"
                  size="sm"
                  className="gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Change Region
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {!regionCode ? (
              <div className="text-center py-8">
                <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-sm text-muted-foreground mb-4">
                  Please select your region to enable payment methods
                </p>
                <Button onClick={() => setRegionModalOpen(true)} variant="outline">
                  <Globe className="h-4 w-4 mr-2" />
                  Select Region
                </Button>
              </div>
            ) : (
              <>
          {loadingPaymentMethods ? (
            <div className="text-center py-8">
              <Skeleton className="h-12 w-12 mx-auto mb-4" />
              <Skeleton className="h-4 w-48 mx-auto mb-2" />
              <Skeleton className="h-3 w-64 mx-auto" />
            </div>
          ) : paymentMethods.length > 0 ? (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <CreditCard className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">
                        {method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : 'Card'}{' '}
                        {method.last4 ? `•••• ${method.last4}` : ''}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.type === 'stripe' ? 'Stripe' : 'Paystack'}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">Default</Badge>
                </div>
              ))}
              <Button
                onClick={() => setPaymentModalOpen(true)}
                variant="outline"
                className="w-full mt-4"
              >
                <CreditCard className="h-4 w-4 mr-2" />
                Replace Payment Method
              </Button>
            </div>
          ) : (
            <div className="text-center py-8">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-sm text-muted-foreground mb-4">No saved payment methods yet</p>
              <p className="text-xs text-muted-foreground mb-4">
                Add a payment method to speed up future bookings
              </p>
              <Button onClick={() => setPaymentModalOpen(true)} variant="outline">
                <CreditCard className="h-4 w-4 mr-2" />
                Add Payment Method
              </Button>
            </div>
          )}
              </>
            )}
          </CardContent>
        </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Security</CardTitle>
              <CardDescription>Manage your password and security settings</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                placeholder="••••••••"
                className="max-w-md"
                value={passwordData.currentPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, currentPassword: e.target.value }))
                }
                disabled={savingPassword}
              />
            </div>

            <div>
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                placeholder="••••••••"
                className="max-w-md"
                value={passwordData.newPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, newPassword: e.target.value }))
                }
                disabled={savingPassword}
              />
              <p className="text-xs text-muted-foreground mt-1">Must be at least 8 characters</p>
            </div>

            <div>
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                placeholder="••••••••"
                className="max-w-md"
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData((prev) => ({ ...prev, confirmPassword: e.target.value }))
                }
                disabled={savingPassword}
              />
            </div>

            <Button type="submit" variant="outline" disabled={savingPassword}>
              {savingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-destructive" />
            <div>
              <CardTitle className="text-destructive">Danger Zone</CardTitle>
              <CardDescription>Irreversible account actions</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Deactivate Account</p>
              <p className="text-sm text-muted-foreground">
                Contact support to temporarily disable your account
              </p>
            </div>
            <Button
              variant="outline"
              className="border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
              disabled
            >
              Contact Support
            </Button>
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Delete Account</p>
              <p className="text-sm text-muted-foreground">
                Contact support to permanently delete your account and all data
              </p>
            </div>
            <Button variant="destructive" disabled>
              Contact Support
            </Button>
          </div>

          <Alert className="mt-4">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              For account deactivation or deletion, please contact our support team at
              support@beautynbrushes.com
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Region Selection Modal */}
      <RegionSelectionModal
        open={regionModalOpen}
        onOpenChange={setRegionModalOpen}
        currentRegion={regionCode || undefined}
        onSuccess={() => {
          setRegionModalOpen(false);
          fetchUserData();
          fetchPaymentMethods();
          toast.success('Region updated successfully');
        }}
      />

      {/* Payment Method Modal */}
      {regionCode && (
        <ClientPaymentMethodModal
          open={paymentModalOpen}
          onOpenChange={setPaymentModalOpen}
          regionCode={regionCode}
          onSuccess={() => {
            setPaymentModalOpen(false);
            fetchPaymentMethods();
            toast.success('Payment method added successfully');
          }}
        />
      )}
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <Skeleton className="h-10 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
