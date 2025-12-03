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
import type { AuthRequest } from '../types';
import type {
  AuthResponse,
  RegisterRequest,
  LoginRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  CookieOptions,
} from '../types/auth.types';
import { env } from '../config/env';
import { regionDetectionService } from '../services/region-detection.service';

/**
 * Cookie configuration helper
 */
function getCookieOptions(maxAge: number): CookieOptions {
  // Check if using ngrok or production (HTTPS)
  const isNgrok = env.FRONTEND_URL?.includes('ngrok');
  const isHttps = env.FRONTEND_URL?.startsWith('https://');

  // For cross-origin requests (frontend on localhost, backend on ngrok), we need:
  // secure: true (for HTTPS)
  // sameSite: 'none' (to allow cross-site cookies)
  const shouldUseSecure = env.NODE_ENV === 'production' || isNgrok || isHttps;

  return {
    httpOnly: true,
    secure: shouldUseSecure,
    sameSite: shouldUseSecure ? 'none' : 'lax', // Use 'none' with secure for cross-origin
    maxAge: maxAge,
    path: '/',
    // Don't set domain - let browser handle it
  };
}

/**
 * Register new user
 */
export async function register(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    // Validate request body
    const validatedData = validate(registerSchema, req.body) as RegisterRequest;

    // Auto-detect region from IP
    const clientIP = regionDetectionService.getClientIP(req);
    const detectedRegion = await regionDetectionService.detectRegionFromIP(clientIP);

    // Register user
    const user = await authService.registerUser(validatedData);

    // Update user with detected region
    await authService.updateUserRegion(user.id, detectedRegion);

    // Generate access token
    const accessToken = authService.generateToken(user.id, user.email, user.role);

    // Set cookie
    res.cookie('access_token', accessToken, getCookieOptions(3 * 24 * 60 * 60 * 1000)); // 3 days

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        regionCode: detectedRegion,
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

    // Get client IP for region detection
    const clientIP = regionDetectionService.getClientIP(req);

    // Login user
    const result = await authService.loginUser(validatedData.email, validatedData.password, clientIP);

    // Generate access token
    const accessToken = authService.generateToken(
      result.user.id,
      result.user.email,
      result.user.role
    );

    // Set cookie
    res.cookie('access_token', accessToken, getCookieOptions(3 * 24 * 60 * 60 * 1000)); // 3 days

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
export async function logout(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    // Clear cookie
    res.clearCookie('access_token', { path: '/' });

    sendSuccess(res, { message: 'Logout successful' });
  } catch (error) {
    next(error);
  }
}

/**
 * Get current user
 */
export async function getCurrentUser(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;

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

/**
 * Send test email
 */
export async function sendTestEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email } = req.body;

    if (!email) {
      throw new AppError(400, 'Email address is required');
    }

    // Import email service
    const { emailService } = await import('../lib/email');

    await emailService.sendTestEmail(email);

    sendSuccess(res, {
      message: `Test email sent successfully to ${email}`,
    });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Test email error:', error.message);
    }
    next(error);
  }
}
