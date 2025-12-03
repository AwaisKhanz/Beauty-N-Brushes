import { Request, Response, NextFunction } from 'express';
import { regionDetectionService } from '../services/region-detection.service';
import { REGIONS } from '../../../shared-constants';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';

/**
 * GET /api/region/detect
 * Detect region for anonymous users (no auth required)
 * Returns region code, name, currency, and payment provider
 */
export async function detectRegion(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const clientIP = regionDetectionService.getClientIP(req);
    
    if (!clientIP) {
      throw new AppError(400, 'Unable to determine IP address');
    }

    const regionCode = await regionDetectionService.detectRegionFromIP(clientIP);
    const region = REGIONS[regionCode];

    sendSuccess(res, {
      regionCode,
      regionName: region.name,
      currency: region.currency,
      paymentProvider: region.paymentProvider,
      detectedIP: clientIP, // For debugging purposes
    });
  } catch (error) {
    console.error('Region detection error:', error);
    next(error);
  }
}
