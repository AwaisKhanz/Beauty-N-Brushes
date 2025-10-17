import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';

/**
 * Initialize Paystack transaction
 */
export async function initializePaystackTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { email, amount, currency, subscriptionTier, regionCode } = req.body;

    if (!email || !amount || !currency || !subscriptionTier || !regionCode) {
      throw new AppError(400, 'Missing required fields');
    }

    // TESTING: Force ZAR currency for test accounts (based on dashboard settings)
    const testCurrency = 'ZAR';

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo/pesewas
        currency: testCurrency, // TESTING: Use ZAR for test accounts
        callback_url: `${env.FRONTEND_URL}/onboarding/payment-callback?provider=paystack&region=${regionCode}&tier=${subscriptionTier}`,
        metadata: {
          userId,
          subscriptionTier,
          regionCode,
          custom_fields: [
            {
              display_name: 'Subscription Tier',
              variable_name: 'subscription_tier',
              value: subscriptionTier,
            },
          ],
        },
      }),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as { message: string };
      console.error('Paystack initialization failed:', errorData);
      console.error('Attempted with currency:', testCurrency);
      throw new AppError(400, errorData.message || 'Failed to initialize payment');
    }

    const data = (await response.json()) as {
      data: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    sendSuccess(res, {
      authorizationUrl: data.data.authorization_url,
      accessCode: data.data.access_code,
      reference: data.data.reference,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Verify Paystack transaction
 */
export async function verifyPaystackTransaction(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = (req as AuthRequest).user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { reference } = req.params;

    if (!reference) {
      throw new AppError(400, 'Transaction reference is required');
    }

    // Verify transaction with Paystack
    const response = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
      },
    });

    if (!response.ok) {
      throw new AppError(400, 'Failed to verify transaction');
    }

    const data = (await response.json()) as {
      data: {
        status: string;
        amount: number;
        currency: string;
        authorization: { authorization_code: string };
        customer: { email: string };
      };
    };

    if (data.data.status !== 'success') {
      throw new AppError(400, 'Transaction was not successful');
    }

    sendSuccess(res, {
      status: data.data.status,
      amount: data.data.amount / 100, // Convert from kobo/pesewas
      currency: data.data.currency,
      authorizationCode: data.data.authorization?.authorization_code,
      customer: data.data.customer,
    });
  } catch (error) {
    next(error);
  }
}
