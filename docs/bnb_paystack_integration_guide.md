# Beauty N Brushes - Paystack Integration Guide

## Overview

This guide covers the complete Paystack integration for Beauty N Brushes platform, specifically for Ghana and Nigeria markets.

**Payment Provider Strategy**:
- **Stripe**: North America & Europe (USD)
- **Paystack**: Ghana (GHS) & Nigeria (NGN)

---

## Table of Contents

1. [Why Paystack?](#why-paystack)
2. [Setup & Configuration](#setup--configuration)
3. [Subscription Billing](#subscription-billing)
4. [Client Booking Payments](#client-booking-payments)
5. [Webhooks](#webhooks)
6. [Mobile Money Integration](#mobile-money-integration)
7. [Testing](#testing)
8. [Best Practices](#best-practices)

---

## Why Paystack?

### Advantages for African Markets

1. **Local Payment Methods**
   - Mobile Money (Ghana: MTN, Vodafone, AirtelTigo)
   - Bank Transfer (Nigeria: Pay with Transfer)
   - USSD (Nigeria)
   - Local card support (Verve, Visa, Mastercard)

2. **Better Conversion Rates**
   - Optimized for African users
   - Familiar payment interfaces
   - Local currency support (GHS, NGN)
   - Lower transaction fees

3. **Regulatory Compliance**
   - Fully licensed in Ghana and Nigeria
   - Compliant with local regulations
   - Better success rates

4. **Developer Experience**
   - Clean, well-documented API
   - Similar to Stripe's API structure
   - Excellent SDKs and libraries

---

## Setup & Configuration

### 1. Create Paystack Account

```bash
# Sign up at: https://paystack.com
# Select your country: Ghana or Nigeria
# Complete KYC verification
```

### 2. Install Paystack SDK

```bash
# Install Paystack Node.js library
pnpm add paystack-node

# Install types (if available)
pnpm add -D @types/paystack-node
```

### 3. Environment Variables

Add to `.env.local`:

```bash
# Paystack Configuration
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY="pk_test_xxxxxxxxxxxx"
PAYSTACK_SECRET_KEY="sk_test_xxxxxxxxxxxx"
PAYSTACK_WEBHOOK_SECRET="your-webhook-secret"
```

### 4. Initialize Paystack Service

Create `src/lib/payment/paystack.ts`:

```typescript
import Paystack from 'paystack-node';

const environment = process.env.NODE_ENV === 'production' ? 'live' : 'test';

export const paystack = new Paystack(
  process.env.PAYSTACK_SECRET_KEY!,
  environment
);

// Helper to get public key for client-side
export function getPaystackPublicKey(): string {
  return process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!;
}

// Currency helper
export function getPaystackCurrency(regionCode: 'GH' | 'NG'): string {
  return regionCode === 'GH' ? 'GHS' : 'NGN';
}

// Amount converter (to kobo/pesewas)
export function toPaystackAmount(amount: number): number {
  return Math.round(amount * 100);
}

// Amount converter (from kobo/pesewas)
export function fromPaystackAmount(amount: number): number {
  return amount / 100;
}
```

---

## Subscription Billing

### 1. Create Subscription Plans

Create plans for Ghana and Nigeria:

```typescript
// src/lib/payment/paystack-plans.ts
import { paystack } from './paystack';

export async function createSubscriptionPlans() {
  // Solo Professional - Ghana
  await paystack.plan.create({
    name: 'Solo Professional - Ghana',
    amount: 23750, // ₵237.50 (≈$19 USD * 12.5 exchange rate) in pesewas
    interval: 'monthly',
    currency: 'GHS',
  });

  // Solo Professional - Nigeria
  await paystack.plan.create({
    name: 'Solo Professional - Nigeria',
    amount: 2945000, // ₦29,450 (≈$19 USD * 1550 exchange rate) in kobo
    interval: 'monthly',
    currency: 'NGN',
  });

  // Salon - Ghana
  await paystack.plan.create({
    name: 'Salon - Ghana',
    amount: 61250, // ₵612.50 (≈$49 USD * 12.5 exchange rate) in pesewas
    interval: 'monthly',
    currency: 'GHS',
  });

  // Salon - Nigeria
  await paystack.plan.create({
    name: 'Salon - Nigeria',
    amount: 7597500, // ₦75,975 (≈$49 USD * 1550 exchange rate) in kobo
    interval: 'monthly',
    currency: 'NGN',
  });
}

export function getPlanCode(tier: 'solo' | 'salon', regionCode: 'GH' | 'NG'): string {
  const currency = regionCode === 'GH' ? 'ghs' : 'ngn';
  return `${tier}_${currency}`;
}
```

### 2. Create Customer & Subscription

```typescript
// src/lib/payment/paystack-subscription.ts
import { paystack, toPaystackAmount } from './paystack';
import { getPlanCode } from './paystack-plans';

export async function createPaystackSubscription(params: {
  providerId: string;
  email: string;
  firstName: string;
  lastName: string;
  tier: 'solo' | 'salon';
  regionCode: 'GH' | 'NG';
  businessName: string;
}) {
  const { providerId, email, firstName, lastName, tier, regionCode, businessName } = params;

  // 1. Create customer
  const customerResponse = await paystack.customer.create({
    email,
    first_name: firstName,
    last_name: lastName,
    metadata: {
      providerId,
      businessName,
      tier,
    },
  });

  const customerCode = customerResponse.data.customer_code;

  // 2. Get plan code
  const planCode = getPlanCode(tier, regionCode);

  // 3. Calculate trial end date (2 months from now)
  const trialEndDate = new Date();
  trialEndDate.setMonth(trialEndDate.getMonth() + 2);

  // 4. Create subscription
  const subscriptionResponse = await paystack.subscription.create({
    customer: customerCode,
    plan: planCode,
    start_date: trialEndDate.toISOString(), // Start billing after trial
  });

  return {
    customerCode,
    subscriptionCode: subscriptionResponse.data.subscription_code,
    subscriptionToken: subscriptionResponse.data.email_token,
  };
}

// Cancel subscription
export async function cancelPaystackSubscription(subscriptionCode: string) {
  const response = await paystack.subscription.disable({
    code: subscriptionCode,
    token: '', // Token for email subscriptions (not needed for API)
  });

  return response.data;
}
```

### 3. Frontend - Card Authorization

```typescript
// src/components/payment/PaystackCardAuth.tsx
'use client';

import { usePaystackPayment } from 'react-paystack';
import { Button } from '@/components/ui/button';

interface PaystackCardAuthProps {
  email: string;
  amount: number; // For authorization (e.g., ₵1 or ₦100)
  currency: 'GHS' | 'NGN';
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export function PaystackCardAuth({
  email,
  amount,
  currency,
  onSuccess,
  onClose,
}: PaystackCardAuthProps) {
  const config = {
    reference: `auth_${new Date().getTime()}`,
    email,
    amount: amount * 100, // Convert to kobo/pesewas
    currency,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY!,
  };

  const initializePayment = usePaystackPayment(config);

  const handlePayment = () => {
    initializePayment({
      onSuccess: (response) => {
        onSuccess(response.reference);
      },
      onClose,
    });
  };

  return (
    <Button onClick={handlePayment} className="btn-primary w-full">
      Authorize Card
    </Button>
  );
}
```

---

## Client Booking Payments

### 1. Initialize Transaction

```typescript
// src/lib/payment/paystack-booking.ts
import { paystack, toPaystackAmount, getPaystackCurrency } from './paystack';

export async function initializeBookingPayment(params: {
  bookingId: string;
  clientEmail: string;
  depositAmount: number;
  serviceFee: number;
  regionCode: 'GH' | 'NG';
  providerId: string;
}) {
  const { bookingId, clientEmail, depositAmount, serviceFee, regionCode, providerId } = params;

  const totalAmount = depositAmount + serviceFee;
  const currency = getPaystackCurrency(regionCode);

  const response = await paystack.transaction.initialize({
    email: clientEmail,
    amount: toPaystackAmount(totalAmount),
    currency,
    callback_url: `${process.env.NEXT_PUBLIC_APP_URL}/bookings/${bookingId}/confirm`,
    metadata: {
      bookingId,
      depositAmount,
      serviceFee,
      providerId,
      custom_fields: [
        {
          display_name: 'Booking ID',
          variable_name: 'booking_id',
          value: bookingId,
        },
      ],
    },
    channels: ['card', 'bank', 'mobile_money', 'ussd'], // Enable multiple channels
  });

  return {
    authorizationUrl: response.data.authorization_url,
    accessCode: response.data.access_code,
    reference: response.data.reference,
  };
}

// Verify transaction
export async function verifyBookingPayment(reference: string) {
  const response = await paystack.transaction.verify(reference);

  return {
    success: response.data.status === 'success',
    amount: response.data.amount / 100,
    currency: response.data.currency,
    metadata: response.data.metadata,
    paidAt: response.data.paid_at,
    channel: response.data.channel,
  };
}
```

### 2. Frontend - Payment Checkout

```typescript
// src/components/booking/PaystackCheckout.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

interface PaystackCheckoutProps {
  bookingId: string;
  depositAmount: number;
  serviceFee: number;
  currency: 'GHS' | 'NGN';
}

export function PaystackCheckout({
  bookingId,
  depositAmount,
  serviceFee,
  currency,
}: PaystackCheckoutProps) {
  const [loading, setLoading] = useState(false);
  const totalAmount = depositAmount + serviceFee;

  const handlePayment = async () => {
    setLoading(true);

    try {
      // Call API to initialize payment
      const response = await fetch('/api/bookings/initialize-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId }),
      });

      const data = await response.json();

      // Redirect to Paystack checkout
      window.location.href = data.authorizationUrl;
    } catch (error) {
      console.error('Payment initialization failed:', error);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-muted p-4 rounded-lg space-y-2">
        <div className="flex justify-between">
          <span>Deposit Amount:</span>
          <span className="font-semibold">
            {currency === 'GHS' ? '₵' : '₦'}{depositAmount.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between">
          <span>Service Fee:</span>
          <span className="font-semibold">
            {currency === 'GHS' ? '₵' : '₦'}{serviceFee.toFixed(2)}
          </span>
        </div>
        <div className="flex justify-between border-t pt-2">
          <span className="font-bold">Total:</span>
          <span className="font-bold text-primary">
            {currency === 'GHS' ? '₵' : '₦'}{totalAmount.toFixed(2)}
          </span>
        </div>
      </div>

      <Button
        onClick={handlePayment}
        disabled={loading}
        className="w-full btn-primary"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Processing...
          </>
        ) : (
          'Pay Now'
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Secure payment powered by Paystack
      </p>
    </div>
  );
}
```

---

## Webhooks

### 1. Create Webhook Handler

```typescript
// src/app/api/webhooks/paystack/route.ts
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('x-paystack-signature');

  // Verify webhook signature
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  if (hash !== signature) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.event) {
    case 'charge.success':
      await handleChargeSuccess(event.data);
      break;

    case 'subscription.create':
      await handleSubscriptionCreate(event.data);
      break;

    case 'subscription.disable':
      await handleSubscriptionDisable(event.data);
      break;

    case 'transfer.success':
      await handleTransferSuccess(event.data);
      break;

    default:
      console.log(`Unhandled event: ${event.event}`);
  }

  return NextResponse.json({ received: true });
}

async function handleChargeSuccess(data: any) {
  const reference = data.reference;
  const metadata = data.metadata;

  if (metadata.bookingId) {
    // Update booking status
    await db.booking.update({
      where: { id: metadata.bookingId },
      data: {
        paymentStatus: 'paid',
        paymentReference: reference,
        paidAt: new Date(data.paid_at),
      },
    });

    // TODO: Send confirmation email
  }
}

async function handleSubscriptionCreate(data: any) {
  const subscriptionCode = data.subscription_code;
  const customerCode = data.customer.customer_code;

  // Update provider subscription status
  await db.providerProfile.update({
    where: { paystackCustomerCode: customerCode },
    data: {
      paystackSubscriptionCode: subscriptionCode,
      subscriptionStatus: 'active',
    },
  });
}

async function handleSubscriptionDisable(data: any) {
  const subscriptionCode = data.subscription_code;

  // Update provider subscription status
  await db.providerProfile.update({
    where: { paystackSubscriptionCode: subscriptionCode },
    data: {
      subscriptionStatus: 'cancelled',
    },
  });
}

async function handleTransferSuccess(data: any) {
  const reference = data.reference;
  const recipientCode = data.recipient.recipient_code;

  // Update payout status
  await db.payout.update({
    where: { reference },
    data: {
      status: 'completed',
      completedAt: new Date(),
    },
  });
}
```

---

## Mobile Money Integration

### Ghana Mobile Money

```typescript
// src/lib/payment/paystack-mobile-money.ts
import { paystack, toPaystackAmount } from './paystack';

export async function initializeMobileMoneyPayment(params: {
  email: string;
  amount: number;
  phoneNumber: string;
  provider: 'mtn' | 'vodafone' | 'tigo'; // Ghana providers
  metadata: any;
}) {
  const { email, amount, phoneNumber, provider, metadata } = params;

  const response = await paystack.transaction.initialize({
    email,
    amount: toPaystackAmount(amount),
    currency: 'GHS',
    channels: ['mobile_money'],
    mobile_money: {
      phone: phoneNumber,
      provider: provider,
    },
    metadata,
  });

  return {
    reference: response.data.reference,
    // For mobile money, user will receive USSD prompt on their phone
  };
}
```

### Nigeria Bank Transfer

```typescript
// src/lib/payment/paystack-bank-transfer.ts
import { paystack, toPaystackAmount } from './paystack';

export async function initializeBankTransfer(params: {
  email: string;
  amount: number;
  metadata: any;
}) {
  const { email, amount, metadata } = params;

  const response = await paystack.transaction.initialize({
    email,
    amount: toPaystackAmount(amount),
    currency: 'NGN',
    channels: ['bank'],
    metadata,
  });

  // Poll for payment confirmation
  return {
    reference: response.data.reference,
    accessCode: response.data.access_code,
  };
}
```

---

## Testing

### Test Cards

**Ghana (GHS):**
```
Card Number: 5061 0104 1000 0022 294
CVV: 123
Expiry: Any future date
PIN: 1234
OTP: 123456
```

**Nigeria (NGN):**
```
Card Number: 4084 0840 8408 4081
CVV: 408
Expiry: Any future date
PIN: 1234
OTP: 123456
```

### Test Mobile Money (Ghana)

```
Phone: 0551234567
Provider: MTN
```

### Test Bank Transfer (Nigeria)

Use any email and the system will generate a test account number.

---

## Best Practices

### 1. Error Handling

```typescript
import { paystack } from '@/lib/payment/paystack';

async function safePaystackCall<T>(
  operation: () => Promise<T>,
  fallback?: T
): Promise<T | null> {
  try {
    return await operation();
  } catch (error: any) {
    console.error('Paystack API Error:', error.message);

    // Log to monitoring service
    if (process.env.NODE_ENV === 'production') {
      // Send to Sentry or similar
    }

    return fallback ?? null;
  }
}

// Usage
const customer = await safePaystackCall(() =>
  paystack.customer.create({ email: 'user@example.com' })
);
```

### 2. Idempotency

```typescript
// Always use unique references
const reference = `booking_${bookingId}_${Date.now()}`;

const payment = await paystack.transaction.initialize({
  reference, // Unique reference
  email,
  amount,
  currency,
});
```

### 3. Currency Conversion

```typescript
// Always store exchange rates in database
const exchangeRates = await db.exchangeRate.findFirst({
  where: {
    fromCurrency: 'USD',
    toCurrency: currency,
    date: today,
  },
});

const localAmount = usdAmount * exchangeRates.rate;
```

### 4. Webhook Security

```typescript
// Always verify webhook signatures
import crypto from 'crypto';

function verifyPaystackSignature(body: string, signature: string): boolean {
  const hash = crypto
    .createHmac('sha512', process.env.PAYSTACK_WEBHOOK_SECRET!)
    .update(body)
    .digest('hex');

  return hash === signature;
}
```

---

## API Reference

### Common Paystack Methods

```typescript
// Customer
paystack.customer.create({ email, first_name, last_name, metadata });
paystack.customer.fetch(customerCode);
paystack.customer.list({ perPage: 50, page: 1 });

// Subscription
paystack.subscription.create({ customer, plan, start_date });
paystack.subscription.disable({ code, token });
paystack.subscription.fetch(subscriptionCode);

// Transaction
paystack.transaction.initialize({ email, amount, currency, metadata });
paystack.transaction.verify(reference);
paystack.transaction.list({ perPage: 50, page: 1 });

// Plan
paystack.plan.create({ name, amount, interval, currency });
paystack.plan.fetch(planCode);
paystack.plan.list();

// Transfer
paystack.transfer.initiate({ source: 'balance', amount, recipient, reason });
paystack.transfer.finalize({ transfer_code, otp });
```

---

## Troubleshooting

### Common Issues

**1. "Invalid API Key"**
- Check environment variables are set correctly
- Ensure you're using the right key (test vs live)

**2. "Amount must be a number"**
- Always convert to kobo/pesewas (multiply by 100)
- Ensure amount is an integer

**3. "Customer not found"**
- Create customer before creating subscription
- Use customer_code, not customer_id

**4. "Webhook signature mismatch"**
- Verify webhook secret is correct
- Use raw body for signature verification

---

**Document Version**: 1.0
**Last Updated**: Paystack Integration for Ghana & Nigeria
**Status**: Production Ready
