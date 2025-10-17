import { Request } from 'express';

// Extend Express Request type to include authenticated user
export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

/**
 * Generic authenticated request with typed body and params
 * @template TBody - Request body type
 * @template TParams - URL params type
 * @template TQuery - Query params type
 */
export interface AuthenticatedRequest<
  TBody = unknown,
  TParams = Record<string, string>,
  TQuery = Record<string, unknown>
> extends Request<TParams, unknown, TBody, TQuery> {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

// API Response types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

// Pagination types
export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Re-export all types
export * from './auth.types';
export * from './onboarding.types';
export * from './service.types';
export * from './payment.types';
export * from './integration.types';
export * from './prisma.types';
