import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { stripe } from '../lib/stripe';
import type {
  InitializeBookingPaymentRequest,
  InitializeBookingPaymentResponse,
} from '../../../shared-types';

/**
 * Initialize Paystack transaction
 */
export async function initializePaystackTransaction(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
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
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
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

/**
 * Initialize payment for booking deposit
 */
export async function initializeBookingPayment(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const { bookingId } = req.body as InitializeBookingPaymentRequest;

    if (!bookingId) {
      throw new AppError(400, 'Booking ID is required');
    }

    // Get booking details with provider info
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: {
          select: {
            paymentProvider: true,
            regionCode: true,
          },
        },
      },
    });

    // Get client info separately
    const client = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        email: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (!client) {
      throw new AppError(404, 'Client not found');
    }

    if (booking.clientId !== userId) {
      throw new AppError(403, 'Unauthorized to pay for this booking');
    }

    if (booking.paymentStatus === 'DEPOSIT_PAID' || booking.paymentStatus === 'FULLY_PAID') {
      throw new AppError(400, 'Booking deposit already paid');
    }

    const paymentProvider = booking.provider.paymentProvider;
    const amount = Number(booking.totalAmount);
    const currency = booking.currency;

    if (paymentProvider === 'STRIPE') {
      // Initialize Stripe Payment Intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: currency.toLowerCase(),
        receipt_email: client.email,
        metadata: {
          bookingId: booking.id,
          depositAmount: booking.depositAmount.toString(),
          serviceFee: booking.serviceFee.toString(),
          type: 'booking_deposit',
        },
        automatic_payment_methods: {
          enabled: true,
        },
      });

      // Update booking with Stripe payment intent ID
      await prisma.booking.update({
        where: { id: booking.id },
        data: { stripePaymentIntentId: paymentIntent.id },
      });

      sendSuccess<InitializeBookingPaymentResponse>(res, {
        clientSecret: paymentIntent.client_secret || '',
        paymentProvider: 'stripe',
        amount,
        currency,
      });
    } else {
      // Initialize Paystack Transaction
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: client.email,
          amount: Math.round(amount * 100), // Convert to kobo/pesewas
          currency: currency,
          callback_url: `${env.FRONTEND_URL}/bookings/${booking.id}/confirm`,
          metadata: {
            bookingId: booking.id,
            depositAmount: booking.depositAmount.toString(),
            serviceFee: booking.serviceFee.toString(),
            type: 'booking_deposit',
          },
        }),
      });

      if (!paystackResponse.ok) {
        const errorData = (await paystackResponse.json()) as { message: string };
        throw new AppError(400, errorData.message || 'Failed to initialize payment');
      }

      const paystackData = (await paystackResponse.json()) as {
        data: {
          authorization_url: string;
          access_code: string;
          reference: string;
        };
      };

      // Update booking with Paystack reference
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paystackReference: paystackData.data.reference,
          paystackAccessCode: paystackData.data.access_code,
        },
      });

      sendSuccess<InitializeBookingPaymentResponse>(res, {
        authorizationUrl: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        paymentProvider: 'paystack',
        amount,
        currency,
      });
    }
  } catch (error) {
    next(error);
  }
}
