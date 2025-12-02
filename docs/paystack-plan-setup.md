# Paystack Plan Setup Guide

## Overview

This guide walks you through creating subscription plans in the Paystack Dashboard. These plans must be created **before** deploying the application to production.

---

## Required Plans

You need to create **4 plans** in total:

| Plan Code | Name | Amount | Currency | Interval |
|-----------|------|--------|----------|----------|
| `bnb_solo_ghs` | Beauty N Brushes - Solo Professional (GHS) | 14400 pesewas | GHS | Monthly |
| `bnb_salon_ghs` | Beauty N Brushes - Salon (GHS) | 37200 pesewas | GHS | Monthly |
| `bnb_solo_ngn` | Beauty N Brushes - Solo Professional (NGN) | 1425000 kobo | NGN | Monthly |
| `bnb_salon_ngn` | Beauty N Brushes - Salon (NGN) | 3682500 kobo | NGN | Monthly |

> [!NOTE]
> **Currency Conversion:**
> - **GHS Plans:** Based on $1 = ₵12 exchange rate
>   - Solo: $19 × 12 = ₵228 = 22,800 pesewas (adjusted to 14,400 for local pricing)
>   - Salon: $49 × 12 = ₵588 = 58,800 pesewas (adjusted to 37,200 for local pricing)
> - **NGN Plans:** Based on $1 = ₦750 exchange rate
>   - Solo: $19 × 750 = ₦14,250 = 1,425,000 kobo
>   - Salon: $49 × 750 = ₦36,750 = 3,675,000 kobo (adjusted to 3,682,500)

---

## Step-by-Step Instructions

### 1. Access Paystack Dashboard

1. Log in to [Paystack Dashboard](https://dashboard.paystack.com)
2. Navigate to **Settings** → **Plans**

### 2. Create Solo Professional (GHS) Plan

1. Click **Create Plan**
2. Fill in the details:
   - **Plan Name:** `Beauty N Brushes - Solo Professional (GHS)`
   - **Plan Code:** `bnb_solo_ghs`
   - **Amount:** `14400` (in pesewas)
   - **Currency:** `GHS`
   - **Interval:** `Monthly`
   - **Send invoices:** `Yes` (recommended)
   - **Invoice limit:** Leave blank (unlimited)
3. Click **Create Plan**

### 3. Create Salon (GHS) Plan

1. Click **Create Plan**
2. Fill in the details:
   - **Plan Name:** `Beauty N Brushes - Salon (GHS)`
   - **Plan Code:** `bnb_salon_ghs`
   - **Amount:** `37200` (in pesewas)
   - **Currency:** `GHS`
   - **Interval:** `Monthly`
   - **Send invoices:** `Yes`
3. Click **Create Plan**

### 4. Create Solo Professional (NGN) Plan

1. Click **Create Plan**
2. Fill in the details:
   - **Plan Name:** `Beauty N Brushes - Solo Professional (NGN)`
   - **Plan Code:** `bnb_solo_ngn`
   - **Amount:** `1425000` (in kobo)
   - **Currency:** `NGN`
   - **Interval:** `Monthly`
   - **Send invoices:** `Yes`
3. Click **Create Plan**

### 5. Create Salon (NGN) Plan

1. Click **Create Plan**
2. Fill in the details:
   - **Plan Name:** `Beauty N Brushes - Salon (NGN)`
   - **Plan Code:** `bnb_salon_ngn`
   - **Amount:** `3682500` (in kobo)
   - **Currency:** `NGN`
   - **Interval:** `Monthly`
   - **Send invoices:** `Yes`
3. Click **Create Plan**

---

## Verification

After creating all plans, verify they exist:

1. Go to **Settings** → **Plans**
2. Confirm all 4 plans are listed
3. Check that plan codes match exactly (case-sensitive)

---

## Environment Configuration

Add the plan codes to your `.env` file:

```env
# Paystack Plans
PAYSTACK_SOLO_GHS_PLAN=bnb_solo_ghs
PAYSTACK_SALON_GHS_PLAN=bnb_salon_ghs
PAYSTACK_SOLO_NGN_PLAN=bnb_solo_ngn
PAYSTACK_SALON_NGN_PLAN=bnb_salon_ngn
```

---

## Testing

### Test Mode Plans

For testing, create identical plans in **Test Mode**:

1. Switch to **Test Mode** in Paystack Dashboard
2. Repeat steps 2-5 above
3. Use the same plan codes

### Verify Integration

Test subscription creation:

```bash
# Test with Paystack test card
curl -X POST https://your-api.com/api/v1/subscription/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "tier": "solo",
    "regionCode": "GH"
  }'
```

---

## Troubleshooting

### Plan Not Found Error

**Error:** `Plan with code 'bnb_solo_ghs' not found`

**Solution:**
1. Verify plan code spelling (case-sensitive)
2. Ensure you're in the correct mode (test/live)
3. Check plan exists in Paystack Dashboard

### Currency Mismatch

**Error:** `Currency mismatch`

**Solution:**
1. Verify region code matches currency:
   - `GH` → `GHS`
   - `NG` → `NGN`
2. Check exchange rates are current

### Amount Incorrect

**Error:** `Invalid amount`

**Solution:**
1. Remember amounts are in smallest currency unit:
   - GHS: pesewas (1 GHS = 100 pesewas)
   - NGN: kobo (1 NGN = 100 kobo)
2. Verify calculation matches pricing strategy

---

## Maintenance

### Updating Prices

To change subscription prices:

1. **Do NOT modify existing plans** (breaks active subscriptions)
2. Create new plans with updated prices
3. Update plan codes in environment variables
4. Migrate existing subscribers gradually

### Monitoring

Monitor plan usage:

1. Dashboard → **Plans**
2. View subscriber count per plan
3. Check for failed subscription attempts

---

## Support

For Paystack-specific issues:
- **Documentation:** https://paystack.com/docs/payments/subscriptions
- **Support:** support@paystack.com
- **Status:** https://status.paystack.com

---

**Last Updated:** November 24, 2025  
**Version:** 1.0
