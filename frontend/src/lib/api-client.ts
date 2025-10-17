import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { clearAuthCookies } from './cookies';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value?: unknown) => void;
    reject: (reason?: unknown) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true, // Important: Send cookies with requests
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

    // Response interceptor with refresh token logic
    this.client.interceptors.response.use(
      (response) => response.data,
      async (error: AxiosError) => {
        const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

        // Skip token refresh for auth endpoints and public routes
        const publicEndpoints = [
          '/auth/login',
          '/auth/register',
          '/auth/forgot-password',
          '/auth/reset-password',
          '/auth/verify-email',
          '/auth/resend-verification',
        ];
        const isPublicEndpoint = publicEndpoints.some((endpoint) =>
          originalRequest?.url?.includes(endpoint)
        );

        // If 401 and not already retrying, try to refresh token (but not for public endpoints)
        if (error.response?.status === 401 && !originalRequest._retry && !isPublicEndpoint) {
          if (this.isRefreshing) {
            // If already refreshing, queue this request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            })
              .then(() => {
                return this.client(originalRequest);
              })
              .catch((err) => {
                return Promise.reject(err);
              });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            // Try to refresh the token
            await this.client.get('/auth/refresh');

            // Small delay to ensure cookies are properly set
            await new Promise((resolve) => setTimeout(resolve, 100));

            // Retry all queued requests
            this.failedQueue.forEach((prom) => {
              prom.resolve();
            });
            this.failedQueue = [];
            this.isRefreshing = false;

            // Retry the original request
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear cookies and redirect to login
            this.failedQueue.forEach((prom) => {
              prom.reject(refreshError);
            });
            this.failedQueue = [];
            this.isRefreshing = false;

            clearAuthCookies();
            if (typeof window !== 'undefined') {
              window.location.href = '/login';
            }
            return Promise.reject(refreshError);
          }
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
