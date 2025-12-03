'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { User, Building2, Check } from 'lucide-react';
import { useSubscriptionConfig } from '@/hooks/useSubscriptionConfig';
import { SUBSCRIPTION_TIERS } from '@/constants';

type AccountType = 'solo' | 'salon' | null;

interface Step1AccountTypeProps {
  defaultValues?: {
    accountType?: 'solo' | 'salon';
  };
  onNext: (data: { accountType: 'solo' | 'salon' }) => Promise<void>;
  isLoading: boolean;
}

export function Step1AccountType({ defaultValues, onNext, isLoading }: Step1AccountTypeProps) {
  const [selectedType, setSelectedType] = useState<AccountType>(defaultValues?.accountType || null);
  const { config: trialConfig } = useSubscriptionConfig();

  // Calculate trial duration display
  const trialDuration = trialConfig?.trialDurationDays || 60;
  const trialMonths = Math.floor(trialDuration / 30);
  const trialDays = trialDuration % 30;
  const trialDisplay = trialMonths > 0 
    ? `${trialMonths}-month${trialMonths > 1 ? 's' : ''}`
    : `${trialDays} days`;

  useEffect(() => {
    if (defaultValues?.accountType) {
      setSelectedType(defaultValues.accountType);
    }
  }, [defaultValues]);

  const handleContinue = async () => {
    if (!selectedType) return;
    await onNext({ accountType: selectedType });
  };

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      {/* Welcome Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
          Choose Your Account Type
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Let's set up your account to get you started. You can always change this later in your
          settings.
        </p>
      </div>

      {/* Account Type Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12 w-full">
        {/* Solo Professional */}
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            selectedType === 'solo'
              ? 'ring-2 ring-primary bg-primary/5 border-primary shadow-lg'
              : 'hover:border-primary/50 hover:shadow-lg'
          }`}
          onClick={() => setSelectedType('solo')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedType === 'solo'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <User className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{SUBSCRIPTION_TIERS.SOLO.name}</CardTitle>
                  <Badge variant="outline" className="mt-2 text-sm">
                    ${SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD}/month
                  </Badge>
                </div>
              </div>
              {selectedType === 'solo' && (
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
              )}
            </div>
            <CardDescription className="text-base">
              Perfect for individual beauty professionals working independently
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {[
                ...SUBSCRIPTION_TIERS.SOLO.features,
                trialConfig?.trialEnabled ? `${trialDisplay} free trial` : 'Get started immediately',
              ].map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Salon/Business */}
        <Card
          className={`cursor-pointer transition-all duration-300 hover:shadow-xl hover:scale-105 ${
            selectedType === 'salon'
              ? 'ring-2 ring-primary bg-primary/5 border-primary shadow-lg'
              : 'hover:border-primary/50 hover:shadow-lg'
          }`}
          onClick={() => setSelectedType('salon')}
        >
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div
                  className={`h-16 w-16 rounded-2xl flex items-center justify-center transition-colors ${
                    selectedType === 'salon'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  <Building2 className="h-8 w-8" />
                </div>
                <div>
                  <CardTitle className="text-2xl">{SUBSCRIPTION_TIERS.SALON.name}</CardTitle>
                  <Badge variant="outline" className="mt-2 text-sm">
                    ${SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD}/month
                  </Badge>
                </div>
              </div>
              {selectedType === 'salon' && (
                <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Check className="h-5 w-5" />
                </div>
              )}
            </div>
            <CardDescription className="text-base">
              Ideal for salons and multi-stylist businesses
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {SUBSCRIPTION_TIERS.SALON.features.map((feature, index) => (
                <li key={index} className="flex items-center gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-primary flex-shrink-0"></div>
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Continue Button - handled by parent */}
      <div className="flex justify-center">
        <button
          onClick={handleContinue}
          disabled={!selectedType || isLoading}
          className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? 'Saving...' : 'Continue to Business Details'}
        </button>
      </div>
    </div>
  );
}
