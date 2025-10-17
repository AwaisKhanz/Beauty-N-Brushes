import { Request, Response } from 'express';
import Stripe from 'stripe';
import { prisma } from '../config/database';
import logger from '../utils/logger';
import crypto from 'crypto';
import { emailService } from '../lib/email';
import type { PaystackSubscriptionData, PaystackChargeData } from '../../../shared-types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

/**
 * Handle Stripe webhooks
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!webhookSecret) {
    logger.error('Stripe webhook secret not configured');
    res.status(500).send('Webhook secret not configured');
    return;
  }

  let event: Stripe.Event;

  try {
    // Verify webhook signature
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    await emailService.sendSubscriptionCancelledEmail(profile.user.email, {
      firstName: profile.user.firstName,
      accessEndDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      reactivateUrl: `${appUrl}/dashboard/subscription`,
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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
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
      monthlyFee: `$${profile.monthlyFee || (profile.isSalon ? 49 : 19)}`,
      paymentMethod: '•••• •••• •••• ' + (profile.stripeCustomerId ? '****' : '****'),
      manageSubscriptionUrl: `${appUrl}/dashboard/subscription`,
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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const planName = profile.isSalon ? 'Salon Plan' : 'Solo Professional Plan';
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
      dashboardUrl: `${appUrl}/dashboard`,
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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const amount = `$${profile.monthlyFee || (profile.isSalon ? 49 : 19)}`;

    await emailService.sendPaymentFailedEmail(profile.user.email, {
      firstName: profile.user.firstName,
      amount,
      retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      updatePaymentUrl: `${appUrl}/dashboard/subscription/payment-method`,
    });
  }
}

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
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY || '')
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
      const appUrl = process.env.APP_URL || 'http://localhost:3000';
      const amount = data.amount ? `₦${(data.amount / 100).toFixed(2)}` : '₦0.00';

      await emailService.sendPaymentFailedEmail(profile.user.email, {
        firstName: profile.user.firstName,
        amount,
        retryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        }),
        updatePaymentUrl: `${appUrl}/dashboard/subscription/payment-method`,
      });
    }
  }
}
