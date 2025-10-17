import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'crypto';
import { prisma } from '../config/database';
import type {
  UserRole,
  RegisterRequest,
  AuthUser,
  TokenPayload,
  RefreshTokenPayload,
} from '../types/auth.types';
import { sendVerificationEmail as sendEmailVerification, emailService } from '../lib/email';
import { env } from '../config/env';

const SALT_ROUNDS = 12;

export class AuthService {
  /**
   * Hash password
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  }

  /**
   * Verify password
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT access token
   */
  generateToken(userId: string, email: string, role: UserRole): string {
    const payload: TokenPayload = { userId, email, role };
    const secret = env.JWT_SECRET;
    const expiresIn = env.JWT_EXPIRY;

    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  /**
   * Generate refresh token
   */
  generateRefreshToken(
    userId: string,
    email: string,
    role: UserRole,
    tokenVersion: number = 0
  ): string {
    const payload: RefreshTokenPayload = { userId, email, role, tokenVersion };
    const secret = env.REFRESH_TOKEN_SECRET;
    const expiresIn = env.REFRESH_TOKEN_EXPIRY;

    return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
  }

  /**
   * Verify JWT access token
   */
  verifyToken(token: string): TokenPayload {
    const secret = env.JWT_SECRET;
    return jwt.verify(token, secret) as TokenPayload;
  }

  /**
   * Verify refresh token
   */
  verifyRefreshToken(token: string): RefreshTokenPayload {
    const secret = env.REFRESH_TOKEN_SECRET;
    return jwt.verify(token, secret) as RefreshTokenPayload;
  }

  /**
   * Store refresh token hash in database
   */
  async storeRefreshToken(userId: string, refreshToken: string): Promise<void> {
    const refreshTokenHash = await this.hashPassword(refreshToken);
    const expiryDays = parseInt(env.REFRESH_TOKEN_EXPIRY.replace('d', ''));
    const refreshTokenExpiry = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash,
        refreshTokenExpiry,
      },
    });
  }

  /**
   * Verify refresh token against database
   */
  async validateRefreshToken(userId: string, refreshToken: string): Promise<boolean> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        refreshTokenHash: true,
        refreshTokenExpiry: true,
      },
    });

    if (!user || !user.refreshTokenHash || !user.refreshTokenExpiry) {
      return false;
    }

    // Check if token is expired
    if (user.refreshTokenExpiry < new Date()) {
      return false;
    }

    // Verify token hash
    return await this.verifyPassword(refreshToken, user.refreshTokenHash);
  }

  /**
   * Revoke refresh token (for logout)
   */
  async revokeRefreshToken(userId: string): Promise<void> {
    await prisma.user.update({
      where: { id: userId },
      data: {
        refreshTokenHash: null,
        refreshTokenExpiry: null,
      },
    });
  }

  /**
   * Generate email verification token
   */
  async generateVerificationToken(userId: string): Promise<string> {
    const verificationToken = randomBytes(32).toString('hex');
    const verificationTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await prisma.user.update({
      where: { id: userId },
      data: {
        verificationToken,
        verificationTokenExpiry,
      },
    });

    return verificationToken;
  }

  /**
   * Register new user
   */
  async registerUser(data: RegisterRequest) {
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(data.password);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    // Generate verification token and send email
    const verificationToken = await this.generateVerificationToken(user.id);
    await sendEmailVerification(user.email, user.firstName, verificationToken);

    return user;
  }

  /**
   * Login user
   */
  async loginUser(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.passwordHash) {
      throw new Error('Invalid credentials');
    }

    // Verify password
    const isValid = await this.verifyPassword(password, user.passwordHash);

    if (!isValid) {
      throw new Error('Invalid credentials');
    }

    // Check if email is verified (BLOCKING)
    if (!user.emailVerified) {
      throw new Error('Email not verified. Please check your email to verify your account.');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Generate token
    const token = this.generateToken(user.id, user.email, user.role);

    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      emailVerified: user.emailVerified,
    };

    return {
      user: authUser,
      token,
    };
  }

  /**
   * Get user by ID
   */
  async getUserById(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatarUrl: true,
        emailVerified: true,
        status: true,
        createdAt: true,
      },
    });

    return user;
  }

  /**
   * Forgot password - generate reset token
   */
  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Send password reset email
    await emailService.sendPasswordResetEmail(email, user.firstName, resetToken);

    return { resetToken, email };
  }

  /**
   * Validate reset token
   */
  async validateResetToken(token: string): Promise<boolean> {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    return !!user;
  }

  /**
   * Reset password
   */
  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const passwordHash = await this.hashPassword(newPassword);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    return { message: 'Password reset successfully' };
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string) {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user) {
      throw new Error('Invalid or expired verification token');
    }

    // Mark email as verified and clear token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        verificationToken: null,
        verificationTokenExpiry: null,
      },
    });

    return { message: 'Email verified successfully', userId: user.id };
  }

  /**
   * Resend verification email
   */
  async resendVerificationEmail(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.emailVerified) {
      throw new Error('Email already verified');
    }

    // Generate new verification token
    const verificationToken = await this.generateVerificationToken(user.id);

    // Send verification email
    await sendEmailVerification(user.email, user.firstName, verificationToken);

    return { message: 'Verification email sent' };
  }
}

export const authService = new AuthService();
