import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { platformConfigService } from '../services/platform-config.service';

/**
 * Get platform fee configuration
 * Public endpoint - no auth required
 */
export const getPlatformConfig = async (
  _req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const feeConfig = await platformConfigService.getServiceFeeConfig();
    
    sendSuccess(res, {
      base: feeConfig.base,
      percentage: feeConfig.percentage,
      cap: feeConfig.cap,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update platform fee configuration
 * Admin only
 */
export async function updatePlatformFeeConfig(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new Error('Unauthorized');
    }

    const { base, percentage, cap } = req.body;

    if (base !== undefined) {
      await platformConfigService.updateConfig('SERVICE_FEE_BASE', base.toString(), userId);
    }
    if (percentage !== undefined) {
      await platformConfigService.updateConfig('SERVICE_FEE_PERCENTAGE', percentage.toString(), userId);
    }
    if (cap !== undefined) {
      await platformConfigService.updateConfig('SERVICE_FEE_CAP', cap.toString(), userId);
    }

    const updatedConfig = await platformConfigService.getServiceFeeConfig();
    
    sendSuccess(res, {
      base: updatedConfig.base,
      percentage: updatedConfig.percentage,
      cap: updatedConfig.cap,
    });
  } catch (error) {
    next(error);
  }
}
