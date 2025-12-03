import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import crypto from 'crypto';
import { emailService } from '../lib/email';
import { env } from '../config/env';
import { paymentConfig } from '../config/payment.config';
import type { PaystackSubscriptionData, PaystackChargeData } from '../../../shared-types';
import { SUBSCRIPTION_TIERS } from '../../../shared-constants';

const stripe = new Stripe(paymentConfig.stripe.secretKey || '', {
  apiVersion: '2023-10-16',
});

/**
 * Handle Stripe webhooks
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  console.log('🔔 Stripe webhook received!');
  console.log('   Headers:', req.headers);
  console.log('   Body type:', typeof req.body);
  console.log('   Body length:', req.body?.length || 0);
  
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = paymentConfig.stripe.webhookSecret;

  console.log('   Webhook secret configured:', !!webhookSecret);
  console.log('   Signature present:', !!sig);

  if (!webhookSecret) {
    logger.error('Stripe webhook secret not configured');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    console.log('✅ Webhook signature verified! Event type:', event.type);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    logger.error(`Webhook signature verification failed: ${errorMessage}`);
    res.status(400).send(`Webhook Error: ${errorMessage}`);
    return;
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription);
        break;

      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'payment_intent.succeeded':
        await handleBookingPaymentSucceeded(event.data.object as Stripe.PaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handleBookingPaymentFailed(event.data.object as Stripe.PaymentIntent);
        break;

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer);
        break;

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod);
        break;

      case 'invoice.upcoming':
        await handleInvoiceUpcoming(event.data.object as Stripe.Invoice);
        break;

      case 'customer.subscription.paused':
        await handleSubscriptionPaused(event.data.object as Stripe.Subscription);
        break;

      case 'customer.subscription.resumed':
        await handleSubscriptionResumed(event.data.object as Stripe.Subscription);
        break;

      default:
        logger.info(`Unhandled Stripe event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    logger.error('Error processing Stripe webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
}

/**
 * Handle subscription created
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription): Promise<void> {
  logger.info(`Subscription created: ${subscription.id}`);

  const providerId = subscription.metadata?.providerId;
  if (!providerId) return;

  await prisma.providerProfile.update({
    where: { id: providerId },
    data: {
      stripeSubscriptionId: subscription.id,
      subscriptionStatus: subscription.status === 'trialing' ? 'TRIAL' : 'ACTIVE',
    },
  });
}

/**
 * Handle subscription updated
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
  logger.info(`Subscription updated: ${subscription.id}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeSubscriptionId: subscription.id },
  });

  if (!profile) return;

  // Map Stripe status to our status
  let status: 'TRIAL' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' | 'EXPIRED' = 'ACTIVE';

  if (subscription.status === 'trialing') status = 'TRIAL';
  else if (subscription.status === 'active') status = 'ACTIVE';
  else if (subscription.status === 'past_due') status = 'PAST_DUE';
  else if (subscription.status === 'canceled') status = 'CANCELLED';
  else if (subscription.status === 'incomplete_expired') status = 'EXPIRED';

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: status,
    },
  });
}

/**
 * Handle subscription deleted/cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
  logger.info(`Subscription cancelled: ${subscription.id}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true },
  });

  if (!profile) return;

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: 'CANCELLED',
    },
  });

  // Send cancellation confirmation email
  if (profile) {
    await emailService.sendSubscriptionCancelledEmail(profile.user.email, {
      firstName: profile.user.firstName,
      accessEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      reactivateUrl: `${env.FRONTEND_URL}/dashboard/subscription`,
    });
  }
}

/**
 * Handle trial will end (3 days before)
 */
async function handleTrialWillEnd(subscription: Stripe.Subscription): Promise<void> {
  logger.info(`Trial ending soon: ${subscription.id}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true },
  });

  if (!profile) return;

  // Send trial ending reminder email
  if (profile) {
    const trialEndDate = new Date(profile.trialEndDate || Date.now());
    const billingStartDate = new Date(trialEndDate.getTime() + 24 * 60 * 60 * 1000);

    await emailService.sendTrialEndingEmail(profile.user.email, {
      firstName: profile.user.firstName,
      trialEndDate: trialEndDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      billingStartDate: billingStartDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      monthlyFee: `$${profile.monthlyFee || (profile.isSalon ? SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD : SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD)}`,
      paymentMethod: '•••• •••• •••• ' + (profile.stripeCustomerId ? '****' : '****'),
      manageSubscriptionUrl: `${env.FRONTEND_URL}/dashboard/subscription`,
    });
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
  logger.info(`Payment succeeded: ${invoice.id}`);

  const subscription = invoice.subscription as string;
  if (!subscription) return;

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeSubscriptionId: subscription },
    include: { user: true },
  });

  if (!profile) return;

  // Update subscription status to active
  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: 'ACTIVE',
    },
  });

  // Send payment receipt email
  if (profile) {
    const planName = profile.isSalon ? SUBSCRIPTION_TIERS.SALON.name : SUBSCRIPTION_TIERS.SOLO.name;
    const amount = invoice.amount_paid ? `$${(invoice.amount_paid / 100).toFixed(2)}` : '$0.00';

    await emailService.sendPaymentSuccessEmail(profile.user.email, {
      firstName: profile.user.firstName,
      amount,
      planName,
      paymentDate: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      paymentMethod: '•••• •••• •••• ****',
      dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
    });
  }
}

/**
 * Handle failed payment
 */
async function handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
  logger.info(`Payment failed: ${invoice.id}`);

  const subscription = invoice.subscription as string;
  if (!subscription) return;

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeSubscriptionId: subscription },
    include: { user: true },
  });

  if (!profile) return;

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: 'PAST_DUE',
    },
  });

  // Send payment failed notification email
  if (profile) {
    const amount = `$${profile.monthlyFee || (profile.isSalon ? SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD : SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD)}`;

    await emailService.sendPaymentFailedEmail(profile.user.email, {
      firstName: profile.user.firstName,
      amount,
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      updatePaymentUrl: `${env.FRONTEND_URL}/dashboard/subscription/payment-method`,
    });
  }
}

/**
 * Handle payment method attached
 */
/**
 * Handle payment method attached
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
  logger.info(`Payment method attached: ${paymentMethod.id}`);

  const customerId = paymentMethod.customer as string;
  if (!customerId) return;

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeCustomerId: customerId },
  });

  if (!profile) return;

  // Update payment method details
  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      paymentMethodId: paymentMethod.id,
      last4Digits: paymentMethod.card?.last4,
      cardBrand: paymentMethod.card?.brand,
    },
  });
}

/**
 * Handle payment method detached
 */
async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod): Promise<void> {
  logger.info(`Payment method detached: ${paymentMethod.id}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { paymentMethodId: paymentMethod.id },
  });

  if (!profile) return;

  // Clear payment method details
  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      paymentMethodId: null,
      last4Digits: null,
      cardBrand: null,
    },
  });
}

/**
 * Handle customer updated
 */
async function handleCustomerUpdated(customer: Stripe.Customer): Promise<void> {
  logger.info(`Customer updated: ${customer.id}`);

  // Update default payment method if changed
  if (customer.invoice_settings?.default_payment_method) {
    const paymentMethodId =
      typeof customer.invoice_settings.default_payment_method === 'string'
        ? customer.invoice_settings.default_payment_method
        : customer.invoice_settings.default_payment_method.id;

    const profile = await prisma.providerProfile.findFirst({
      where: { stripeCustomerId: customer.id },
    });

    if (profile) {
      const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          paymentMethodId: paymentMethod.id,
          last4Digits: paymentMethod.card?.last4,
          cardBrand: paymentMethod.card?.brand,
        },
      });
    }
  }
}

/**
 * Handle invoice upcoming
 */
async function handleInvoiceUpcoming(invoice: Stripe.Invoice): Promise<void> {
  logger.info(`Invoice upcoming: ${invoice.customer}`);

  const customerId = typeof invoice.customer === 'string' ? invoice.customer : invoice.customer?.id;
  if (!customerId) return;

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeCustomerId: customerId },
    include: { user: true },
  });

  if (!profile) return;

  // Send upcoming billing email
  await emailService.sendUpcomingBillingEmail(profile.user.email, {
    firstName: profile.user.firstName,
    amount: invoice.amount_due ? `$${(invoice.amount_due / 100).toFixed(2)}` : '$0.00',
    billingDate: new Date(invoice.next_payment_attempt || Date.now()).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }),
    paymentMethod: '•••• •••• •••• ' + (profile.last4Digits || '****'),
    manageSubscriptionUrl: `${env.FRONTEND_URL}/dashboard/subscription`,
  });
}

/**
 * Handle subscription paused
 */
async function handleSubscriptionPaused(subscription: Stripe.Subscription): Promise<void> {
  logger.info(`Subscription paused: ${subscription.id}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true },
  });

  if (!profile) return;

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: { subscriptionStatus: 'PAUSED' }, // Use PAUSED status enum
  });

  // Send paused email
  await emailService.sendSubscriptionPausedEmail(profile.user.email, {
    firstName: profile.user.firstName,
    resumeDate: subscription.pause_collection?.resumes_at
      ? new Date(subscription.pause_collection.resumes_at * 1000).toLocaleDateString()
      : 'Indefinite',
    manageSubscriptionUrl: `${env.FRONTEND_URL}/dashboard/subscription`,
  });
}

/**
 * Handle subscription resumed
 */
async function handleSubscriptionResumed(subscription: Stripe.Subscription): Promise<void> {
  logger.info(`Subscription resumed: ${subscription.id}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { stripeSubscriptionId: subscription.id },
    include: { user: true },
  });

  if (!profile) return;

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: { subscriptionStatus: 'ACTIVE' },
  });

  // Send resumed email
  await emailService.sendSubscriptionResumedEmail(profile.user.email, {
    firstName: profile.user.firstName,
    nextBillingDate: new Date(subscription.current_period_end * 1000).toLocaleDateString(),
    amount: `$${profile.monthlyFee || (profile.isSalon ? SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD : SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD)}`,
    manageSubscriptionUrl: `${env.FRONTEND_URL}/dashboard/subscription`,
  });
}

/**
 * Handle booking deposit payment succeeded (Stripe)
 */
async function handleBookingPaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  logger.info(`Booking payment succeeded: ${paymentIntent.id}`);

  const metadata = paymentIntent.metadata;
  const type = metadata?.type;

  if (type === 'booking_deposit') {
    const bookingId = metadata?.bookingId;
    if (!bookingId) return;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            stripeCustomerId: true,
            paymentMethodId: true,
          },
        },
        service: { select: { title: true, durationMinutes: true } },
        provider: {
          select: {
            businessName: true,
            city: true,
            state: true,
            instantBookingEnabled: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!booking) return;

    // Save client payment method if payment was successful
    if (paymentIntent.payment_method) {
      try {
        let stripeCustomerId = booking.client.stripeCustomerId;

        // Create or retrieve Stripe customer for client
        if (!stripeCustomerId) {
          const customer = await stripe.customers.create({
            email: booking.client.email,
            name: `${booking.client.firstName} ${booking.client.lastName}`,
            metadata: {
              userId: booking.client.id,
              type: 'client',
            },
          });
          stripeCustomerId = customer.id;
        }

        // Attach payment method to customer
        const paymentMethodId =
          typeof paymentIntent.payment_method === 'string'
            ? paymentIntent.payment_method
            : paymentIntent.payment_method.id;

        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: stripeCustomerId,
        });

        // Set as default payment method
        await stripe.customers.update(stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        // Get payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        // Update client with payment method info
        await prisma.user.update({
          where: { id: booking.client.id },
          data: {
            stripeCustomerId,
            paymentMethodId,
            last4Digits: paymentMethod.card?.last4 || null,
            cardBrand: paymentMethod.card?.brand || null,
            updatedAt: new Date(),
          },
        });

        logger.info(`Saved payment method for client ${booking.client.id}`);
      } catch (error) {
        // Log error but don't fail the booking update
        logger.error(`Error saving client payment method: ${error}`);
      }
    }

    // Update booking payment status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'DEPOSIT_PAID',
        paidAt: new Date(),
        paymentMethod: paymentIntent.payment_method_types[0] || 'card',
        // Auto-confirm if instant booking enabled
        bookingStatus: booking.provider.instantBookingEnabled ? 'CONFIRMED' : 'PENDING',
        updatedAt: new Date(),
      },
    });

    // Send confirmation email
    await emailService.sendBookingConfirmationEmail(booking.client.email, {
      clientName: `${booking.client.firstName} ${booking.client.lastName}`,
      serviceName: booking.service.title,
      providerName: booking.provider.businessName,
      appointmentDateTime: `${booking.appointmentDate.toLocaleDateString()} at ${booking.appointmentTime}`,
      duration: `${booking.service.durationMinutes || 60} minutes`,
      location: `${booking.provider.locations[0]?.addressLine1 || ''}, ${booking.provider.city}, ${booking.provider.state}`,
      totalAmount: `${booking.currency} ${booking.servicePrice.toString()}`,
      cancellationPolicy: "Please review the provider's cancellation policy",
      bookingDetailsUrl: `${env.FRONTEND_URL}/client/bookings/${booking.id}`,
    });

    logger.info(`Booking ${bookingId} payment confirmed and status updated`);
  } else if (type === 'balance_payment') {
    const bookingId = metadata?.bookingId;
    if (!bookingId) return;

    // Update booking to fully paid
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'FULLY_PAID',
        updatedAt: new Date(),
      },
    });

    logger.info(`Booking ${bookingId} balance paid`);
  }
}

/**
 * Handle booking payment failed (Stripe)
 */
async function handleBookingPaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
  logger.info(`Booking payment failed: ${paymentIntent.id}`);

  const metadata = paymentIntent.metadata;
  const bookingId = metadata?.bookingId;

  if (!bookingId) return;

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { client: { select: { email: true, firstName: true } } },
  });

  if (!booking) return;

  // Update booking status to cancelled due to payment failure
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      bookingStatus: 'CANCELLED_BY_CLIENT',
      paymentStatus: 'REFUNDED',
      cancelledAt: new Date(),
      cancellationReason: 'Payment failed',
      updatedAt: new Date(),
    },
  });

  // Send payment failed notification
  await emailService.sendPaymentFailedEmail(booking.client.email, {
    firstName: booking.client.firstName,
    amount: `${booking.currency} ${booking.totalAmount.toString()}`,
    retryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toLocaleDateString(),
    updatePaymentUrl: `${env.FRONTEND_URL}/client/bookings/${bookingId}/retry-payment`,
  });

  logger.info(`Booking ${bookingId} cancelled due to payment failure`);
}

/**
 * Handle Paystack webhooks
 */
export async function handlePaystackWebhook(req: Request, res: Response): Promise<void> {
  try {
    // Get raw body for signature verification
    const rawBody = req.body;

    if (!rawBody) {
      logger.error('No body received in Paystack webhook');
      res.status(400).send('No body');
      return;
    }

    const hash = crypto
      .createHmac('sha512', paymentConfig.paystack.secretKey || '')
      .update(rawBody)
      .digest('hex');

    const paystackSignature = req.headers['x-paystack-signature'] as string;

    // Verify webhook signature
    if (hash !== paystackSignature) {
      logger.error('Invalid Paystack webhook signature');
      res.status(400).send('Invalid signature');
      return;
    }

    // Parse the raw body to JSON
    const event = JSON.parse(rawBody.toString());
    switch (event.event) {
      case 'subscription.create':
        await handlePaystackSubscriptionCreated(event.data);
        break;

      case 'subscription.disable':
        await handlePaystackSubscriptionDisabled(event.data);
        break;

      case 'subscription.not_renew':
        await handlePaystackSubscriptionNotRenew(event.data);
        break;

      case 'charge.success':
        await handlePaystackChargeSuccess(event.data);
        break;

      case 'charge.failed':
        await handlePaystackChargeFailed(event.data);
        break;

      case 'invoice.create':
      case 'invoice.update':
        await handlePaystackInvoiceUpdate(event.data);
        break;

      case 'invoice.payment_failed':
        await handlePaystackInvoicePaymentFailed(event.data);
        break;

      case 'subscription.expiring_cards':
        await handlePaystackExpiringCards(event.data);
        break;

      default:
        logger.info(`Unhandled Paystack event: ${event.event}`);
    }

    res.status(200).send('OK');
  } catch (error) {
    logger.error('Error processing Paystack webhook:', error);
    res.status(500).send('Webhook processing failed');
  }
}

/**
 * Handle Paystack subscription created
 */
async function handlePaystackSubscriptionCreated(data: PaystackSubscriptionData): Promise<void> {
  logger.info(`Paystack subscription created: ${data.subscription_code}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { paystackSubscriptionCode: data.subscription_code },
  });

  if (!profile) return;

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: 'ACTIVE',
    },
  });
}

/**
 * Handle Paystack subscription disabled
 */
async function handlePaystackSubscriptionDisabled(data: PaystackSubscriptionData): Promise<void> {
  logger.info(`Paystack subscription disabled: ${data.subscription_code}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { paystackSubscriptionCode: data.subscription_code },
  });

  if (!profile) return;

  await prisma.providerProfile.update({
    where: { id: profile.id },
    data: {
      subscriptionStatus: 'CANCELLED',
    },
  });
}

/**
 * Handle Paystack subscription not renew
 */
async function handlePaystackSubscriptionNotRenew(data: PaystackSubscriptionData): Promise<void> {
  logger.info(`Paystack subscription will not renew: ${data.subscription_code}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { paystackSubscriptionCode: data.subscription_code },
  });

  if (!profile) return;

  // Paystack subscription created notification logged
}

/**
 * Handle Paystack charge success
 */
async function handlePaystackChargeSuccess(data: PaystackChargeData): Promise<void> {
  logger.info(`Paystack charge succeeded: ${data.reference}`);

  const metadata = data.metadata;
  const type = metadata?.type;

  // Handle booking payments
  if (type === 'booking_deposit' || type === 'balance_payment' || type === 'tip_payment') {
    await handlePaystackBookingChargeSuccess(data);
    return;
  }

  // If this is a subscription charge
  if (data.metadata?.providerId) {
    const profile = await prisma.providerProfile.findFirst({
      where: { id: data.metadata.providerId },
    });

    if (profile) {
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: 'ACTIVE',
        },
      });
    }
  }
}

/**
 * Handle Paystack charge failed
 */
async function handlePaystackChargeFailed(data: PaystackChargeData): Promise<void> {
  logger.info(`Paystack charge failed: ${data.reference}`);

  if (data.metadata?.providerId) {
    const profile = await prisma.providerProfile.findFirst({
      where: { id: data.metadata.providerId },
      include: { user: true },
    });

    if (profile) {
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: 'PAST_DUE',
        },
      });

      // Send payment failed notification
      // Get currency from charge data or profile region
      const currency = data.currency || profile.regionCode === 'GH' ? 'GHS' : 'NGN';
      const currencySymbol = currency === 'GHS' ? '₵' : '₦';
      const amount = data.amount ? `${currencySymbol}${(data.amount / 100).toFixed(2)}` : `${currencySymbol}0.00`;

      await emailService.sendPaymentFailedEmail(profile.user.email, {
        firstName: profile.user.firstName,
        amount,
        retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        updatePaymentUrl: `${env.FRONTEND_URL}/dashboard/subscription/payment-method`,
      });
    }
  }
}

/**
 * Handle Paystack booking charge success
 */
async function handlePaystackBookingChargeSuccess(data: PaystackChargeData): Promise<void> {
  logger.info(`Paystack booking charge succeeded: ${data.reference}`);

  const metadata = data.metadata;
  const type = metadata?.type;
  const bookingId = metadata?.bookingId;

  if (!bookingId) return;

  if (type === 'booking_deposit') {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            paystackCustomerCode: true,
            paymentMethodId: true,
          },
        },
        service: { select: { title: true, durationMinutes: true } },
        provider: {
          select: {
            businessName: true,
            city: true,
            state: true,
            instantBookingEnabled: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
          },
        },
      },
    });

    if (!booking) return;

    // Save client payment method if authorization code exists (Paystack)
    if (data.authorization?.authorization_code) {
      try {
        let paystackCustomerCode = booking.client.paystackCustomerCode;

        // Create or retrieve Paystack customer for client
        if (!paystackCustomerCode) {
          const customerResponse = await fetch('https://api.paystack.co/customer', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: booking.client.email,
              first_name: booking.client.firstName,
              last_name: booking.client.lastName,
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

        // Update client with payment method info
        await prisma.user.update({
          where: { id: booking.client.id },
          data: {
            paystackCustomerCode: paystackCustomerCode || null,
            paymentMethodId: data.authorization.authorization_code,
            last4Digits: data.authorization.last4 || null,
            cardBrand: data.authorization.brand || null,
            updatedAt: new Date(),
          },
        });

        logger.info(`Saved payment method for client ${booking.client.id}`);
      } catch (error) {
        // Log error but don't fail the booking update
        logger.error(`Error saving client payment method: ${error}`);
      }
    }

    // Update booking payment status
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'DEPOSIT_PAID',
        paidAt: new Date(),
        paymentMethod: data.channel || 'card',
        paymentChannel: data.channel,
        paystackTransactionId: data.id?.toString(),
        bookingStatus: booking.provider.instantBookingEnabled ? 'CONFIRMED' : 'PENDING',
        updatedAt: new Date(),
      },
    });

    // Send confirmation email
    await emailService.sendBookingConfirmationEmail(booking.client.email, {
      clientName: `${booking.client.firstName} ${booking.client.lastName}`,
      serviceName: booking.service.title,
      providerName: booking.provider.businessName,
      appointmentDateTime: `${booking.appointmentDate.toLocaleDateString()} at ${booking.appointmentTime}`,
      duration: `${booking.service.durationMinutes} minutes`,
      location: `${booking.provider.locations[0]?.addressLine1 || ''}, ${booking.provider.city}, ${booking.provider.state}`,
      totalAmount: `${booking.currency} ${booking.servicePrice.toString()}`,
      cancellationPolicy: "Please review the provider's cancellation policy",
      bookingDetailsUrl: `${env.FRONTEND_URL}/client/bookings/${booking.id}`,
    });

    logger.info(`Paystack booking ${bookingId} payment confirmed`);
  } else if (type === 'balance_payment') {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        paymentStatus: 'FULLY_PAID',
        updatedAt: new Date(),
      },
    });

    logger.info(`Paystack booking ${bookingId} balance paid`);
  } else if (type === 'tip_payment') {
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        tipAmount: Number(metadata.tipAmount),
        tipPaidAt: new Date(),
        tipPaymentMethod: 'online',
        tipPaymentIntentId: data.reference,
        updatedAt: new Date(),
      },
    });

    logger.info(`Paystack booking ${bookingId} tip paid`);
  }
}

/**
 * Handle Paystack invoice update (upcoming billing)
 */
async function handlePaystackInvoiceUpdate(data: any): Promise<void> {
  // Paystack sends invoice.create/update for upcoming payments
  logger.info(`Paystack invoice update: ${data.subscription_code}`);

  if (!data.subscription_code) return;

  const profile = await prisma.providerProfile.findFirst({
    where: { paystackSubscriptionCode: data.subscription_code },
    include: { user: true },
  });

  if (!profile) return;

  // Send upcoming billing email
  await emailService.sendUpcomingBillingEmail(profile.user.email, {
    firstName: profile.user.firstName,
    amount: data.amount ? `${data.currency} ${(data.amount / 100).toFixed(2)}` : 'N/A',
    billingDate: new Date(data.next_notification_date || Date.now()).toLocaleDateString(),
    paymentMethod: 'Paystack Card',
    manageSubscriptionUrl: `${env.FRONTEND_URL}/dashboard/subscription`,
  });
}

/**
 * Handle Paystack invoice payment failed
 */
async function handlePaystackInvoicePaymentFailed(data: any): Promise<void> {
  logger.info(`Paystack invoice payment failed: ${data.subscription_code}`);
  // Similar to charge.failed but specifically for invoices
  // We can reuse the logic or add specific handling
  if (data.subscription_code) {
    const profile = await prisma.providerProfile.findFirst({
      where: { paystackSubscriptionCode: data.subscription_code },
      include: { user: true },
    });

    if (profile) {
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: { subscriptionStatus: 'PAST_DUE' },
      });
    }
  }
}

/**
 * Handle Paystack expiring cards
 */
async function handlePaystackExpiringCards(data: any): Promise<void> {
  logger.info(`Paystack expiring card: ${data.customer_email}`);

  const profile = await prisma.providerProfile.findFirst({
    where: { user: { email: data.customer_email } },
    include: { user: true },
  });

  if (!profile) return;

  await emailService.sendExpiringCardEmail(profile.user.email, {
    firstName: profile.user.firstName,
    cardBrand: data.brand || 'Card',
    last4: data.last4 || '****',
    expiryDate: data.exp_month && data.exp_year ? `${data.exp_month}/${data.exp_year}` : 'Soon',
    updatePaymentUrl: `${env.FRONTEND_URL}/dashboard/subscription/payment-method`,
  });
}
