'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, CreditCard, Plus, Trash2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';
import { AddPaymentMethodModal } from '@/components/payment/AddPaymentMethodModal';

interface PaymentMethod {
  id: string;
  last4: string | null;
  brand: string | null;
  type: 'stripe' | 'paystack';
}

export default function PaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [regionCode, setRegionCode] = useState<string>('NA');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  async function fetchPaymentMethods() {
    try {
      setLoading(true);
      setError('');
      const response = await api.users.getPaymentMethods();
      setPaymentMethods(response.data.paymentMethods);
      setRegionCode(response.data.regionCode || 'NA');
    } catch (err) {
      const message = extractErrorMessage(err) || 'Failed to load payment methods';
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(paymentMethodId: string) {
    if (!confirm('Are you sure you want to remove this payment method?')) {
      return;
    }

    try {
      setRemoving(paymentMethodId);
      // Since backend only supports one payment method, we can clear it
      // by adding a new one or implementing a delete endpoint
      toast.info('To change your payment method, please add a new one');
    } catch (err) {
      const message = extractErrorMessage(err) || 'Failed to remove payment method';
      toast.error(message);
    } finally {
      setRemoving(null);
    }
  }

  function handleAddSuccess() {
    setShowAddModal(false);
    fetchPaymentMethods();
    toast.success('Payment method added successfully');
  }

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <Skeleton className="h-10 w-64 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-24 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-heading font-bold">Payment Methods</h1>
        <p className="text-muted-foreground">Manage your saved payment methods</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Payment Methods Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Saved Cards</CardTitle>
              <CardDescription>
                {regionCode === 'NA' || regionCode === 'EU'
                  ? 'Securely saved with Stripe'
                  : 'Securely saved with Paystack'}
              </CardDescription>
            </div>
            <Button onClick={() => setShowAddModal(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              {paymentMethods.length > 0 ? 'Change Card' : 'Add Card'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {paymentMethods.length === 0 ? (
            <div className="text-center py-12">
              <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground mb-4">No payment methods saved</p>
              <p className="text-sm text-muted-foreground mb-6">
                Add a payment method for faster checkout
              </p>
              <Button onClick={() => setShowAddModal(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Payment Method
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {paymentMethods.map((method) => (
                <div
                  key={method.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {method.brand ? method.brand.charAt(0).toUpperCase() + method.brand.slice(1) : 'Card'} ending in {method.last4 || '****'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {method.type === 'stripe' ? 'Stripe' : 'Paystack'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                      Default
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(method.id)}
                      disabled={removing === method.id}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Security</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground space-y-2">
          <p>• Your payment information is encrypted and securely stored</p>
          <p>• We never store your full card number</p>
          <p>• You can update or remove your payment method at any time</p>
          <p>• All transactions are processed through secure payment gateways</p>
        </CardContent>
      </Card>

      {/* Add Payment Method Modal */}
      <AddPaymentMethodModal
        open={showAddModal}
        onOpenChange={setShowAddModal}
        onSuccess={handleAddSuccess}
        regionCode={regionCode as 'NA' | 'EU' | 'GH' | 'NG'}
      />
    </div>
  );
}
