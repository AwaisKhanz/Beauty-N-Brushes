import { cookies } from 'next/headers';
import { api } from './api';
import type { AuthUser } from '@/types';

/**
 * Server-side function to get current user from cookies
 * Note: Cookies are automatically sent with API requests
 */
export async function getCurrentUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = cookies();
    const token = cookieStore.get('access_token')?.value;

    // If no cookie, user is not authenticated
    if (!token) {
      return null;
    }

    // Call API to get user data (cookie sent automatically)
    const response = await api.auth.me();

    return response.data.user;
  } catch (error) {
    return null;
  }
}
