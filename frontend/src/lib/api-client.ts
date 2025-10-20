import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAuthCookies } from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// Public routes that don't require authentication
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/',
];

// Helper to check if current path is public
const isPublicRoute = (path: string): boolean => {
  return PUBLIC_ROUTES.some((route) => path === route || path.startsWith('/reset-password/'));
};

// Helper to redirect to login (works in both client and server components)
const redirectToLogin = () => {
  if (typeof window !== 'undefined') {
    const currentPath = window.location.pathname + window.location.search;

    // Don't redirect if already on a public route
    if (isPublicRoute(currentPath)) {
      return;
    }

    // Store the current URL to redirect back after login
    if (currentPath !== '/login' && currentPath !== '/register') {
      localStorage.setItem('redirectAfterLogin', currentPath);
    }
    window.location.href = '/login';
  }
};

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important: Send cookies with requests
      timeout: 30000, // 30 second timeout
    });

    // Request interceptor - cookies are sent automatically, no need to add Authorization header
    this.client.interceptors.request.use(
      (config) => {
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - simplified without refresh token logic
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Handle 401 errors
        if (error.response?.status === 401) {
          // Skip redirect for /auth/me - this is expected when not authenticated
          if (originalRequest?.url?.includes('/auth/me')) {
            throw error;
          }

          // Skip redirect for auth endpoints
          const authEndpoints = [
            '/auth/login',
            '/auth/register',
            '/auth/forgot-password',
            '/auth/reset-password',
            '/auth/verify-email',
            '/auth/resend-verification',
          ];

          const isAuthEndpoint = authEndpoints.some((endpoint) =>
            originalRequest?.url?.includes(endpoint)
          );

          if (isAuthEndpoint) {
            throw error;
          }

          // Don't redirect if on a public route
          if (typeof window !== 'undefined' && isPublicRoute(window.location.pathname)) {
            throw error;
          }

          // Clear auth cookies and redirect to login
          await clearAuthCookies();
          redirectToLogin();
          throw new Error('Authentication expired');
        }

        return Promise.reject(error);
      }
    );
  }

  // Generic methods
  async get<T>(url: string, params?: Record<string, unknown>): Promise<T> {
    return this.client.get(url, { params });
  }

  async post<T>(url: string, data?: unknown): Promise<T> {
    return this.client.post(url, data);
  }

  async put<T>(url: string, data?: unknown): Promise<T> {
    return this.client.put(url, data);
  }

  async patch<T>(url: string, data?: unknown): Promise<T> {
    return this.client.patch(url, data);
  }

  async delete<T>(url: string, data?: unknown): Promise<T> {
    return this.client.delete(url, { data });
  }
}

export const apiClient = new ApiClient();
