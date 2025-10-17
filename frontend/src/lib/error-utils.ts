/**
 * Error Handling Utilities
 * Provides type-safe error handling functions for the frontend
 */

import {
  isAxiosError,
  isApiErrorResponse,
  getErrorMessage as sharedGetErrorMessage,
  type ApiErrorResponse,
} from '../../../shared-types';

/**
 * Extract error message from unknown error (re-export from shared-types)
 */
export const getErrorMessage = sharedGetErrorMessage;

/**
 * Extract error from Axios or API error response
 * @param error - The error to extract from
 * @returns Error message string
 */
export function extractErrorMessage(error: unknown): string {
  return getErrorMessage(error);
}

/**
 * Check if error is an authentication error (401)
 */
export function isAuthError(error: unknown): boolean {
  if (isAxiosError(error) && error.response?.status === 401) {
    return true;
  }
  return false;
}

/**
 * Check if error is a validation error (400)
 */
export function isValidationError(error: unknown): boolean {
  if (isAxiosError(error) && error.response?.status === 400) {
    return true;
  }
  return false;
}

/**
 * Get error details from API error response
 */
export function getErrorDetails(error: unknown): unknown | undefined {
  if (isAxiosError(error) && error.response?.data) {
    const data = error.response.data;
    if (isApiErrorResponse(data)) {
      return data.error.details;
    }
  }
  return undefined;
}

/**
 * Type guard for checking if value is an Error object
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Handle async operation with type-safe error handling
 * Returns [error, data] tuple similar to Go error handling
 */
export async function handleAsync<T>(
  promise: Promise<T>
): Promise<[null, T] | [Error, null]> {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    if (isError(error)) {
      return [error, null];
    }
    // Convert unknown errors to Error objects
    return [new Error(getErrorMessage(error)), null];
  }
}

