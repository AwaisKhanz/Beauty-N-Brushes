'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DollarSign, Heart, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { toast } from 'sonner';

interface TipPaymentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  currency: string;
  onSuccess: () => void;
}

const TIP_AMOUNTS = [5, 10, 15, 20, 25, 50];

export function TipPaymentModal({
  open,
  onOpenChange,
  bookingId,
  currency,
  onSuccess,
}: TipPaymentModalProps) {
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTipSubmit = async () => {
    try {
      setLoading(true);
      setError('');

      const amount = customAmount ? parseFloat(customAmount) : tipAmount;

      if (amount <= 0) {
        setError('Please enter a valid tip amount');
        return;
      }

      const response = await api.payment.payTip({
        bookingId,
        tipAmount: amount,
      });

      if (response.data.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
        return;
      }

      toast.success('Tip sent successfully!', {
        description: `Thank you for tipping $${amount}`,
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      const errorMessage = extractErrorMessage(err) || 'Failed to send tip';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAmountSelect = (amount: number) => {
    setTipAmount(amount);
    setCustomAmount('');
  };

  const handleCustomAmountChange = (value: string) => {
    setCustomAmount(value);
    setTipAmount(0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Heart className="h-5 w-5 text-accent" />
            Send a Tip
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Show your appreciation for great service
            </p>
          </div>

          {/* Quick tip amounts */}
          <div className="space-y-3">
            <Label>Quick tip amounts</Label>
            <div className="grid grid-cols-3 gap-2">
              {TIP_AMOUNTS.map((amount) => (
                <Button
                  key={amount}
                  variant={tipAmount === amount ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleAmountSelect(amount)}
                  disabled={loading}
                >
                  {formatCurrency(amount)}
                </Button>
              ))}
            </div>
          </div>

          {/* Custom amount */}
          <div className="space-y-2">
            <Label htmlFor="custom-amount">Custom amount</Label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="custom-amount"
                type="number"
                placeholder="0.00"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                className="pl-10"
                disabled={loading}
                min="0"
                step="0.01"
              />
            </div>
          </div>

          {/* Error message */}
          {error && <div className="text-sm text-destructive text-center">{error}</div>}

          {/* Selected amount display */}
          {(tipAmount > 0 || customAmount) && (
            <div className="bg-accent/10 border border-accent/20 rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">You're tipping</p>
              <p className="text-2xl font-bold text-primary">
                {formatCurrency(customAmount ? parseFloat(customAmount) : tipAmount)}
              </p>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleTipSubmit}
              disabled={loading || (tipAmount === 0 && !customAmount)}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Tip'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
