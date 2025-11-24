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
import { AlertCircle, Globe, Loader2, CreditCard } from 'lucide-react';
import { extractErrorMessage } from '@/lib/error-utils';
import { api } from '@/lib/api';
import { REGIONS_ARRAY } from '../../../../shared-constants';

interface RegionSelectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentRegion?: string | null;
  onSuccess: () => void;
}

export function RegionSelectionModal({
  open,
  onOpenChange,
  currentRegion,
  onSuccess,
}: RegionSelectionModalProps) {
  const [selectedRegion, setSelectedRegion] = useState<string | null>(currentRegion || null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  async function handleSave() {
    if (!selectedRegion) {
      setError('Please select a region');
      return;
    }

    try {
      setSaving(true);
      setError('');

      await api.users.updateRegion({
        regionCode: selectedRegion as 'NA' | 'EU' | 'GH' | 'NG',
      });

      onSuccess();
      onOpenChange(false);
    } catch (err: unknown) {
      setError(extractErrorMessage(err) || 'Failed to save region');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Select Your Region
          </DialogTitle>
          <DialogDescription>
            Choose your region to enable payment methods and set up your account. This cannot be
            changed after your first booking.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            {REGIONS_ARRAY.map((region) => {
              const isSelected = selectedRegion === region.code;
              const paymentProvider = region.paymentProvider === 'stripe' ? 'Stripe' : 'Paystack';

              return (
                <button
                  key={region.code}
                  type="button"
                  onClick={() => setSelectedRegion(region.code)}
                  className={`w-full p-4 border-2 rounded-lg text-left transition-all ${
                    isSelected
                      ? 'border-primary bg-primary/5 shadow-md'
                      : 'border-muted hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-base">{region.name}</p>
                        {isSelected && (
                          <div className="h-2 w-2 rounded-full bg-primary"></div>
                        )}
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <CreditCard className="h-3 w-3" />
                          {paymentProvider}
                        </span>
                        <span>{region.currency}</span>
                      </div>
                    </div>
                    <div
                      className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                        isSelected
                          ? 'border-primary bg-primary'
                          : 'border-muted-foreground'
                      }`}
                    >
                      {isSelected && (
                        <div className="h-2 w-2 rounded-full bg-white"></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Your region determines which payment provider you'll use. North America and Europe
              use Stripe, while Ghana and Nigeria use Paystack.
            </AlertDescription>
          </Alert>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving || !selectedRegion}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Region'
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

