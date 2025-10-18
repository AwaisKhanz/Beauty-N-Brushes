import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAuthCookies, refreshAuthTokens } from './cookies';

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

interface QueuedRequest {
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
  config: InternalAxiosRequestConfig;
}

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: QueuedRequest[] = [];
  private refreshPromise: Promise<boolean> | null = null;

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

    // Response interceptor with improved refresh token logic
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip token refresh for auth endpoints
        const authEndpoints = [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/verify-email',
          '/auth/resend-verification',
          '/auth/refresh', // Don't retry refresh endpoint itself
        ];

        const isAuthEndpoint = authEndpoints.some((endpoint) =>
          originalRequest?.url?.includes(endpoint)
        );

        // Handle 401 errors with token refresh
        if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
          // Don't attempt token refresh if on a public route
          if (typeof window !== 'undefined' && isPublicRoute(window.location.pathname)) {
            throw error;
          }

          originalRequest._retry = true;

          // If already refreshing, queue this request
          if (this.isRefreshing) {
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject, config: originalRequest });
            });
          }

          // Start refresh process
          this.isRefreshing = true;
          this.refreshPromise = this.performTokenRefresh();

          try {
            const refreshSuccess = await this.refreshPromise;

            if (refreshSuccess) {
              // Process all queued requests successfully
              this.processFailedQueue(null);
              return this.client(originalRequest);
            } else {
              // Refresh failed - reject all queued requests and redirect to login
              this.processFailedQueue(new Error('Token refresh failed'));
              await clearAuthCookies();
              redirectToLogin();
              throw new Error('Authentication expired');
            }
          } catch (refreshError) {
            // Refresh failed - reject all queued requests and redirect to login
            this.processFailedQueue(refreshError);
            await clearAuthCookies();
            redirectToLogin();
            throw refreshError;
          } finally {
            this.isRefreshing = false;
            this.refreshPromise = null;
          }
        }

        // Handle other 401s (like /auth/me when not authenticated)
        if (error.response?.status === 401 && originalRequest?.url?.includes('/auth/me')) {
          // Silent fail for /auth/me - this is expected when not authenticated
          throw error;
        }

        return Promise.reject(error);
      }
    );
  }

  private async performTokenRefresh(): Promise<boolean> {
    try {
      const success = await refreshAuthTokens();
      if (success) {
        // Small delay to ensure cookies are properly set
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
      return success;
    } catch (error) {
      console.error('Token refresh failed:', error);
      return false;
    }
  }

  private processFailedQueue(error: unknown): void {
    this.failedQueue.forEach(async (request) => {
      if (error) {
        request.reject(error);
      } else {
        try {
          // Retry the original request
          const response = await this.client(request.config);
          request.resolve(response);
        } catch (retryError) {
          request.reject(retryError);
        }
      }
    });
    this.failedQueue = [];
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
