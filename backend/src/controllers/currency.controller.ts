import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { exchangeRateService } from '../lib/exchange-rate.service';
import type { Currency } from '../../../shared-constants/region.constants';
import { z } from 'zod';

/**
 * Get current exchange rates
 * GET /api/currency/rates
 */
export async function getExchangeRates(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rates = await exchangeRateService.getExchangeRates();
    const cacheStatus = exchangeRateService.getCacheStatus();

    sendSuccess(res, {
      rates,
      cacheStatus: {
        isCached: cacheStatus.isCached,
        lastUpdated: cacheStatus.lastUpdated,
        expiresAt: cacheStatus.expiresAt,
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Convert currency amount
 * POST /api/currency/convert
 * Body: { amount: number, from: Currency, to: Currency }
 */
const convertCurrencySchema = z.object({
  amount: z.number().positive('Amount must be positive'),
  from: z.enum(['USD', 'GHS', 'NGN', 'EUR']),
  to: z.enum(['USD', 'GHS', 'NGN', 'EUR']),
});

export async function convertCurrency(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validation = convertCurrencySchema.safeParse(req.body);

    if (!validation.success) {
      throw new AppError(
        400,
        `Validation failed: ${validation.error.errors.map((e) => e.message).join(', ')}`
      );
    }

    const { amount, from, to } = validation.data;

    const convertedAmount = await exchangeRateService.convertCurrency(
      amount,
      from as Currency,
      to as Currency
    );

    const rates = await exchangeRateService.getExchangeRates();

    sendSuccess(res, {
      original: {
        amount,
        currency: from,
      },
      converted: {
        amount: convertedAmount,
        currency: to,
      },
      rate: rates[to] / rates[from],
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Refresh exchange rates (force cache refresh)
 * POST /api/currency/refresh
 */
export async function refreshExchangeRates(
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const rates = await exchangeRateService.refreshRates();
    const cacheStatus = exchangeRateService.getCacheStatus();

    sendSuccess(res, {
      rates,
      cacheStatus: {
        isCached: cacheStatus.isCached,
        lastUpdated: cacheStatus.lastUpdated,
        expiresAt: cacheStatus.expiresAt,
      },
      message: 'Exchange rates refreshed successfully',
    });
  } catch (error) {
    next(error);
  }
}
