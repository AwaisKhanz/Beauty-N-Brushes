import Cookies from 'js-cookie';

/**
 * Cookie names used in the application
 */
const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

/**
 * Get access token from cookies
 */
export function getAccessToken(): string | undefined {
  return Cookies.get(COOKIE_NAMES.ACCESS_TOKEN);
}

/**
 * Get refresh token from cookies
 */
export function getRefreshToken(): string | undefined {
  return Cookies.get(COOKIE_NAMES.REFRESH_TOKEN);
}

/**
 * Check if user is authenticated (has access token)
 */
export function isAuthenticated(): boolean {
  return !!getAccessToken();
}

/**
 * Clear all authentication cookies
 * Note: Server sets httpOnly cookies, so we can't access them directly
 * This function is mainly for clearing any non-httpOnly cookies
 */
export function clearAuthCookies(): void {
  Cookies.remove(COOKIE_NAMES.ACCESS_TOKEN);
  Cookies.remove(COOKIE_NAMES.REFRESH_TOKEN);
}

/**
 * Note: We don't need set methods because the server sets httpOnly cookies
 * which cannot be accessed or modified by JavaScript
 */
