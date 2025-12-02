import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { stripe } from '../lib/stripe';
import { getRegionalCurrency, generateIdempotencyKey } from '../lib/payment';
import { paymentConfig } from '../config/payment.config';
import type { RegionCode } from '../types/payment.types';
import type {
  InitializeBookingPaymentRequest,
  InitializeBookingPaymentResponse,
  PayBalanceRequest,
  PayBalanceResponse,
} from '../../../shared-types';
import { z } from 'zod';

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

    const { email, amount, subscriptionTier, regionCode } = req.body;

    if (!email || !amount || !subscriptionTier || !regionCode) {
      throw new AppError(400, 'Missing required fields');
    }

    // Get proper currency from region code (GHS for GH, NGN for NG)
    const currency = getRegionalCurrency(regionCode);

    // Validate region code is supported for Paystack
    if (regionCode !== 'GH' && regionCode !== 'NG') {
      throw new AppError(400, 'Paystack is only available for Ghana (GH) and Nigeria (NG)');
    }

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: amount * 100, // Convert to kobo/pesewas
        currency: currency, // Use proper currency for region
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
      console.error('Attempted with currency:', currency, 'region:', regionCode);
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

    const paystackResponse = (await response.json()) as {
      status: boolean;
      message: string;
      data: {
        status: string;
        reference: string;
        amount: number;
        currency: string;
        paid_at: string;
        channel: string;
        authorization: {
          authorization_code: string;
          bin: string;
          last4: string;
          exp_month: string;
          exp_year: string;
          card_type: string;
          bank: string;
          country_code: string;
          brand: string;
          reusable: boolean;
        };
        customer: {
          id: number;
          email: string;
          customer_code: string;
        };
        metadata?: {
          [key: string]: unknown;
        };
      };
    };

    if (!paystackResponse.status || paystackResponse.data.status !== 'success') {
      throw new AppError(400, 'Transaction was not successful');
    }

    sendSuccess(res, {
      status: paystackResponse.data.status,
      reference: paystackResponse.data.reference,
      amount: paystackResponse.data.amount / 100, // Convert from kobo/pesewas
      currency: paystackResponse.data.currency,
      paid_at: paystackResponse.data.paid_at,
      channel: paystackResponse.data.channel,
      authorization: paystackResponse.data.authorization,
      customer: paystackResponse.data.customer,
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

    const schema = z.object({
      bookingId: z.string().uuid('Valid booking ID is required'),
    });

    const data = schema.parse(req.body) as InitializeBookingPaymentRequest;
    const { bookingId } = data;

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
      let paymentIntent;

      // Check if PaymentIntent already exists and can be reused
      if (booking.stripePaymentIntentId) {
        try {
          paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);

          // If payment intent is in a terminal state, create a new one
          if (['succeeded', 'canceled'].includes(paymentIntent.status)) {
            paymentIntent = null;
          } else if (paymentIntent.amount !== Math.round(amount * 100)) {
            // Update amount if changed
            paymentIntent = await stripe.paymentIntents.update(booking.stripePaymentIntentId, {
              amount: Math.round(amount * 100),
            });
          }
          // Otherwise, reuse existing PaymentIntent
        } catch (error) {
          // PaymentIntent not found or error, create new one
          paymentIntent = null;
        }
      }

      // Create new PaymentIntent if needed
      if (!paymentIntent) {
        paymentIntent = await stripe.paymentIntents.create(
          {
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
            setup_future_usage: 'off_session', // Save payment method for future use
          },
          {
            idempotencyKey: generateIdempotencyKey(booking.id, 'deposit'),
          }
        );

        // Update booking with new PaymentIntent ID
        await prisma.booking.update({
          where: { id: booking.id },
          data: { stripePaymentIntentId: paymentIntent.id },
        });
      }

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
          Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
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
    if (error instanceof z.ZodError) {
      return next(
        new AppError(400, `Validation failed: ${error.errors.map((e) => e.message).join(', ')}`)
      );
    }
    next(error);
  }
}

/**
 * Pay balance for booking (remaining amount after deposit)
 */
export async function payBalance(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) throw new AppError(401, 'Unauthorized');

    const { bookingId, paymentMethod = 'online' } = req.body as PayBalanceRequest;

    if (!bookingId) {
      throw new AppError(400, 'Booking ID is required');
    }

    // Get booking details
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

    if (booking.paymentStatus === 'FULLY_PAID') {
      throw new AppError(400, 'Balance already paid');
    }

    // Calculate balance (service price - deposit)
    const balanceAmount = Number(booking.servicePrice) - Number(booking.depositAmount);

    if (balanceAmount <= 0) {
      throw new AppError(400, 'No balance to pay');
    }

    // Handle cash payment
    if (paymentMethod === 'cash') {
      // Mark as cash payment - provider will confirm when received
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          paymentMethod: 'cash',
          updatedAt: new Date(),
        },
      });

      return sendSuccess<PayBalanceResponse>(res, {
        amount: balanceAmount,
        currency: booking.currency,
        paymentMethod: 'cash',
        message: 'Balance will be paid in cash at appointment',
      });
    }

    // Handle online payment
    const paymentProvider = booking.provider.paymentProvider;
    const currency = booking.currency;

    if (paymentProvider === 'STRIPE') {
      // Initialize Stripe Payment Intent for balance
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(balanceAmount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          metadata: {
            bookingId: booking.id,
            type: 'balance_payment',
            balanceAmount: balanceAmount.toString(),
          },
        },
        {
          idempotencyKey: generateIdempotencyKey(booking.id, 'balance'),
        }
      );

      sendSuccess<PayBalanceResponse>(res, {
        clientSecret: paymentIntent.client_secret || undefined,
        paymentProvider: 'stripe',
        amount: balanceAmount,
        currency,
        paymentMethod: 'online',
        message: 'Payment intent created',
      });
    } else {
      // Initialize Paystack Transaction for balance
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: client.email,
          amount: Math.round(balanceAmount * 100), // Convert to kobo/pesewas
          currency: currency,
          callback_url: `${env.FRONTEND_URL}/bookings/${booking.id}/confirm`,
          metadata: {
            bookingId: booking.id,
            balanceAmount: balanceAmount.toString(),
            type: 'balance_payment',
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

      sendSuccess<PayBalanceResponse>(res, {
        authorizationUrl: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        paymentProvider: 'paystack',
        amount: balanceAmount,
        currency,
        paymentMethod: 'online',
        message: 'Payment initialized',
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Process tip payment for completed booking
 */
export async function payTip(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const schema = z.object({
      bookingId: z.string().uuid('Valid booking ID is required'),
      tipAmount: z.number().positive('Tip amount must be positive'),
      paymentMethodId: z.string().optional(),
    });

    const data = schema.parse(req.body);

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        client: true,
        service: {
          include: {
            provider: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.clientId !== userId) {
      throw new AppError(403, 'Not authorized to tip this booking');
    }

    if (booking.bookingStatus !== 'COMPLETED') {
      throw new AppError(400, 'Can only tip completed bookings');
    }

    // Get currency based on provider's region code
    const regionCode = booking.service.provider.regionCode as RegionCode;
    const currency = getRegionalCurrency(regionCode);

    if (booking.service.provider.paymentProvider === 'STRIPE') {
      // Process Stripe tip payment
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(data.tipAmount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          customer: booking.client.stripeCustomerId || undefined,
          payment_method: data.paymentMethodId || booking.client.paymentMethodId || undefined,
          confirm: true,
          metadata: {
            bookingId: booking.id,
            type: 'tip_payment',
            tipAmount: data.tipAmount.toString(),
          },
        },
        {
          idempotencyKey: generateIdempotencyKey(booking.id, 'tip'),
        }
      );

      // Update booking with tip amount and details
      await prisma.booking.update({
        where: { id: booking.id },
        data: { 
          tipAmount: data.tipAmount,
          tipPaidAt: new Date(),
          tipPaymentIntentId: paymentIntent.id,
          tipPaymentMethod: 'online'
        },
      });

      sendSuccess(res, {
        message: 'Tip payment successful',
        tipAmount: data.tipAmount,
        currency,
        paymentIntentId: paymentIntent.id,
      });
    } else {
      // Process Paystack tip payment
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: booking.client.email,
          amount: Math.round(data.tipAmount * 100), // Convert to kobo/pesewas
          currency: currency,
          callback_url: `${env.FRONTEND_URL}/bookings/${booking.id}/tip-confirm`,
          metadata: {
            bookingId: booking.id,
            type: 'tip_payment',
            tipAmount: data.tipAmount.toString(),
          },
        }),
      });

      if (!paystackResponse.ok) {
        const errorData = (await paystackResponse.json()) as { message: string };
        throw new AppError(400, errorData.message || 'Failed to initialize tip payment');
      }

      const paystackData = (await paystackResponse.json()) as {
        data: {
          authorization_url: string;
          access_code: string;
          reference: string;
        };
      };

      sendSuccess(res, {
        message: 'Tip payment initialized',
        authorizationUrl: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
        tipAmount: data.tipAmount,
        currency,
      });
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
