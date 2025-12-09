import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { stripe } from '../lib/stripe';
import Stripe from 'stripe';
import { generateIdempotencyKey } from '../lib/payment';
import { paymentConfig } from '../config/payment.config';
import { exchangeRateService } from '../lib/exchange-rate.service';
import { getOrCreatePaystackCustomer } from '../lib/paystack-customer';
import { getPaystackPlanCode } from '../lib/paystack-plans';
import {
  InitializeBookingPaymentRequest,
  InitializeBookingPaymentResponse,
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

    const { email, amount, subscriptionTier } = req.body;

    if (!email || !amount || !subscriptionTier) {
      throw new AppError(400, 'Missing required fields');
    }

    // ✅ SECURITY: Get region from middleware (server-side detection only)
    const regionCode = req.clientRegion?.regionCode || 'NA';
    const currency = req.clientRegion?.currency || 'USD';

    // Validate region code is supported for Paystack
    // if (regionCode !== 'GH' && regionCode !== 'NG') {
    //   throw new AppError(400, 'Paystack is only available for Ghana (GH) and Nigeria (NG)');
    // }

    // ✅ CURRENCY CONVERSION: Convert USD subscription amount to local currency using LIVE rates
    // Amount from frontend is in USD, we need to convert to GHS/NGN
    const amountUSD = amount; // Subscription price in USD (19 or 49)
    const amountInLocalCurrency = await exchangeRateService.convertCurrency(
      amountUSD,
      'USD',
      currency as 'GHS' | 'NGN'
    );

    // Initialize transaction with Paystack
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amountInLocalCurrency * 100), // Convert to kobo/pesewas
        currency: currency, 
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
 * Initialize Paystack subscription (for provider onboarding)
 * CORRECT FLOW: Payment first, then subscription via webhook
 */
export async function initializePaystackSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { email, subscriptionTier } = req.body;

    if (!email || !subscriptionTier) {
      throw new AppError(400, 'Missing required fields: email and subscriptionTier');
    }

    if (subscriptionTier !== 'solo' && subscriptionTier !== 'salon') {
      throw new AppError(400, 'Invalid subscription tier. Must be "solo" or "salon"');
    }

    // ✅ SECURITY: Get region from middleware (server-side detection only)
    const regionCode = req.clientRegion?.regionCode || 'NA';
    const currency = req.clientRegion?.currency || 'GHS';

    // Get or create Paystack customer
    const customer = await getOrCreatePaystackCustomer(userId, email);

    // Get plan code based on tier and region
    const planCode = getPaystackPlanCode(
      subscriptionTier,
      regionCode as 'GH' | 'NG' // Use actual region from middleware
    );

    // Calculate amount based on tier
    const amount = subscriptionTier === 'solo' ? 23750 : 61250; // GHS in pesewas

    console.log('Initializing Paystack payment for subscription:', {
      regionCode,
      subscriptionTier,
      planCode,
      amount,
      customerCode: customer.customer_code,
    });

    // Save customer code to database immediately
    await prisma.providerProfile.update({
      where: { userId },
      data: {
        paystackCustomerCode: customer.customer_code,
      },
    });

    // STEP 1: Initialize payment transaction FIRST
    // This collects the card details and authorization
    const txnResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount, // Amount in kobo/pesewas
        currency: currency,
        customer: customer.customer_code, // Link transaction to customer
        callback_url: `${env.FRONTEND_URL}/provider/onboarding/payment-callback?provider=paystack&region=${regionCode}&tier=${subscriptionTier}`,
        metadata: {
          type: 'subscription_initialization',
          planCode,
          userId,
          tier: subscriptionTier,
          customerCode: customer.customer_code,
        },
      }),
    });

    if (!txnResponse.ok) {
      const txnError = await txnResponse.json();
      console.error('Failed to initialize payment transaction:', txnError);
      throw new AppError(500, `Failed to initialize payment: ${JSON.stringify(txnError)}`);
    }

    const txnData = (await txnResponse.json()) as {
      status: boolean;
      message: string;
      data: {
        authorization_url: string;
        access_code: string;
        reference: string;
      };
    };

    console.log('✅ Payment initialized successfully:', txnData.data.reference);

    // Return payment link
    // Subscription will be created in webhook after successful payment
    sendSuccess(res, {
      message: 'Payment initialized. Complete payment to activate subscription.',
      authorizationUrl: txnData.data.authorization_url,
      reference: txnData.data.reference,
      planCode,
      tier: subscriptionTier,
      amount,
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
 * Verify Paystack subscription payment
 * Called after user completes payment and is redirected back
 */
export async function verifyPaystackSubscription(
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
        authorization: {
          authorization_code: string;
          last4: string;
          brand: string;
        };
        customer: {
          customer_code: string;
        };
        metadata?: {
          subscriptionCode?: string;
          subscriptionTier?: string;
        };
      };
    };

    if (!paystackResponse.status || paystackResponse.data.status !== 'success') {
      throw new AppError(400, 'Subscription payment was not successful');
    }

    // Get provider profile
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Subscription should already be created and saved during initialization
    // This endpoint just confirms payment was successful
    sendSuccess(res, {
      message: 'Subscription payment verified successfully',
      status: paystackResponse.data.status,
      subscriptionCode: profile.paystackSubscriptionCode,
      subscriptionStatus: profile.subscriptionStatus,
      nextBillingDate: profile.nextBillingDate,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update payment method for Paystack subscription
 * Allows providers to update their card for recurring payments
 */
export async function updatePaystackPaymentMethod(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    // Get provider profile
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    if (!profile.paystackSubscriptionCode) {
      throw new AppError(400, 'No active Paystack subscription found');
    }

    if (!profile.paystackCustomerCode) {
      throw new AppError(400, 'Paystack customer not found');
    }

    // Get current region from middleware
    const currency = req.clientRegion?.currency || 'GHS';

    // Initialize a transaction to get new authorization
    // This will redirect user to Paystack to enter new card details
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: profile.user.email,
        amount: 50, // Minimal amount (50 kobo = 0.50 currency unit) for authorization
        currency: currency,
        callback_url: `${env.FRONTEND_URL}/provider/settings/subscription/payment-method/callback`,
        metadata: {
          type: 'payment_method_update',
          userId,
          providerId: profile.id,
          subscriptionCode: profile.paystackSubscriptionCode,
        },
        channels: ['card'], // Only allow card payments
      }),
    });

    if (!response.ok) {
      throw new AppError(500, 'Failed to initialize payment method update');
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

    if (!data.status) {
      throw new AppError(500, data.message || 'Failed to initialize payment method update');
    }

    sendSuccess(res, {
      message: 'Payment method update initialized',
      authorizationUrl: data.data.authorization_url,
      reference: data.data.reference,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Handle payment method update callback from Paystack
 * Called after user completes card authorization
 */
export async function handlePaystackPaymentMethodCallback(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { reference } = req.query;

    if (!reference || typeof reference !== 'string') {
      throw new AppError(400, 'Transaction reference is required');
    }

    // Verify the transaction
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
      data: {
        status: string;
        authorization: {
          authorization_code: string;
          last4: string;
          brand: string;
        };
        metadata?: {
          type?: string;
          subscriptionCode?: string;
        };
      };
    };

    if (!paystackResponse.status || paystackResponse.data.status !== 'success') {
      throw new AppError(400, 'Payment authorization failed');
    }

    // Verify this is a payment method update
    if (paystackResponse.data.metadata?.type !== 'payment_method_update') {
      throw new AppError(400, 'Invalid transaction type');
    }

    // Update provider profile with new authorization code
    await prisma.providerProfile.update({
      where: { userId },
      data: {
        paymentMethodId: paystackResponse.data.authorization.authorization_code,
        last4Digits: paystackResponse.data.authorization.last4,
        cardBrand: paystackResponse.data.authorization.brand,
        updatedAt: new Date(),
      },
    });

    sendSuccess(res, {
      message: 'Payment method updated successfully',
      last4: paystackResponse.data.authorization.last4,
      brand: paystackResponse.data.authorization.brand,
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Initialize booking payment (deposit or balance)
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
      bookingId: z.string().uuid(),
      paymentType: z.enum(['deposit', 'balance']),
      paymentMethodId: z.string().optional(),
    });

    const data = schema.parse(req.body) as InitializeBookingPaymentRequest;

    // Get booking to validate payment status
    const booking = await prisma.booking.findUnique({
      where: { id: data.bookingId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.clientId !== userId) {
      throw new AppError(403, 'Unauthorized to pay for this booking');
    }

    const { paymentType = 'deposit' } = data;

    // ✅ VALIDATION: Prevent double payments
    if (paymentType === 'deposit') {
      // Check if deposit is already paid
      if (booking.paymentStatus === 'DEPOSIT_PAID' || booking.paymentStatus === 'FULLY_PAID') {
        throw new AppError(
          400,
          'Deposit has already been paid. Please refresh the page to see the latest booking status.'
        );
      }
    } else if (paymentType === 'balance') {
      // Check if balance is already paid
      if (booking.paymentStatus === 'FULLY_PAID') {
        throw new AppError(
          400,
          'Balance has already been paid. Please refresh the page to see the latest booking status.'
        );
      }
      // Check if deposit hasn't been paid yet
      if (booking.paymentStatus !== 'DEPOSIT_PAID') {
        throw new AppError(
          400,
          'Deposit must be paid before paying the balance. Please pay the deposit first.'
        );
      }
    }

    // Verify the booking belongs to the authenticated user
    if (booking.clientId !== userId) {
      throw new AppError(403, 'You do not have permission to pay for this booking');
    }

    const client = booking.client;

    // ✅ CRITICAL FIX: Use CLIENT's region to determine payment provider
    // Client's location determines which payment gateway they can use
    const paymentProvider = booking.paymentProvider; // This was set during booking creation based on client region
    
    // ✅ Calculate amount based on payment type
    const amount = paymentType === 'deposit'
      ? Number(booking.depositAmount) + Number(booking.serviceFee) // Deposit + platform fee
      : Number(booking.totalAmount) - Number(booking.depositAmount) - Number(booking.serviceFee); // Balance (total - deposit - fee already paid)

    const currency = booking.currency;

    if (paymentProvider === 'STRIPE') {
      let paymentIntent;

      console.log('🔍 Payment initialization:', {
        paymentType,
        bookingId: booking.id,
        existingPaymentIntentId: booking.stripePaymentIntentId,
        amount,
      });

      // For deposit payments, always create a new PaymentIntent to avoid terminal state issues
      // For balance payments, we can try to reuse if it exists and is not in terminal state
      if (paymentType === 'balance' && booking.stripePaymentIntentId) {
        try {
          console.log('🔍 Attempting to retrieve existing PaymentIntent for balance...');
          paymentIntent = await stripe.paymentIntents.retrieve(booking.stripePaymentIntentId);

          console.log('🔍 Retrieved PaymentIntent status:', paymentIntent.status);

          // If payment intent is in a terminal state, create a new one
          if (['succeeded', 'canceled'].includes(paymentIntent.status)) {
            console.log('⚠️ PaymentIntent in terminal state, will create new one');
            paymentIntent = null;
          } else if (paymentIntent.amount !== Math.round(amount * 100)) {
            // Update amount if changed
            console.log('🔄 Updating PaymentIntent amount');
            paymentIntent = await stripe.paymentIntents.update(booking.stripePaymentIntentId, {
              amount: Math.round(amount * 100),
            });
          } else {
            console.log('✅ Reusing existing PaymentIntent');
          }
          // Otherwise, reuse existing PaymentIntent
        } catch (error) {
          // PaymentIntent not found or error, create new one
          console.log('❌ Error retrieving PaymentIntent:', error);
          paymentIntent = null;
        }
      } else if (paymentType === 'deposit') {
        console.log('💰 Deposit payment - will create new PaymentIntent');
      }

      // Create new PaymentIntent if needed (or for deposit payments)
      if (!paymentIntent) {
        console.log('🆕 Creating new PaymentIntent...');
        
        // For deposit payments, don't use idempotency key to allow fresh PaymentIntent creation
        // For balance payments, use idempotency key to prevent duplicate charges
        const createParams: Stripe.PaymentIntentCreateParams = {
          amount: Math.round(amount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          receipt_email: client.email,
          metadata: {
            bookingId: booking.id,
            depositAmount: booking.depositAmount.toString(),
            serviceFee: booking.serviceFee.toString(),
            paymentType: paymentType, // deposit or balance
            type: paymentType === 'deposit' ? 'booking_deposit' : 'booking_balance',
          },
          automatic_payment_methods: {
            enabled: true,
          },
          setup_future_usage: 'off_session', // Save payment method for future use
        };

        // Only pass options object if we have an idempotency key (balance payments)
        if (paymentType === 'balance') {
          paymentIntent = await stripe.paymentIntents.create(createParams, {
            idempotencyKey: generateIdempotencyKey(booking.id, paymentType),
          });
        } else {
          // For deposit payments, don't pass options object at all
          paymentIntent = await stripe.paymentIntents.create(createParams);
        }

        console.log('✅ Created new PaymentIntent:', paymentIntent.id);

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
      // ✅ Paystack Transaction Initialization
      // Amount and currency are already converted in booking service
      // Paystack requires amounts in subunits (kobo for NGN, pesewas for GHS)
      
      const amountInSubunits = Math.round(amount * 100);
      
      // Phase 4: Support multiple payment channels
      const paymentChannel = req.body.paymentChannel || 'card'; // card, mobile_money, bank_transfer
      const mobileMoneyProvider = req.body.mobileMoneyProvider; // mtn, vod, atl
      const phoneNumber = req.body.phoneNumber; // For mobile money
      
      const requestBody: any = {
        email: client.email,
        amount: amountInSubunits, // Amount in kobo/pesewas
        currency: currency, // GHS or NGN (must be enabled in dashboard)
        callback_url: `${env.FRONTEND_URL}/bookings/${booking.id}/confirm`,
        metadata: {
          bookingId: booking.id,
          depositAmount: booking.depositAmount.toString(),
          serviceFee: booking.serviceFee.toString(),
          paymentType: paymentType, // deposit or balance
          type: paymentType === 'deposit' ? 'booking_deposit' : 'booking_balance',
          clientRegionCode: booking.clientRegionCode,
        },
      };
      
      // Add channel-specific parameters
      if (paymentChannel === 'mobile_money' && mobileMoneyProvider && phoneNumber) {
        requestBody.channels = ['mobile_money'];
        requestBody.mobile_money = {
          phone: phoneNumber,
          provider: mobileMoneyProvider, // mtn, vod, atl
        };
      } else if (paymentChannel === 'bank_transfer') {
        requestBody.channels = ['bank_transfer'];
      } else {
        requestBody.channels = ['card']; // Default to card
      }
      
      const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!paystackResponse.ok) {
        const errorData = (await paystackResponse.json()) as { message: string };
        throw new AppError(400, errorData.message || 'Failed to initialize Paystack payment');
      }

      const paystackData = (await paystackResponse.json()) as {
        status: boolean;
        message: string;
        data: {
          authorization_url: string;
          access_code: string;
          reference: string;
        };
      };

      // Update booking with Paystack reference and access code
      await prisma.booking.update({
        where: { id: booking.id },
        data: {
          paystackReference: paystackData.data.reference,
          paystackAccessCode: paystackData.data.access_code,
        },
      });

      // Return access_code for frontend Popup JS integration
      sendSuccess<InitializeBookingPaymentResponse>(res, {
        accessCode: paystackData.data.access_code, // ✅ For Popup JS
        authorizationUrl: paystackData.data.authorization_url, // ✅ For redirect flow
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

    // Get currency from booking (already set based on client's region)
    const currency = booking.currency;
    const paymentProvider = booking.paymentProvider; // Use booking's payment provider (client's region)

    if (paymentProvider === 'STRIPE') {
      // Process Stripe tip payment
      const paymentIntent = await stripe.paymentIntents.create(
        {
          amount: Math.round(data.tipAmount * 100), // Convert to cents
          currency: currency.toLowerCase(),
          customer: booking.client.stripeCustomerId || undefined,
          payment_method: data.paymentMethodId || booking.client.paymentMethodId || undefined,
          confirm: true,
          automatic_payment_methods: {
            enabled: true,
            allow_redirects: 'never', // Prevent redirect-based payment methods
          },
          return_url: `${env.FRONTEND_URL}/client/bookings/${booking.id}`, // Required for redirect payment methods
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
