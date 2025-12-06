import { Request, Response, NextFunction } from 'express';
import { regionDetectionService } from '../services/region-detection.service';
import type { RegionCode } from '../../../shared-constants';
import { REGIONS } from '../../../shared-constants';

/**
 * Extended Request interface with region information
 */
export interface RequestWithRegion extends Request {
  clientRegion?: {
    ip: string;
    regionCode: RegionCode;
    regionName: string;
    currency: string;
    paymentProvider: 'stripe' | 'paystack';
    countryCode?: string;
  };
}

/**
 * Region Detection Middleware
 * Automatically detects client region from IP on every request
 * Attaches region info to req.clientRegion for easy access
 * 
 * Usage in routes:
 * const region = (req as RequestWithRegion).clientRegion;
 * console.log(region.regionCode); // 'NA', 'EU', 'GH', or 'NG'
 */
export const detectRegionMiddleware = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get client IP
    const clientIP = regionDetectionService.getClientIP(req);
    
    // Detect region from IP
    const regionCode = await regionDetectionService.detectRegionFromIP(clientIP);
    const region = REGIONS[regionCode];

    console.log(region);

    // Attach region info to request
    (req as RequestWithRegion).clientRegion = {
      ip: clientIP,
      regionCode,
      regionName: region.name,
      currency: region.currency,
      paymentProvider: region.paymentProvider,
    };

    next();
  } catch (error) {
    // Don't block request if region detection fails
    // Just set default values
    console.error('Region detection middleware error:', error);
    
    (req as RequestWithRegion).clientRegion = {
      ip: 'unknown',
      regionCode: 'NA',
      regionName: 'North America',
      currency: 'USD',
      paymentProvider: 'stripe',
    };
    
    next();
  }
}

/**
 * Optional: Lightweight version that only detects on specific routes
 * Use this if you don't want to detect region on EVERY request
 */
export async function detectRegionOptional(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // Only detect if not already detected
  if (!(req as RequestWithRegion).clientRegion) {
    await detectRegionMiddleware(req, res, next);
  } else {
    next();
  }
}
