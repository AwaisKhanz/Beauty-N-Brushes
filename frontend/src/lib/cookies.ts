/**
 * Authentication cookie utilities
 *
 * Note: The server sets httpOnly cookies for security, which means
 * JavaScript cannot access them directly. This is by design for security.
 * Authentication state is managed through API calls to /auth/me endpoint.
 */

/**
 * Clear authentication cookies by calling logout endpoint
 * This ensures both httpOnly cookies are properly cleared on the server
 */
export async function clearAuthCookies(): Promise<void> {
  try {
    // Call logout endpoint to clear httpOnly cookies on server
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/logout`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Don't warn on 401 - it just means there were no valid cookies to clear
    if (!response.ok && response.status !== 401) {
      console.warn('Logout endpoint failed, but continuing with client cleanup');
    }
  } catch (error) {
    // Silent fail - this is expected if there are no cookies or network issues
    // The main goal is to clear any client-side state
  }
}

/**
 * Check if cookies exist by attempting to access a protected endpoint
 * This is the only reliable way to check auth status with httpOnly cookies
 */
export async function checkAuthStatus(): Promise<boolean> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
      method: 'GET',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return response.ok;
  } catch (error) {
    return false;
  }
}
