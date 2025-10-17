'use client';

import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, CheckCircle2, Globe } from 'lucide-react';
import StripeCardForm from '@/components/provider/StripeCardForm';
import PaystackCardForm from '@/components/provider/PaystackCardForm';
import { REGIONS } from '@/constants';

type PaymentProvider = 'stripe' | 'paystack';
type Region = 'NA' | 'EU' | 'GH' | 'NG';
type SubscriptionTier = 'solo' | 'salon';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Step6PaymentSetupProps {
  subscriptionTier: SubscriptionTier;
  onNext: () => Promise<void>;
  onBack: () => void;
}

export function Step6PaymentSetup({ subscriptionTier, onNext, onBack }: Step6PaymentSetupProps) {
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [paymentProvider, setPaymentProvider] = useState<PaymentProvider | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);

  const regions = REGIONS.reduce(
    (acc, region) => {
      acc[region.code as Region] = {
        name: region.name,
        provider: region.provider as PaymentProvider,
        currency: region.currency,
      };
      return acc;
    },
    {} as Record<Region, { name: string; provider: PaymentProvider; currency: string }>
  );

  const handleRegionSelect = (region: Region) => {
    setSelectedRegion(region);
    setPaymentProvider(regions[region].provider);
    setShowCardForm(false);
  };

  const handleContinue = () => {
    if (selectedRegion && paymentProvider) {
      setShowCardForm(true);
    }
  };

  const handlePaymentSuccess = async () => {
    await onNext();
  };

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Start Your Free Trial</h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          Choose your region to start your 2-month free trial
        </p>
      </div>

      {!showCardForm ? (
        <>
          {/* Key Benefits */}
          <Card className="mb-6 border-primary/20 bg-primary/5 w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Free Trial Benefits
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  {/* TESTING: Trial messaging commented out */}
                  {/* <span className="text-sm">2-month free trial</span> */}
                  <span className="text-sm">2-month free trial</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">Full feature access</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary" />
                  <span className="text-sm">No payment required</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Region Selection */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Select Your Region
              </CardTitle>
              <CardDescription>Select your region to start your free trial</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(['NA', 'EU', 'GH', 'NG'] as Region[]).map((region) => (
                  <Card
                    key={region}
                    className={`cursor-pointer transition-all hover:shadow-lg ${
                      selectedRegion === region
                        ? 'ring-2 ring-primary bg-primary/5'
                        : 'hover:border-primary/50'
                    }`}
                    onClick={() => handleRegionSelect(region)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <div
                          className={`h-10 w-10 rounded-lg ${region === 'NA' || region === 'EU' ? 'bg-primary/10' : 'bg-accent/10'} flex items-center justify-center`}
                        >
                          <CreditCard
                            className={`h-5 w-5 ${region === 'NA' || region === 'EU' ? 'text-primary' : 'text-accent-foreground'}`}
                          />
                        </div>
                        <div>
                          <h3 className="font-semibold">{regions[region].name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {region === 'NA' && 'United States & Canada'}
                            {region === 'EU' && 'EU countries'}
                            {region === 'GH' && 'Mobile money & cards'}
                            {region === 'NG' && 'Mobile money & cards'}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <Badge variant="outline">
                          {regions[region].provider === 'stripe' ? 'Stripe' : 'Paystack'}
                        </Badge>
                        <p className="text-xs text-muted-foreground">
                          {regions[region].currency} payments
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {selectedRegion && (
                <div className="mt-6 p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-semibold mb-2">Payment Setup Details</h4>
                  <div className="space-y-1 text-sm">
                    <p>
                      <strong>Region:</strong> {regions[selectedRegion].name}
                    </p>
                    <p>
                      <strong>Provider:</strong>{' '}
                      {regions[selectedRegion].provider === 'stripe' ? 'Stripe' : 'Paystack'}
                    </p>
                    <p>
                      <strong>Currency:</strong> {regions[selectedRegion].currency}
                    </p>
                    <p>
                      <strong className="text-primary">Trial Period:</strong> 2 months free
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-6 w-full">
            <Button variant="outline" onClick={onBack} className="gap-2">
              Back
            </Button>

            <Button onClick={handleContinue} disabled={!selectedRegion} className="gap-2">
              Start Free Trial
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Card Collection Form */}
          {paymentProvider === 'stripe' && selectedRegion && (
            <Elements stripe={stripePromise}>
              <StripeCardForm
                regionCode={selectedRegion}
                subscriptionTier={subscriptionTier}
                onSuccess={handlePaymentSuccess}
                onBack={() => setShowCardForm(false)}
              />
            </Elements>
          )}

          {paymentProvider === 'paystack' && selectedRegion && (
            <PaystackCardForm
              regionCode={selectedRegion}
              subscriptionTier={subscriptionTier}
              onSuccess={handlePaymentSuccess}
              onBack={() => setShowCardForm(false)}
            />
          )}
        </>
      )}

      <div className="mt-8 text-center">
        <p className="text-sm text-muted-foreground">
          Start your free trial now. No payment required to get started.
        </p>
      </div>
    </div>
  );
}
