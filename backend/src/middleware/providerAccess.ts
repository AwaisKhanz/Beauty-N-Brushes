import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { providerService } from '../services/provider.service';
import { ProviderContext, PermissionHelper } from '../utils/permissions';
import { AppError } from '../middleware/errorHandler';

/**
 * Middleware to get provider context and attach to request
 * Works for both salon owners and team members
 */
export async function attachProviderContext(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get provider context (owner or team member)
    const context = await providerService.getProviderOrTeamMemberProfile(userId);

    // Attach to request for use in controllers
    (req as any).providerContext = context;

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Middleware factory to require specific permission
 * Usage: requirePermission('team'), requirePermission('finances'), etc.
 */
export function requirePermission(
  permission: 'team' | 'finances' | 'settings' | 'bookings' | 'services'
) {
  return async (req: AuthRequest, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const context = (req as any).providerContext as ProviderContext;

      if (!context) {
        throw new AppError(500, 'Provider context not found. Use attachProviderContext middleware first.');
      }

      // Check permission
      PermissionHelper.requirePermission(context, permission);

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Middleware to require owner permission
 * Blocks team members from accessing owner-only routes
 */
export async function requireOwner(
  req: AuthRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const context = (req as any).providerContext as ProviderContext;

    if (!context) {
      throw new AppError(500, 'Provider context not found. Use attachProviderContext middleware first.');
    }

    PermissionHelper.requireOwner(context);

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Helper to get provider context from request
 * Use in controllers to access provider context
 */
export function getProviderContext(req: AuthRequest): ProviderContext {
  const context = (req as any).providerContext as ProviderContext;

  if (!context) {
    throw new AppError(500, 'Provider context not found');
  }

  return context;
}
