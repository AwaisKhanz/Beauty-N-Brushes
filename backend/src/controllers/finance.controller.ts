import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { financeService } from '../services/finance.service';
import { AppError } from '../middleware/errorHandler';
import type { AuthRequest } from '../types';
import type {
  GetFinanceSummaryResponse,
  GetEarningsBreakdownResponse,
  GetPayoutHistoryResponse,
  GetBookingFinancialsResponse,
  CreatePayoutResponse,
} from '../../../shared-types';

/**
 * Get provider's finance summary
 */
export async function getFinanceSummary(
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

    const summary = await financeService.getFinanceSummary(
      userId,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined
    );

    sendSuccess<GetFinanceSummaryResponse>(res, {
      message: 'Finance summary retrieved successfully',
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
 * Get earnings breakdown
 */
export async function getEarningsBreakdown(
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

    const breakdown = await financeService.getEarningsBreakdown(
      userId,
      new Date(startDate as string),
      new Date(endDate as string),
      (interval as 'day' | 'week' | 'month') || 'day'
    );

    const total = breakdown.reduce((sum, item) => sum + item.earnings, 0);

    sendSuccess<GetEarningsBreakdownResponse>(res, {
      message: 'Earnings breakdown retrieved successfully',
      breakdown,
      total,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Get payout history
 */
export async function getPayoutHistory(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as
      | 'PENDING'
      | 'PROCESSING'
      | 'COMPLETED'
      | 'FAILED'
      | 'CANCELLED'
      | undefined;

    const data = await financeService.getPayoutHistory(userId, page, limit, status);

    sendSuccess<GetPayoutHistoryResponse>(res, {
      message: 'Payout history retrieved successfully',
      data,
    });
  } catch (error) {
    if (error instanceof Error && error.message === 'Provider profile not found') {
      return next(new AppError(404, error.message));
    }
    next(error);
  }
}

/**
 * Get booking financial details
 */
export async function getBookingFinancials(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { startDate, endDate, paymentStatus, bookingStatus } = req.query;

    const result = await financeService.getBookingFinancials(
      userId,
      page,
      limit,
      startDate ? new Date(startDate as string) : undefined,
      endDate ? new Date(endDate as string) : undefined,
      paymentStatus as string | undefined,
      bookingStatus as string | undefined
    );

    sendSuccess<GetBookingFinancialsResponse>(res, {
      message: 'Booking financials retrieved successfully',
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
 * Create payout request
 */
export async function createPayout(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { amount, bookingIds } = req.body;

    if (!amount || !bookingIds || !Array.isArray(bookingIds)) {
      throw new AppError(400, 'Amount and booking IDs required');
    }

    const payout = await financeService.createPayout(userId, amount, bookingIds);

    sendSuccess<CreatePayoutResponse>(
      res,
      {
        message: 'Payout request created successfully',
        payout,
      },
      201
    );
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Provider profile not found') {
        return next(new AppError(404, error.message));
      }
      if (error.message.includes('Invalid bookings')) {
        return next(new AppError(400, error.message));
      }
      if (error.message === 'Amount mismatch') {
        return next(new AppError(400, error.message));
      }
    }
    next(error);
  }
}
