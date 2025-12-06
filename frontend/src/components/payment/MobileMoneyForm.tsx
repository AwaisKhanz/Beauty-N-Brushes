/**
 * Mobile Money Payment Form Component
 * Phase 4.1: Mobile Money Implementation for Ghana
 * 
 * Supports: MTN, Vodafone, AirtelTigo
 * Uses global theme colors
 */

'use client';

import { useState } from 'react';
import { formatCurrency } from '@/lib/utils';
import { api } from '@/lib/api';
import { extractErrorMessage } from '@/lib/error-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Smartphone, CheckCircle2, Info } from 'lucide-react';

interface MobileMoneyFormProps {
  amount: number;
  currency: 'GHS' | 'NGN';
  bookingId: string;
  _onSuccess: () => void;
  onError: (error: Error) => void;
}

const MOBILE_MONEY_PROVIDERS = {
  GHS: [
    { value: 'mtn', label: 'MTN Mobile Money', icon: '📱' },
    { value: 'vod', label: 'Vodafone Cash', icon: '📱' },
    { value: 'atl', label: 'AirtelTigo Money', icon: '📱' },
  ],
  NGN: [
    { value: 'mtn', label: 'MTN Mobile Money', icon: '📱' },
  ],
};

export function MobileMoneyForm({
  amount,
  currency,
  bookingId,
  // _onSuccess,
  onError,
}: MobileMoneyFormProps) {
  const [provider, setProvider] = useState(MOBILE_MONEY_PROVIDERS[currency][0].value);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const providers = MOBILE_MONEY_PROVIDERS[currency];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneNumber) {
      onError(new Error('Please enter your mobile money number'));
      return;
    }

    setIsProcessing(true);

    try {
      // Initialize payment with mobile money channel
      const response = await api.payment.initializeBookingPayment({
        bookingId: bookingId,
        paymentChannel: 'mobile_money',
        mobileMoneyProvider: provider as 'mtn' | 'vod' | 'atl',
        phoneNumber: phoneNumber,
      });

      // Redirect to authorization URL
      if (response.data.authorizationUrl) {
        window.location.href = response.data.authorizationUrl;
      } else {
        onError(new Error('No authorization URL received'));
      }
    } catch (error) {
      onError(new Error(extractErrorMessage(error) || 'Failed to initialize mobile money payment'));
    } finally {
      setIsProcessing(false);
    }
  };

  const formatPhoneNumber = (value: string) => {
    // Remove non-digits
    const digits = value.replace(/\D/g, '');
    
    // Format as Ghana number (0XX XXX XXXX)
    if (currency === 'GHS') {
      if (digits.length <= 3) return digits;
      if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
      return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 10)}`;
    }
    
    // Format as Nigeria number (+234 XXX XXX XXXX)
    return digits;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Pay with Mobile Money</h3>
      </div>

      {/* Provider Selection */}
      <div className="space-y-3">
        <Label>Select Provider</Label>
        <div className="grid gap-2">
          {providers.map((p) => (
            <button
              key={p.value}
              type="button"
              onClick={() => setProvider(p.value)}
              className={`p-4 border-2 rounded-lg flex items-center justify-between transition-all ${
                provider === p.value
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">{p.icon}</span>
                <span className="font-medium text-foreground">{p.label}</span>
              </div>
              {provider === p.value && (
                <CheckCircle2 className="h-5 w-5 text-primary" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Phone Number Input */}
      <div className="space-y-2">
        <Label htmlFor="phone">Mobile Money Number</Label>
        <Input
          id="phone"
          type="tel"
          value={phoneNumber}
          onChange={(e) => setPhoneNumber(formatPhoneNumber(e.target.value))}
          placeholder={currency === 'GHS' ? '0XX XXX XXXX' : '+234 XXX XXX XXXX'}
          required
        />
        <p className="text-xs text-muted-foreground">
          Enter the number registered with {providers.find(p => p.value === provider)?.label}
        </p>
      </div>

      {/* Amount Display */}
      <div className="p-4 bg-muted rounded-lg">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Amount to Pay:</span>
          <span className="text-xl font-bold text-foreground">
            {formatCurrency(amount, currency)}
          </span>
        </div>
      </div>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          📱 You will receive a prompt on your phone to approve this payment.
          Please enter your Mobile Money PIN to complete the transaction.
        </AlertDescription>
      </Alert>

      {/* Submit Button */}
      <Button
        type="submit"
        disabled={isProcessing || !phoneNumber}
        className="w-full"
        size="lg"
      >
        {isProcessing ? 'Processing...' : `Pay ${formatCurrency(amount, currency)}`}
      </Button>

      {/* Test Mode Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Test Mode:</strong> Use test number 055 123 4987 for MTN Ghana
          </AlertDescription>
        </Alert>
      )}
    </form>
  );
}
