import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { analyticsService } from '../services/analytics.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type {
  GetAnalyticsSummaryResponse,
  GetBookingTrendsResponse,
  GetServicePerformanceResponse,
  GetClientDemographicsResponse,
  GetRevenueBreakdownResponse,
} from '../../../shared-types';

/**
 * Get analytics summary
 */
export async function getAnalyticsSummary(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { startDate, endDate } = req.query;

    const summary = await analyticsService.getAnalyticsSummary(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    sendSuccess<GetAnalyticsSummaryResponse>(res, {
      message: 'Analytics summary retrieved successfully',
      summary,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Get booking trends
 */
export async function getBookingTrends(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { startDate, endDate, interval } = req.query;

    if (!startDate || !endDate) {
      throw new AppError(400, 'Start date and end date required');
    }

    const result = await analyticsService.getBookingTrends(
      userId,
      new Date(startDate as string),
      new Date(endDate as string),
      (interval as 'day' | 'week' | 'month') || 'day'
    );

    sendSuccess<GetBookingTrendsResponse>(res, {
      message: 'Booking trends retrieved successfully',
      ...result,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Get service performance
 */
export async function getServicePerformance(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { startDate, endDate, sortBy, limit } = req.query;

    const services = await analyticsService.getServicePerformance(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      (sortBy as 'bookings' | 'revenue' | 'rating') || 'bookings',
      limit ? parseInt(limit as string) : 10
    );

    sendSuccess<GetServicePerformanceResponse>(res, {
      message: 'Service performance retrieved successfully',
      services,
      total: services.length,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Get client demographics
 */
export async function getClientDemographics(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { startDate, endDate } = req.query;

    const demographics = await analyticsService.getClientDemographics(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    sendSuccess<GetClientDemographicsResponse>(res, {
      message: 'Client demographics retrieved successfully',
      demographics,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Get revenue breakdown
 */
export async function getRevenueBreakdown(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { startDate, endDate } = req.query;

    const breakdown = await analyticsService.getRevenueBreakdown(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    sendSuccess<GetRevenueBreakdownResponse>(res, {
      message: 'Revenue breakdown retrieved successfully',
      breakdown,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}
