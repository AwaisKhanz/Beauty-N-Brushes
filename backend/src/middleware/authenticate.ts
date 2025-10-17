import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { authService } from '../services/auth.service';
import { AppError } from './errorHandler';

/**
 * Authentication middleware
 * Verifies JWT token from cookies and attaches user to request
 */
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  try {
    // Try to get token from cookie first
    let token = req.cookies?.access_token;

    // Fallback to Authorization header for API clients
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7);
      }
    }

    if (!token) {
      throw new AppError(401, 'No authentication token provided');
    }

    const decoded = authService.verifyToken(token);

    // Attach user to request
    (req as AuthRequest).user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof Error && error.name === 'TokenExpiredError') {
      next(new AppError(401, 'Token expired'));
    } else {
      next(new AppError(401, 'Invalid or expired token'));
    }
  }
}

/**
 * Authorization middleware
 * Checks if user has required role
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const user = (req as AuthRequest).user;

    if (!user) {
      return next(new AppError(401, 'Unauthorized'));
    }

    if (!allowedRoles.includes(user.role)) {
      return next(new AppError(403, 'Forbidden - Insufficient permissions'));
    }

    next();
  };
}
