import { Request, Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { authService } from '../services/auth.service';
import {
  validate,
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from '../utils/validation';
import { AppError } from '../middleware/errorHandler';
import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  CookieOptions,
} from '../types/auth.types';
import { env } from '../config/env';

/**
 * Cookie configuration helper
 */
function getCookieOptions(maxAge: number): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: env.NODE_ENV === 'production' ? 'strict' : 'lax', // Use 'lax' in development for cross-origin requests
    maxAge: maxAge,
    path: '/',
    // Don't set domain in development to allow localhost:3000 to localhost:8000
    ...(env.NODE_ENV === 'production' && { domain: new URL(env.FRONTEND_URL).hostname }),
  };
}

/**
 * Register new user
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedData = validate(registerSchema, req.body) as RegisterRequest;

    // Register user
    const user = await authService.registerUser(validatedData);

    // Generate access and refresh tokens
    const accessToken = authService.generateToken(user.id, user.email, user.role);
    const refreshToken = authService.generateRefreshToken(user.id, user.email, user.role);

    // Store refresh token in database
    await authService.storeRefreshToken(user.id, refreshToken);

    // Set cookies
    res.cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000)); // 15 minutes
    res.cookie('refresh_token', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000)); // 30 days

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      message: 'Registration successful. Please check your email to verify your account.',
      emailVerified: user.emailVerified,
    };

    sendSuccess(res, response, 201);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User already exists') {
        return next(new AppError(409, 'Email already registered'));
      }
      if (error.name === 'ZodError') {
        return next(new AppError(400, 'Validation error', true));
      }
    }
    next(error);
  }
}

/**
 * User login
 */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedData = validate(loginSchema, req.body) as LoginRequest;

    // Login user
    const result = await authService.loginUser(validatedData.email, validatedData.password);

    // Generate access and refresh tokens
    const accessToken = authService.generateToken(
      result.user.id,
      result.user.email,
      result.user.role
    );
    const refreshToken = authService.generateRefreshToken(
      result.user.id,
      result.user.email,
      result.user.role
    );

    // Store refresh token in database
    await authService.storeRefreshToken(result.user.id, refreshToken);

    // Set cookies
    res.cookie('access_token', accessToken, getCookieOptions(15 * 60 * 1000)); // 15 minutes
    res.cookie('refresh_token', refreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000)); // 30 days

    const response: AuthResponse = {
      user: result.user,
      message: 'Login successful',
    };

    sendSuccess(res, response);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Invalid credentials') {
        return next(new AppError(401, 'Invalid email or password'));
      }
      if (error.message.includes('Email not verified')) {
        return next(new AppError(403, error.message));
      }
    }
    next(error);
  }
}

/**
 * User logout
 */
export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (userId) {
      // Revoke refresh token in database
      await authService.revokeRefreshToken(userId);
    }

    // Clear cookies
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    sendSuccess(res, { message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
}

/**
 * Refresh access token with token rotation
 */
export async function refreshToken(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Get refresh token from cookie
    const oldRefreshToken = req.cookies.refresh_token;

    if (!oldRefreshToken) {
      throw new AppError(401, 'Refresh token required');
    }

    // Verify refresh token
    const decoded = authService.verifyRefreshToken(oldRefreshToken);

    // Validate against database
    const isValid = await authService.validateRefreshToken(decoded.userId, oldRefreshToken);

    if (!isValid) {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    // Generate new tokens (token rotation)
    const newAccessToken = authService.generateToken(decoded.userId, decoded.email, decoded.role);
    const newRefreshToken = authService.generateRefreshToken(
      decoded.userId,
      decoded.email,
      decoded.role,
      (decoded.tokenVersion || 0) + 1
    );

    // Store new refresh token in database (invalidates old one)
    await authService.storeRefreshToken(decoded.userId, newRefreshToken);

    // Set new cookies
    res.cookie('access_token', newAccessToken, getCookieOptions(15 * 60 * 1000)); // 15 minutes
    res.cookie('refresh_token', newRefreshToken, getCookieOptions(30 * 24 * 60 * 60 * 1000)); // 30 days

    sendSuccess(res, {
      message: 'Token refreshed successfully',
    });
  } catch (error) {
    // Clear cookies on error
    res.clearCookie('access_token', { path: '/' });
    res.clearCookie('refresh_token', { path: '/' });

    next(new AppError(401, 'Invalid or expired refresh token'));
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as any).user?.id;

    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const user = await authService.getUserById(userId);

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Ensure emailVerified is included in response
    const userResponse = {
      ...user,
      emailVerified: user.emailVerified || false,
    };

    sendSuccess(res, { user: userResponse });
  } catch (error) {
    next(error);
  }
}

/**
 * Forgot password - initiate reset process
 */
export async function forgotPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const validatedData = validate(forgotPasswordSchema, req.body) as ForgotPasswordRequest;
    await authService.forgotPassword(validatedData.email);
    sendSuccess(res, {
      message: 'If a user with that email exists, a password reset link has been sent.',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Validate password reset token
 */
export async function validateResetToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token } = req.query;
    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'Invalid reset token');
    }
    const isValid = await authService.validateResetToken(token);
    if (!isValid) {
      throw new AppError(400, 'Invalid or expired reset token');
    }
    sendSuccess(res, { message: 'Reset token is valid' });
  } catch (error) {
    next(error);
  }
}

/**
 * Reset password
 */
export async function resetPassword(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { token, password, confirmPassword } = req.body;

    if (!token || typeof token !== 'string') {
      throw new AppError(400, 'Invalid reset token');
    }

    const validatedData = validate(resetPasswordSchema, {
      password,
      confirmPassword,
    }) as ResetPasswordRequest;
    await authService.resetPassword(token, validatedData.password);
    sendSuccess(res, { message: 'Password has been reset successfully' });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify email with token
 */
export async function verifyEmail(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { token } = req.params;

    if (!token) {
      throw new AppError(400, 'Verification token required');
    }

    const result = await authService.verifyEmail(token);

    sendSuccess(res, {
      message: result.message,
      userId: result.userId,
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid or expired')) {
      return next(new AppError(400, 'Invalid or expired verification token'));
    }
    next(error);
  }
}

/**
 * Resend verification email
 */
export async function resendVerificationEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, 'Email required');
    }

    await authService.resendVerificationEmail(email);

    sendSuccess(res, {
      message: 'Verification email has been sent. Please check your inbox.',
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'User not found') {
        return next(new AppError(404, 'User not found'));
      }
      if (error.message === 'Email already verified') {
        return next(new AppError(400, 'Email is already verified'));
      }
    }
    next(error);
  }
}
