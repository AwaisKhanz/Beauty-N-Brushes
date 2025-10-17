# Constants & Configuration Standards

## Overview

All hardcoded values, routes, and configuration data must be centralized in `frontend/src/constants/` for consistency and maintainability.

---

## Constants Structure

```
frontend/src/constants/
├── index.ts          # Re-exports all constants
├── routes.ts         # All URLs + route helper functions
├── navigation.ts     # Navigation links (header, sidebars)
├── onboarding.ts     # Onboarding steps & labels
├── services.ts       # Service categories, specializations, business types
├── payment.ts        # Payment providers, regions, subscription tiers
└── colors.ts         # Brand colors, fonts
```

---

## Usage Rules

### ✅ **DO:**

```typescript
// ✅ Import from constants
import { ROUTES, getDashboardRoute, SERVICE_CATEGORIES } from '@/constants';

// ✅ Use constants for routes
router.push(ROUTES.PROVIDER.DASHBOARD);
router.push(getDashboardRoute(user.role));

// ✅ Use constants for navigation
const navLinks = NAV_LINKS.PUBLIC;

// ✅ Use constants for data
{SERVICE_CATEGORIES.map((cat) => (
  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
))}
```

### ❌ **DON'T:**

```typescript
// ❌ Hardcode routes
router.push('/provider/dashboard');
router.push('/dashboard');

// ❌ Hardcode navigation arrays
const navLinks = [{ href: '/search', label: 'Browse' }];

// ❌ Duplicate data arrays
const categories = [{ id: 'hair', name: 'Hair' }];
```

---

## Key Constants

### **Routes (`routes.ts`)**

```typescript
ROUTES.PROVIDER.DASHBOARD; // '/provider/dashboard'
ROUTES.PROVIDER.ONBOARDING; // '/provider/onboarding'
ROUTES.CLIENT.DASHBOARD; // '/client/dashboard'
ROUTES.ADMIN.DASHBOARD; // '/admin/dashboard'

getDashboardRoute(role); // Returns role-specific dashboard
getOnboardingRoute(role); // Returns role-specific onboarding
```

### **Navigation (`navigation.ts`)**

```typescript
NAV_LINKS.PUBLIC; // Public header links
NAV_LINKS.PROVIDER_SIDEBAR; // Provider sidebar with icons
NAV_LINKS.CLIENT_SIDEBAR; // Client sidebar
NAV_LINKS.ADMIN_SIDEBAR; // Admin sidebar
```

### **Onboarding (`onboarding.ts`)**

```typescript
ONBOARDING_STEPS; // 8-step array
ONBOARDING_STORAGE_KEY; // localStorage key
STEP_LABELS; // Step name mapping
```

### **Services (`services.ts`)**

```typescript
SERVICE_SPECIALIZATIONS; // 12 service types
SERVICE_CATEGORIES; // 8 categories
BUSINESS_TYPES; // salon, spa, etc.
DEPOSIT_TYPES; // percentage, fixed
```

### **Payment (`payment.ts`)**

```typescript
REGIONS; // NA, EU, GH, NG with currency
SUBSCRIPTION_TIERS; // Solo ($19), Salon ($49)
TRIAL_PERIOD_DAYS; // 60
```

---

## Route Structure

### **URLs:**

- **Provider**: `/provider/dashboard`, `/provider/onboarding`, `/provider/services`
- **Client**: `/client/dashboard`, `/client/onboarding`, `/client/bookings`
- **Admin**: `/admin/dashboard`, `/admin/users`, `/admin/providers`

### **Role-Based Routing:**

```typescript
// After login
const dashboardRoute = getDashboardRoute(user.role);
router.push(dashboardRoute);

// Onboarding redirect
const onboardingRoute = getOnboardingRoute(user.role);
router.push(onboardingRoute);
```

---

## Quick Reference

| Need             | Import                                             | Use                            |
| ---------------- | -------------------------------------------------- | ------------------------------ |
| **Routes**       | `import { ROUTES } from '@/constants'`             | `ROUTES.PROVIDER.DASHBOARD`    |
| **Role routing** | `import { getDashboardRoute } from '@/constants'`  | `getDashboardRoute(user.role)` |
| **Nav links**    | `import { NAV_LINKS } from '@/constants'`          | `NAV_LINKS.PUBLIC`             |
| **Service data** | `import { SERVICE_CATEGORIES } from '@/constants'` | `SERVICE_CATEGORIES.map(...)`  |
| **Onboarding**   | `import { ONBOARDING_STEPS } from '@/constants'`   | `ONBOARDING_STEPS`             |

---

## When to Add New Constants

Add to constants when you have:

- ✅ URLs or route paths
- ✅ Navigation menus or links
- ✅ Dropdown options (categories, types, etc.)
- ✅ Configuration values used in multiple places
- ✅ Feature flags or limits

**Rule**: If a value appears in 2+ places OR could change globally, it belongs in constants.

---

**Last Updated**: Provider Onboarding Refactor
**Version**: 1.0
