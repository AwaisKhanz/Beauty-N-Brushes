# Region Selection & Payment Flow Guide

## Overview

This document provides a comprehensive guide to the region selection and payment flow implementation across **onboarding** and **settings**. The system automatically routes users to the correct payment provider (Stripe or Paystack) based on their selected region.

---

## Region-to-Provider Mapping

| Region Code | Region Name | Payment Provider | Currency | Countries |
|-------------|-------------|------------------|----------|-----------|
| `NA` | North America | **Stripe** | USD | USA, Canada |
| `EU` | Europe | **Stripe** | EUR | EU countries |
| `GH` | Ghana | **Paystack** | GHS | Ghana |
| `NG` | Nigeria | **Paystack** | NGN | Nigeria |

---

## Onboarding Flow

### File: `Step6PaymentSetup.tsx`

**Location:** `frontend/src/components/onboarding/steps/Step6PaymentSetup.tsx`

### Flow Steps:

#### 1. **Region Selection**
- User sees 4 region cards (NA, EU, GH, NG)
- Each card displays:
  - Region name and description
  - Payment provider badge (Stripe/Paystack)
  - Currency information
- User clicks to select their region

#### 2. **Provider Assignment**
```typescript
const handleRegionSelect = (region: Region) => {
  setSelectedRegion(region);
  setPaymentProvider(regions[region].provider); // Auto-assigns Stripe or Paystack
  setShowCardForm(false);
};
```

#### 3. **Payment Form Display**
- **For Stripe (NA/EU):**
  - Loads Stripe Elements with custom styling
  - Shows `StripeCardForm` component
  - Passes `regionCode` and `subscriptionTier`
  
- **For Paystack (GH/NG):**
  - Shows `PaystackCardForm` component
  - Passes `regionCode` and `subscriptionTier`
  - Handles mobile money and card payments

#### 4. **Trial Setup**
- 60-day (2-month) free trial
- No payment required to start
- Payment method saved for post-trial billing

---

## Settings Flow

### File: `PaymentMethodModal.tsx`

**Location:** `frontend/src/components/settings/PaymentMethodModal.tsx`

### Flow Steps:

#### 1. **Modal Opens**
- Receives `region` and `paymentProvider` as props
- Automatically knows which provider to use

#### 2. **Stripe Flow (NA/EU)**
```typescript
// Creates SetupIntent
const res = await api.settings.createSetupIntent();
setClientSecret(res.data.clientSecret);

// Displays Stripe Elements
<Elements stripe={stripePromise} options={{ clientSecret }}>
  <StripePaymentForm region={region} onSuccess={onSuccess} />
</Elements>
```

**Process:**
1. Backend creates SetupIntent
2. Frontend displays Stripe payment form
3. User enters card details
4. Stripe confirms setup
5. Payment method ID sent to backend
6. Backend saves to provider profile

#### 3. **Paystack Flow (GH/NG)**
```typescript
// Opens Paystack popup
const handler = PaystackPop.setup({
  key: PAYSTACK_PUBLIC_KEY,
  email: user.email,
  amount: 0, // Authorization only
  currency: region === 'GH' ? 'GHS' : 'NGN',
  callback: async (response) => {
    // Verify and save authorization code
    const verifyRes = await api.payment.verifyPaystack(response.reference);
    await api.settings.updatePaymentMethod({
      paymentMethodId: verifyRes.data.authorization.authorization_code,
      region,
    });
  }
});
```

**Process:**
1. Loads Paystack inline script
2. Opens Paystack popup
3. User completes payment authorization
4. Paystack returns authorization code
5. Backend verifies transaction
6. Authorization code saved to provider profile

---

## Backend Integration

### Region Detection

**File:** `backend/src/lib/payment.ts`

```typescript
export function getPaymentProvider(regionCode: string): 'stripe' | 'paystack' {
  const region = REGIONS.find((r) => r.code === regionCode);
  if (!region) {
    throw new Error(`Invalid region code: ${regionCode}`);
  }
  return region.paymentProvider as 'stripe' | 'paystack';
}
```

### Subscription Creation

**Stripe (NA/EU):**
```typescript
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: priceId }],
  trial_period_days: TRIAL_PERIOD_DAYS,
  payment_behavior: 'default_incomplete',
  trial_settings: {
    end_behavior: {
      missing_payment_method: 'cancel',
    },
  },
  metadata: { providerId, tier },
}, {
  idempotencyKey: `subscription_${providerId}_${tier}`,
});
```

**Paystack (GH/NG):**
```typescript
const response = await fetch('https://api.paystack.co/subscription', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    customer: customerCode,
    plan: planCode, // Pre-created plan in Paystack dashboard
    authorization: authorizationCode,
  }),
});
```

---

## Payment Method Storage

### Database Schema

**ProviderProfile Fields:**
- `paymentProvider`: `'STRIPE' | 'PAYSTACK'`
- `regionCode`: `'NA' | 'EU' | 'GH' | 'NG'`
- `stripeCustomerId`: For Stripe customers
- `stripeSubscriptionId`: For Stripe subscriptions
- `paystackCustomerCode`: For Paystack customers
- `paystackSubscriptionCode`: For Paystack subscriptions
- `paymentMethodId`: Stripe PM ID or Paystack auth code
- `last4Digits`: Last 4 digits of card
- `cardBrand`: Card brand (Visa, Mastercard, etc.)

---

## Environment Configuration

### Frontend

```env
# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...

# Paystack
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...
```

### Backend

```env
# Payment Mode
PAYMENT_MODE=test  # or 'live'

# Stripe Test Keys
STRIPE_TEST_SECRET_KEY=sk_test_...
STRIPE_TEST_PUBLISHABLE_KEY=pk_test_...
STRIPE_TEST_WEBHOOK_SECRET=whsec_test_...
STRIPE_TEST_SOLO_PRICE_ID=price_test_solo
STRIPE_TEST_SALON_PRICE_ID=price_test_salon

# Stripe Live Keys
STRIPE_LIVE_SECRET_KEY=sk_live_...
STRIPE_LIVE_PUBLISHABLE_KEY=pk_live_...
STRIPE_LIVE_WEBHOOK_SECRET=whsec_live_...
STRIPE_LIVE_SOLO_PRICE_ID=price_live_solo
STRIPE_LIVE_SALON_PRICE_ID=price_live_salon

# Paystack Test Keys
PAYSTACK_TEST_SECRET_KEY=sk_test_...
PAYSTACK_TEST_PUBLIC_KEY=pk_test_...

# Paystack Live Keys
PAYSTACK_LIVE_SECRET_KEY=sk_live_...
PAYSTACK_LIVE_PUBLIC_KEY=pk_live_...

# Paystack Plans (Pre-created in dashboard)
PAYSTACK_SOLO_GHS_PLAN=bnb_solo_ghs
PAYSTACK_SALON_GHS_PLAN=bnb_salon_ghs
PAYSTACK_SOLO_NGN_PLAN=bnb_solo_ngn
PAYSTACK_SALON_NGN_PLAN=bnb_salon_ngn
```

---

## Testing Checklist

### Onboarding Flow

#### Stripe (NA/EU)
- [ ] Select NA region
- [ ] Verify Stripe form loads
- [ ] Enter test card: `4242 4242 4242 4242`
- [ ] Verify subscription created with trial
- [ ] Check database for Stripe customer ID

#### Paystack (GH/NG)
- [ ] Select GH region
- [ ] Verify Paystack popup opens
- [ ] Complete authorization with test card
- [ ] Verify subscription created
- [ ] Check database for Paystack customer code

### Settings Flow

#### Update Payment Method (Stripe)
- [ ] Open payment method modal
- [ ] Verify correct region displayed
- [ ] Update card details
- [ ] Verify payment method saved

#### Update Payment Method (Paystack)
- [ ] Open payment method modal
- [ ] Click "Update Payment Method"
- [ ] Complete Paystack authorization
- [ ] Verify authorization code saved

---

## Error Handling

### Common Issues

#### 1. **Wrong Provider for Region**
**Prevention:** Region-to-provider mapping is hardcoded in constants
```typescript
const regions = {
  NA: { provider: 'stripe', currency: 'USD' },
  EU: { provider: 'stripe', currency: 'EUR' },
  GH: { provider: 'paystack', currency: 'GHS' },
  NG: { provider: 'paystack', currency: 'NGN' },
};
```

#### 2. **Missing Environment Variables**
**Solution:** Zod validation in `backend/src/config/env.ts` ensures all required keys are present

#### 3. **Paystack Script Not Loading**
**Solution:** Script loading with fallback and error handling
```typescript
script.onerror = () => {
  setError('Failed to load Paystack. Please refresh and try again.');
};
```

#### 4. **Stripe Elements Not Initializing**
**Solution:** Retry mechanism with loading states
```typescript
if (!clientSecret) {
  return <Button onClick={loadSetupIntent}>Retry</Button>;
}
```

---

## Security Best Practices

### ✅ Implemented

1. **API Keys Never Exposed**
   - Public keys only in frontend
   - Secret keys only in backend environment

2. **Webhook Verification**
   - Stripe: Signature verification with webhook secret
   - Paystack: Signature verification with secret key

3. **Idempotency**
   - All subscription creation uses idempotency keys
   - Prevents duplicate subscriptions

4. **SetupIntent for Stripe**
   - No charges during setup
   - Secure card tokenization

5. **Authorization-Only for Paystack**
   - Amount set to 0 for payment method setup
   - Only authorization code captured

---

## User Experience Flow

### Visual Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    ONBOARDING - STEP 6                       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │ Select Region    │
                    │ • NA / EU / GH / NG │
                    └──────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
                ▼                           ▼
        ┌──────────────┐          ┌──────────────┐
        │ Stripe       │          │ Paystack     │
        │ (NA/EU)      │          │ (GH/NG)      │
        └──────────────┘          └──────────────┘
                │                           │
                ▼                           ▼
        ┌──────────────┐          ┌──────────────┐
        │ Stripe Form  │          │ Paystack     │
        │ • Card Entry │          │ Popup        │
        │ • Validation │          │ • Card/MM    │
        └──────────────┘          └──────────────┘
                │                           │
                └─────────────┬─────────────┘
                              ▼
                    ┌──────────────────┐
                    │ Subscription     │
                    │ Created          │
                    │ (60-day trial)   │
                    └──────────────────┘
```

---

## Conclusion

The region selection and payment flow is **fully implemented and production-ready** with:

✅ **Correct routing** based on region  
✅ **Secure payment processing** for both providers  
✅ **Proper error handling** and user feedback  
✅ **Test/Live mode support** via environment configuration  
✅ **Consistent UX** across onboarding and settings  
✅ **60-day trial** with automatic subscription creation  

**No changes needed** - the implementation follows best practices for both Stripe and Paystack integrations.

---

**Last Updated:** November 24, 2025  
**Version:** 1.0  
**Status:** ✅ Production Ready
