/**
 * Bank Transfer Payment Component
 * Phase 4.3: Bank Transfer Implementation for Nigeria
 * 
 * Uses Paystack's Dedicated Virtual Account feature
 * Uses global theme colors
 */

'use client';

import { useState, useEffect } from 'react';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Building2, Copy, CheckCircle2, Info, AlertCircle } from 'lucide-react';

interface BankTransferFormProps {
  amount: number;
  currency: 'NGN';
  bookingId: string;
  customerEmail: string;
  customerName: string;
  onSuccess: () => void;
  onError: (error: Error) => void;
}

interface VirtualAccount {
  bank: {
    name: string;
    id: number;
    slug: string;
  };
  account_name: string;
  account_number: string;
  assigned: boolean;
  currency: string;
}

export function BankTransferForm({
  amount,
  currency,
  bookingId,
  customerEmail,
  customerName,
  // onSuccess,
  onError,
}: BankTransferFormProps) {
  const [accountDetails, setAccountDetails] = useState<VirtualAccount | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    createVirtualAccount();
  }, []);

  const createVirtualAccount = async () => {
    try {
      const response = await fetch(`/api/v1/payment/bank-transfer/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId,
          email: customerEmail,
          name: customerName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create virtual account');
      }

      const data = await response.json();
      setAccountDetails(data.accountDetails);
    } catch (error) {
      onError(error as Error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8 space-x-3">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="text-muted-foreground">Generating account details...</span>
      </div>
    );
  }

  if (!accountDetails) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Failed to generate account details. Please try again.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Pay with Bank Transfer</h3>
      </div>

      {/* Instructions */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <p className="font-medium mb-2">📱 Transfer Instructions:</p>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Open your banking app or USSD</li>
            <li>Transfer the exact amount to the account below</li>
            <li>Payment will be confirmed automatically</li>
          </ol>
        </AlertDescription>
      </Alert>

      {/* Account Details Card */}
      <div className="p-6 bg-gradient-to-br from-card to-muted border-2 border-border rounded-xl shadow-lg space-y-4">
        <div>
          <p className="text-xs text-muted-foreground mb-1">Bank Name</p>
          <p className="text-lg font-semibold text-foreground">{accountDetails.bank.name}</p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Account Number</p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-2xl font-mono font-bold tracking-wider text-foreground">
              {accountDetails.account_number}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(accountDetails.account_number)}
              className="shrink-0"
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Copied
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 mr-1" />
                  Copy
                </>
              )}
            </Button>
          </div>
        </div>

        <div>
          <p className="text-xs text-muted-foreground mb-1">Account Name</p>
          <p className="text-base font-medium text-foreground">{accountDetails.account_name}</p>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground mb-1">Amount to Transfer</p>
          <p className="text-3xl font-bold text-primary">
            {formatCurrency(amount, currency)}
          </p>
        </div>
      </div>

      {/* Important Notes */}
      <div className="space-y-3">
        <Alert variant="default" className="bg-warning/10 border-warning/20">
          <AlertCircle className="h-4 w-4 text-warning" />
          <AlertDescription className="text-warning-foreground">
            <strong>Important:</strong> Transfer the exact amount shown above.
            Incorrect amounts may delay confirmation.
          </AlertDescription>
        </Alert>

        <Alert variant="default" className="bg-success/10 border-success/20">
          <CheckCircle2 className="h-4 w-4 text-success" />
          <AlertDescription className="text-success-foreground">
            <strong>Auto-Confirmation:</strong> Your payment will be confirmed
            automatically within seconds of transfer.
          </AlertDescription>
        </Alert>
      </div>

      {/* Waiting Status */}
      <div className="p-4 bg-muted rounded-lg border-2 border-dashed border-border">
        <div className="flex items-center justify-center">
          <div className="animate-pulse flex items-center gap-2">
            <div className="h-3 w-3 bg-primary rounded-full"></div>
            <span className="text-sm text-muted-foreground">
              Waiting for your transfer...
            </span>
          </div>
        </div>
      </div>

      {/* Test Mode Notice */}
      {process.env.NODE_ENV === 'development' && (
        <Alert variant="default" className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
          <AlertDescription className="text-yellow-800 dark:text-yellow-200">
            <strong>Test Mode:</strong> In test mode, transfers are simulated.
            Use the Paystack dashboard to simulate a successful transfer.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
