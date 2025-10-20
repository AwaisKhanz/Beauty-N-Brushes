/**
 * Route constants for all application URLs
 */

export const ROUTES = {
  // Public routes
  HOME: '/',
  SEARCH: '/search',
  VISUAL_SEARCH: '/visual-search',
  ABOUT: '/about',
  FOR_PROVIDERS: '/for-providers',

  // Auth routes
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  VERIFY_EMAIL: '/verify-email',

  // Provider routes
  PROVIDER: {
    DASHBOARD: '/provider/dashboard',
    ONBOARDING: '/provider/onboarding',
    ONBOARDING_COMPLETE: '/provider/onboarding/complete',
    PAYMENT_CALLBACK: '/provider/onboarding/payment-callback',
    ANALYTICS: '/provider/analytics',
    BOOKINGS: '/provider/bookings',
    CALENDAR: '/provider/calendar',
    FINANCE: '/provider/finance',
    SERVICES: '/provider/services',
    SERVICES_CREATE: '/provider/services/create',
    PROFILE: '/provider/profile',
    SETTINGS: '/provider/settings',
    SETTINGS_PROFILE: '/provider/settings/profile',
    SETTINGS_BOOKING: '/provider/settings/booking',
    SETTINGS_POLICIES: '/provider/settings/policies',
    SETTINGS_SUBSCRIPTION: '/provider/settings/subscription',
    SETTINGS_NOTIFICATIONS: '/provider/settings/notifications',
    SETTINGS_ACCOUNT: '/provider/settings/account',
  },

  // Client routes
  CLIENT: {
    DASHBOARD: '/client/dashboard',
    ONBOARDING: '/client/onboarding',
    SEARCH: '/client/search',
    BOOKINGS: '/client/bookings',
    FAVORITES: '/client/favorites',
    MESSAGES: '/client/messages',
    PROFILE: '/client/profile',
    SETTINGS: '/client/settings',
  },

  // Admin routes
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    USERS: '/admin/users',
    PROVIDERS: '/admin/providers',
    BOOKINGS: '/admin/bookings',
    REPORTS: '/admin/reports',
    SETTINGS: '/admin/settings',
  },
} as const;

/**
 * Get role-specific dashboard route
 */
export function getDashboardRoute(role: 'PROVIDER' | 'CLIENT' | 'ADMIN'): string {
  switch (role) {
    case 'PROVIDER':
      return ROUTES.PROVIDER.DASHBOARD;
    case 'ADMIN':
      return ROUTES.ADMIN.DASHBOARD;
    case 'CLIENT':
    default:
      return ROUTES.CLIENT.DASHBOARD;
  }
}

/**
 * Get role-specific onboarding route
 */
export function getOnboardingRoute(role: 'PROVIDER' | 'CLIENT' | 'ADMIN'): string {
  switch (role) {
    case 'PROVIDER':
      return ROUTES.PROVIDER.ONBOARDING;
    case 'CLIENT':
      return ROUTES.CLIENT.ONBOARDING;
    case 'ADMIN':
    default:
      return ROUTES.ADMIN.DASHBOARD; // Admin doesn't have onboarding
  }
}

/**
 * Dynamic route builders for public pages
 */
export function getServiceDetailRoute(serviceId: string): string {
  return `/services/${serviceId}`;
}

export function getProviderProfileRoute(slug: string): string {
  return `/providers/${slug}`;
}

/**
 * Public routes that don't require authentication
 */
export const PUBLIC_ROUTES = [
  ROUTES.HOME,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
  ROUTES.VERIFY_EMAIL,
  ROUTES.SEARCH,
  ROUTES.VISUAL_SEARCH,
  ROUTES.ABOUT,
  ROUTES.FOR_PROVIDERS,
] as const;

/**
 * Auth routes that should redirect if already logged in
 */
export const AUTH_ROUTES = [
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.FORGOT_PASSWORD,
  ROUTES.RESET_PASSWORD,
] as const;
