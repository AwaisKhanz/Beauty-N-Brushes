'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Check, Loader2, TrendingUp, TrendingDown } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import type { ChangeTierRequest } from '@/shared-types/settings.types';

interface ChangeTierModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentTier: 'solo' | 'salon';
  currency: string;
}

const TIER_INFO = {
  solo: {
    name: 'Solo Professional',
    price: 19,
    features: [
      'Personal booking page',
      'Unlimited services',
      'Calendar integration',
      'Client messaging',
      'Analytics dashboard',
      'Mobile app access',
    ],
  },
  salon: {
    name: 'Salon',
    price: 49,
    features: [
      'Everything in Solo, plus:',
      'Multiple team members (up to 10)',
      'Team management dashboard',
      'Individual stylist profiles',
      'Team performance analytics',
      'Centralized booking management',
      'Priority support',
    ],
  },
};

export function ChangeTierModal({
  open,
  onClose,
  onSuccess,
  currentTier,
  currency,
}: ChangeTierModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const newTier = currentTier === 'solo' ? 'salon' : 'solo';
  const isUpgrade = newTier === 'salon';
  const currentInfo = TIER_INFO[currentTier];
  const newInfo = TIER_INFO[newTier];

  async function handleChangeTier() {
    try {
      setLoading(true);
      setError('');

      const data: ChangeTierRequest = {
        newTier,
      };

      await api.settings.changeTier(data);
      onSuccess();
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to change subscription tier');
    } finally {
      setLoading(false);
    }
  }

  function formatCurrency(amount: number) {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isUpgrade ? (
              <>
                <TrendingUp className="h-5 w-5 text-success" />
                Upgrade to Salon Plan
              </>
            ) : (
              <>
                <TrendingDown className="h-5 w-5" />
                Downgrade to Solo Plan
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {isUpgrade
              ? 'Get access to team management and advanced features'
              : 'Switch to solo plan if you no longer need team features'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Current Plan */}
          <div>
            <p className="text-sm font-medium mb-2">Current Plan</p>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{currentInfo.name}</h3>
                  <Badge variant="outline">Current</Badge>
                </div>
                <p className="text-2xl font-bold">{formatCurrency(currentInfo.price)}/month</p>
              </CardContent>
            </Card>
          </div>

          {/* New Plan */}
          <div>
            <p className="text-sm font-medium mb-2">New Plan</p>
            <Card className="border-primary">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold">{newInfo.name}</h3>
                  <Badge variant="default">{isUpgrade ? 'Upgrade' : 'Downgrade'}</Badge>
                </div>
                <p className="text-2xl font-bold mb-4">{formatCurrency(newInfo.price)}/month</p>

                <div className="space-y-2">
                  {newInfo.features.map((feature, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-success mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Pro-rated Billing Info */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isUpgrade ? (
                <>
                  You'll be charged a pro-rated amount for the rest of your billing cycle. Your next
                  full billing will be {formatCurrency(newInfo.price)} on your next billing date.
                </>
              ) : (
                <>
                  You'll receive a pro-rated credit for the downgrade. Your next billing will be{' '}
                  {formatCurrency(newInfo.price)} at your next billing date.
                </>
              )}
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleChangeTier} disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              `${isUpgrade ? 'Upgrade' : 'Downgrade'} to ${newInfo.name}`
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
