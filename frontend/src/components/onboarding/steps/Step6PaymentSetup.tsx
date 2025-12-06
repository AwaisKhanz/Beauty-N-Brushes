'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CreditCard, Shield, CheckCircle2 } from 'lucide-react';
import StripeCardForm from '@/components/provider/StripeCardForm';
import PaystackCardForm from '@/components/provider/PaystackCardForm';
import { getPaymentInfoFromCountry } from '../../../../../shared-constants';
import { useSubscriptionConfig } from '@/hooks/useSubscriptionConfig';

type SubscriptionTier = 'solo' | 'salon';

// Local tier info helper (getTierInfo not exported from shared-constants)
const getTierInfo = (tier: SubscriptionTier) => {
  if (tier === 'solo') {
    return {
      name: 'Solo Professional',
      monthlyPriceUSD: 19,
      features: [
        'Unlimited bookings',
        'Client management',
        'Calendar sync',
        'Basic analytics',
        'Mobile app access',
      ],
    };
  }
  return {
    name: 'Salon & Team',
    monthlyPriceUSD: 49,
    features: [
      'Everything in Solo',
      'Team management',
      'Advanced analytics',
      'Priority support',
      'Custom branding',
      'Multi-location support',
    ],
  };
};

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '');

interface Step6PaymentSetupProps {
  subscriptionTier: SubscriptionTier;
  country?: string; // Country from Business Details step
  onNext: () => Promise<void>;
  onBack: () => void;
}

export function Step6PaymentSetup({ subscriptionTier, country = 'US', onNext, onBack }: Step6PaymentSetupProps) {
  const [paymentInfo, setPaymentInfo] = useState(getPaymentInfoFromCountry(country));
  const [showCardForm, setShowCardForm] = useState(false);
  
  // Get subscription tier details
  const tierInfo = getTierInfo(subscriptionTier);
  
  // Get dynamic trial configuration
  const { config: trialConfig } = useSubscriptionConfig();

  useEffect(() => {
    // Update payment info if country changes
    setPaymentInfo(getPaymentInfoFromCountry(country));
  }, [country]);

  const handleContinue = () => {
    setShowCardForm(true);
  };

  const handlePaymentSuccess = async () => {
    await onNext();
  };

  // Calculate trial duration display
  const trialDuration = trialConfig?.trialDurationDays || 60;
  const trialMonths = Math.floor(trialDuration / 30);
  const trialDays = trialDuration % 30;
  const trialDisplay = trialMonths > 0 
    ? `${trialMonths}-month${trialMonths > 1 ? 's' : ''}${trialDays > 0 ? ` ${trialDays} days` : ''}`
    : `${trialDays} days`;

  return (
    <div className="max-w-7xl  w-full flex flex-col items-center justify-center">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">
          {trialConfig?.trialEnabled ? 'Start Your Free Trial' : 'Payment Setup'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
          {trialConfig?.trialEnabled 
            ? `Complete your payment setup to start your ${trialDisplay} free trial`
            : 'Complete your payment setup to activate your account'
          }
        </p>
      </div>

      {!showCardForm ? (
        <>
          {/* Key Benefits - Only show if trials are enabled */}
          {trialConfig?.trialEnabled && (
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
                    <span className="text-sm">{trialDisplay} free trial</span>
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
          )}

          {/* Selected Plan Display */}
          <Card className="mb-6 w-full">
            <CardHeader>
              <CardTitle>Your Selected Plan</CardTitle>
              <CardDescription>Review your subscription details</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-6 border rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold">{tierInfo.name}</h3>
                    <p className="text-muted-foreground mt-1">
                      {subscriptionTier === 'solo' ? 'Perfect for individual professionals' : 'Ideal for salons and teams'}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-lg px-4 py-2">
                    ${tierInfo.monthlyPriceUSD}/mo
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-4">
                  {tierInfo.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Auto-Detected Payment Provider */}
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Payment Setup
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Only show trial period if trials are enabled */}
              {trialConfig?.trialEnabled && (
                <div className="p-6 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Trial Period</span>
                    <span className="font-semibold text-primary">{trialDisplay} free</span>
                  </div>
                </div>
              )}
              {!trialConfig?.trialEnabled && (
                <div className="p-6 border rounded-lg bg-muted/50">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Payment Required</span>
                    {/* <span className="font-semibold text-muted-foreground">No trial available</span> */}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="flex justify-between pt-6 w-full">
            <Button variant="outline" onClick={onBack} className="gap-2">
              Back
            </Button>

            <Button onClick={handleContinue} className="gap-2">
              {trialConfig?.trialEnabled ? 'Start Free Trial' : 'Continue to Payment'}
            </Button>
          </div>
        </>
      ) : (
        <>
          {/* Card Collection Form */}
          {paymentInfo.provider === 'stripe' && (
            <Elements
              stripe={stripePromise}
              options={{
                appearance: {
                  theme: document.documentElement.classList.contains('dark') ? 'night' : 'stripe',
                  variables: {
                    colorPrimary: '#B06F64',
                    colorBackground: document.documentElement.classList.contains('dark')
                      ? '#1a1a1a'
                      : '#ffffff',
                    colorText: document.documentElement.classList.contains('dark')
                      ? '#ffffff'
                      : '#2A3F4D',
                    colorDanger: '#EF4444',
                    fontFamily: 'system-ui, sans-serif',
                    borderRadius: '8px',
                    spacingUnit: '4px',
                  },
                  rules: {
                    '.Input': {
                      backgroundColor: document.documentElement.classList.contains('dark')
                        ? '#2a2a2a'
                        : '#f8f9fa',
                      border: '1px solid #B06F64',
                      borderRadius: '8px',
                      color: document.documentElement.classList.contains('dark')
                        ? '#ffffff'
                        : '#2A3F4D',
                      fontSize: '16px',
                      padding: '12px',
                    },
                    '.Input:focus': {
                      borderColor: '#B06F64',
                      boxShadow: '0 0 0 2px rgba(176, 111, 100, 0.2)',
                    },
                    '.Label': {
                      color: document.documentElement.classList.contains('dark')
                        ? '#ffffff'
                        : '#2A3F4D',
                      fontSize: '14px',
                      fontWeight: '500',
                    },
                  },
                },
              }}
            >
            <StripeCardForm
              regionCode={paymentInfo.region}
              subscriptionTier={subscriptionTier}
              onSuccess={handlePaymentSuccess}
              onBack={() => setShowCardForm(false)}
            />
            </Elements>
          )}

          {paymentInfo.provider === 'paystack' && (
            <PaystackCardForm
              regionCode={paymentInfo.region}
              subscriptionTier={subscriptionTier}
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
