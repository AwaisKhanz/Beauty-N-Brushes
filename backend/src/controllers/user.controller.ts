/**
 * User Controller
 * Handles HTTP requests for user profile and settings operations
 */

import { Response, NextFunction } from 'express';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { stripe } from '../lib/stripe';
import { env } from '../config/env';
import logger from '../utils/logger';
import type { AuthRequest } from '../types';
import type {
  UpdateUserProfileRequest,
  UpdateUserProfileResponse,
  UpdatePasswordRequest,
  UpdatePasswordResponse,
  UpdateUserNotificationSettingsRequest,
  UpdateUserNotificationSettingsResponse,
  AuthUser,
} from '../../../shared-types';
import bcrypt from 'bcrypt';
import { z } from 'zod';

/**
 * Update user profile
 * PUT /api/v1/users/profile
 */
export async function updateProfile(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      firstName: z.string().min(1).max(100).optional(),
      lastName: z.string().min(1).max(100).optional(),
      phone: z.string().optional().nullable(),
      bio: z.string().max(500).optional().nullable(),
      avatarUrl: z.string().url().optional().nullable(),
      hairType: z.string().optional().nullable(),
      hairTexture: z.string().optional().nullable(),
      hairPreferences: z.string().optional().nullable(),
    });

    const data = schema.parse(req.body) as UpdateUserProfileRequest;

    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        bio: true,
        avatarUrl: true,
        hairType: true,
        hairTexture: true,
        hairPreferences: true,
        emailNotifications: true,
        smsNotifications: true,
        emailVerified: true,
      },
    });

    sendSuccess<UpdateUserProfileResponse>(res, {
      message: 'Profile updated successfully',
      user: user as AuthUser,
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
 * Update notification settings
 * PUT /api/v1/users/notifications
 */
export async function updateNotifications(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      emailNotificationsEnabled: z.boolean().optional(),
      smsNotificationsEnabled: z.boolean().optional(),
    });

    const data = schema.parse(req.body) as UpdateUserNotificationSettingsRequest;

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        emailNotifications: data.emailNotificationsEnabled,
        smsNotifications: data.smsNotificationsEnabled,
      },
      select: {
        id: true,
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    sendSuccess<UpdateUserNotificationSettingsResponse>(res, {
      message: 'Notification settings updated successfully',
      user: {
        id: user.id,
        emailNotifications: user.emailNotifications || false,
        smsNotifications: user.smsNotifications || false,
      },
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
 * Update user region
 * PUT /api/v1/users/region
 */
export async function updateRegion(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      regionCode: z.enum(['NA', 'EU', 'GH', 'NG'], {
        errorMap: () => ({ message: 'Invalid region code. Must be NA, EU, GH, or NG' }),
      }),
    });

    const data = schema.parse(req.body);

    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        regionCode: true,
        paymentMethodId: true,
        stripeCustomerId: true,
        paystackCustomerCode: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Check if this is a region change (not initial setting)
    const isRegionChange = user.regionCode && user.regionCode !== data.regionCode;

    if (isRegionChange) {
      // Check if user has any bookings
      const bookingCount = await prisma.booking.count({
        where: {
          clientId: userId,
        },
      });

      if (bookingCount > 0) {
        // Determine payment providers
        const oldProvider =
          user.regionCode === 'NA' || user.regionCode === 'EU' ? 'stripe' : 'paystack';
        const newProvider =
          data.regionCode === 'NA' || data.regionCode === 'EU' ? 'stripe' : 'paystack';

        // Only allow region change if payment provider stays the same
        // (e.g., NA ↔ EU is allowed, but NA ↔ GH is not)
        if (oldProvider !== newProvider) {
          throw new AppError(
            400,
            'Region cannot be changed to a different payment provider after your first booking. You can only switch between regions that use the same payment provider (e.g., North America ↔ Europe).'
          );
        }
        // If provider is the same, allow the change (e.g., NA to EU or GH to NG)
      }
    }

    // If region is changing and user has payment methods, clear them if provider changes
    if (user.regionCode && user.regionCode !== data.regionCode && user.paymentMethodId) {
      const oldProvider =
        user.regionCode === 'NA' || user.regionCode === 'EU' ? 'stripe' : 'paystack';
      const newProvider =
        data.regionCode === 'NA' || data.regionCode === 'EU' ? 'stripe' : 'paystack';

      // If provider is changing, clear payment methods
      if (oldProvider !== newProvider) {
        if (oldProvider === 'stripe' && user.stripeCustomerId) {
          try {
            // Detach payment method if exists
            if (user.paymentMethodId) {
              await stripe.paymentMethods.detach(user.paymentMethodId);
            }
          } catch (error) {
            logger.warn(`Failed to detach Stripe payment method: ${error}`);
          }
        }

        // Clear payment method data
        await prisma.user.update({
          where: { id: userId },
          data: {
            paymentMethodId: null,
            last4Digits: null,
            cardBrand: null,
            stripeCustomerId: null,
            paystackCustomerCode: null,
          },
        });
      }
    }

    // Update region
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        regionCode: data.regionCode,
        preferredCurrency:
          data.regionCode === 'NA'
            ? 'USD'
            : data.regionCode === 'EU'
              ? 'EUR'
              : data.regionCode === 'GH'
                ? 'GHS'
                : 'NGN',
      },
      select: {
        id: true,
        regionCode: true,
        preferredCurrency: true,
      },
    });

    sendSuccess(res, {
      message: 'Region updated successfully',
      regionCode: updatedUser.regionCode,
      currency: updatedUser.preferredCurrency,
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
 * Update password
 * PUT /api/v1/users/password
 */
export async function updatePassword(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      currentPassword: z.string().min(1, 'Current password is required'),
      newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    });

    const data = schema.parse(req.body) as UpdatePasswordRequest;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, passwordHash: true },
    });

    if (!user || !user.passwordHash) {
      throw new AppError(400, 'Cannot change password for this account');
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(data.currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError(400, 'Current password is incorrect');
    }

    // Hash new password
    const newPasswordHash = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    sendSuccess<UpdatePasswordResponse>(res, {
      message: 'Password updated successfully',
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
 * Get client payment methods
 * GET /api/v1/users/payment-methods
 */
export async function getPaymentMethods(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        paymentMethodId: true,
        last4Digits: true,
        cardBrand: true,
        stripeCustomerId: true,
        paystackCustomerCode: true,
        regionCode: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const regionCode = (user.regionCode || 'NA') as 'NA' | 'EU' | 'GH' | 'NG';
    const isStripe = regionCode === 'NA' || regionCode === 'EU';
    const expectedProvider = isStripe ? 'stripe' : 'paystack';

    const paymentMethods = [];

    // Only return payment method if it exists and matches the expected provider for the region
    if (user.paymentMethodId && (user.last4Digits || user.cardBrand)) {
      const actualProvider = user.stripeCustomerId ? 'stripe' : 'paystack';

      // Only include if provider matches region
      if (actualProvider === expectedProvider) {
        paymentMethods.push({
          id: user.paymentMethodId,
          last4: user.last4Digits,
          brand: user.cardBrand,
          type: actualProvider,
        });
      } else {
        // Provider mismatch - clear invalid payment method
        logger.warn(
          `Payment method provider mismatch for user ${userId}: expected ${expectedProvider}, got ${actualProvider}`
        );

        // Clear the mismatched payment method
        await prisma.user.update({
          where: { id: userId },
          data: {
            paymentMethodId: null,
            last4Digits: null,
            cardBrand: null,
            ...(actualProvider === 'stripe'
              ? { stripeCustomerId: null }
              : { paystackCustomerCode: null }),
          },
        });
      }
    }

    sendSuccess(res, {
      message: 'Payment methods retrieved successfully',
      paymentMethods,
      regionCode,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initialize Paystack transaction for payment method authorization
 * POST /api/v1/users/payment-methods/initialize-paystack
 */
export async function initializePaystackPaymentMethod(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        regionCode: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const regionCode = (user.regionCode || 'NA') as 'NA' | 'EU' | 'GH' | 'NG';

    // Only allow Paystack regions
    if (regionCode !== 'GH' && regionCode !== 'NG') {
      throw new AppError(400, 'Paystack payment method only available for Ghana and Nigeria');
    }

    // Paystack requires minimum amount (100 kobo/pesewas = 1 unit = 0.01 currency)
    // This is a minimal authorization charge required to get a reusable authorization code
    const minimalAmount = 100; // 100 kobo/pesewas = 1 unit (0.01 currency)

    // Get proper currency from region code (GHS for GH, NGN for NG)
    const currency = regionCode === 'GH' ? 'GHS' : 'NGN';

    // Initialize Paystack transaction
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: user.email,
        amount: minimalAmount, // Already in kobo/pesewas
        currency: currency,
        callback_url: `${env.FRONTEND_URL}/client/settings?payment_method_callback=true`,
        metadata: {
          userId: user.id,
          purpose: 'payment_method_authorization',
          custom_fields: [
            {
              display_name: 'Purpose',
              variable_name: 'purpose',
              value: 'payment_method_authorization',
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { message: string };
      throw new AppError(400, errorData.message || 'Failed to initialize payment');
    }

    const data = (await response.json()) as {
      status: boolean;
      message: string;
      data: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    sendSuccess(res, {
      message: 'Payment authorization initialized',
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Create SetupIntent for saving payment method
 * POST /api/v1/users/payment-methods/setup-intent
 */
export async function createSetupIntent(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get user with region info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        regionCode: true,
        stripeCustomerId: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    const regionCode = (user.regionCode || 'NA') as 'NA' | 'EU' | 'GH' | 'NG';
    const isStripe = regionCode === 'NA' || regionCode === 'EU';

    if (!isStripe) {
      throw new AppError(400, 'SetupIntent only available for Stripe regions');
    }

    let stripeCustomerId = user.stripeCustomerId;

    // Create customer if doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: `${user.firstName} ${user.lastName}`,
        metadata: {
          userId: user.id,
          type: 'client',
        },
      });
      stripeCustomerId = customer.id;

      // Update user with customer ID
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    }

    // Create SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer: stripeCustomerId,
      payment_method_types: ['card'],
      usage: 'off_session',
    });

    sendSuccess(res, {
      message: 'SetupIntent created successfully',
      clientSecret: setupIntent.client_secret || '',
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Add client payment method
 * POST /api/v1/users/payment-methods
 */
export async function addPaymentMethod(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      paymentMethodId: z.string().min(1, 'Payment method ID is required'),
      last4: z.string().nullable().optional(),
      brand: z.string().nullable().optional(),
    });

    const data = schema.parse(req.body);

    // Get user with region info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        regionCode: true,
        stripeCustomerId: true,
        paystackCustomerCode: true,
        paymentMethodId: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // Determine payment provider based on region
    const regionCode = (user.regionCode || 'NA') as 'NA' | 'EU' | 'GH' | 'NG';
    const isStripe = regionCode === 'NA' || regionCode === 'EU';
    const isPaystack = regionCode === 'GH' || regionCode === 'NG';

    if (isStripe) {
      // Handle Stripe payment method - Only allow one payment method per user

      let stripeCustomerId = user.stripeCustomerId;

      // Create customer if doesn't exist
      if (!stripeCustomerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          name: `${user.firstName} ${user.lastName}`,
          metadata: {
            userId: user.id,
            type: 'client',
          },
        });
        stripeCustomerId = customer.id;
      }

      // If user already has a payment method, detach the old one
      if (user.stripeCustomerId && user.paymentMethodId) {
        try {
          await stripe.paymentMethods.detach(user.paymentMethodId);
        } catch (error) {
          // Ignore errors if payment method doesn't exist or is already detached
          logger.warn(`Failed to detach old payment method: ${error}`);
        }
      }

      // Attach new payment method
      await stripe.paymentMethods.attach(data.paymentMethodId, {
        customer: stripeCustomerId,
      });

      // Set as default
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: data.paymentMethodId,
        },
      });

      // Get payment method details
      const paymentMethod = await stripe.paymentMethods.retrieve(data.paymentMethodId);

      // Update user - replace existing payment method
      await prisma.user.update({
        where: { id: userId },
        data: {
          stripeCustomerId,
          paymentMethodId: data.paymentMethodId,
          last4Digits: paymentMethod.card?.last4 || null,
          cardBrand: paymentMethod.card?.brand || null,
          // Clear Paystack fields if they exist (ensuring only one provider)
          paystackCustomerCode: null,
          updatedAt: new Date(),
        },
      });

      sendSuccess(res, {
        message: 'Payment method added successfully',
        paymentMethod: {
          id: data.paymentMethodId,
          last4: paymentMethod.card?.last4 || null,
          brand: paymentMethod.card?.brand || null,
          type: 'stripe',
        },
      });
    } else if (isPaystack) {
      // Handle Paystack authorization code
      // For Paystack, paymentMethodId is the authorization code
      let paystackCustomerCode = user.paystackCustomerCode;

      // Create customer if doesn't exist
      if (!paystackCustomerCode) {
        const customerResponse = await fetch('https://api.paystack.co/customer', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
          }),
        });

        const customerData = (await customerResponse.json()) as {
          status: boolean;
          data?: { customer_code: string };
        };
        if (customerData.status && customerData.data) {
          paystackCustomerCode = customerData.data.customer_code;
        }
      }

      // For Paystack, authorization details (last4, brand) are passed from the frontend
      // which already retrieved them during transaction verification
      // We use the authorization code and the provided card details
      const last4 = data.last4 || null;
      const brand = data.brand || null;

      // Update user - replace existing payment method
      await prisma.user.update({
        where: { id: userId },
        data: {
          paystackCustomerCode: paystackCustomerCode || null,
          paymentMethodId: data.paymentMethodId,
          last4Digits: last4,
          cardBrand: brand,
          // Clear Stripe fields if they exist (ensuring only one provider)
          stripeCustomerId: null,
          updatedAt: new Date(),
        },
      });

      sendSuccess(res, {
        message: 'Payment method added successfully',
        paymentMethod: {
          id: data.paymentMethodId,
          last4: last4,
          brand: brand,
          type: 'paystack',
        },
      });
    } else {
      throw new AppError(400, 'Invalid region code');
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}
