import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';
import { stripe } from '../lib/stripe';
import { paymentConfig } from '../config/payment.config';
import logger from '../utils/logger';

/**
 * Pause subscription
 */
export async function pauseSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    if (!profile.stripeSubscriptionId && !profile.paystackSubscriptionCode) {
      throw new AppError(400, 'No active subscription found');
    }

    // Handle Stripe subscription pause
    if (profile.paymentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.update(profile.stripeSubscriptionId, {
        pause_collection: {
          behavior: 'mark_uncollectible', // Don't charge during pause
        },
      });

      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: 'ACTIVE', // Status remains active but paused
          updatedAt: new Date(),
        },
      });

      sendSuccess(res, {
        message: 'Subscription paused successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          pausedAt: new Date(),
        },
      });
    } else if (profile.paymentProvider === 'PAYSTACK' && profile.paystackSubscriptionCode) {
      // Paystack doesn't have native pause - we disable and track manually
      if (!profile.paystackEmailToken) {
        throw new AppError(400, 'Email token not found. Cannot pause Paystack subscription.');
      }

      const response = await fetch(
        `https://api.paystack.co/subscription/disable`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: profile.paystackSubscriptionCode,
            token: profile.paystackEmailToken, // Use stored email token
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message: string };
        throw new AppError(400, errorData.message || 'Failed to pause subscription');
      }

      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: 'CANCELLED', // Paystack treats disable as cancel
          updatedAt: new Date(),
        },
      });

      sendSuccess(res, {
        message: 'Subscription paused successfully (Paystack)',
        note: 'You will need to reactivate manually',
      });
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Resume subscription
 */
export async function resumeSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    if (!profile.stripeSubscriptionId && !profile.paystackSubscriptionCode) {
      throw new AppError(400, 'No subscription found');
    }

    // Handle Stripe subscription resume
    if (profile.paymentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.update(profile.stripeSubscriptionId, {
        pause_collection: null, // Remove pause
      });

      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: 'ACTIVE',
          updatedAt: new Date(),
        },
      });

      sendSuccess(res, {
        message: 'Subscription resumed successfully',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          resumedAt: new Date(),
          nextBillingDate: new Date(subscription.current_period_end * 1000),
        },
      });
    } else if (profile.paymentProvider === 'PAYSTACK') {
      // Paystack requires creating a new subscription
      throw new AppError(
        400,
        'Paystack subscriptions cannot be resumed. Please create a new subscription.'
      );
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Get subscription details
 */
export async function getSubscriptionDetails(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    let subscriptionDetails: any = {
      status: profile.subscriptionStatus,
      tier: profile.isSalon ? 'salon' : 'solo',
      monthlyFee: profile.monthlyFee,
      currency: profile.regionCode === 'NA' || profile.regionCode === 'EU' ? 'USD' : 
                profile.regionCode === 'GH' ? 'GHS' : 'NGN',
      trialEndDate: profile.trialEndDate,
      paymentProvider: profile.paymentProvider,
    };

    // Get detailed info from Stripe
    if (profile.paymentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
        
        subscriptionDetails = {
          ...subscriptionDetails,
          id: subscription.id,
          currentPeriodStart: new Date(subscription.current_period_start * 1000),
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
          isPaused: !!subscription.pause_collection,
          pauseResumesAt: subscription.pause_collection?.resumes_at 
            ? new Date(subscription.pause_collection.resumes_at * 1000) 
            : null,
        };
      } catch (error) {
        logger.error('Error fetching Stripe subscription:', error);
      }
    }

    // Get detailed info from Paystack
    if (profile.paymentProvider === 'PAYSTACK' && profile.paystackSubscriptionCode) {
      try {
        const response = await fetch(
          `https://api.paystack.co/subscription/${profile.paystackSubscriptionCode}`,
          {
            headers: {
              Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
            },
          }
        );

        if (response.ok) {
          const data = (await response.json()) as { data: any };
          subscriptionDetails = {
            ...subscriptionDetails,
            id: data.data.subscription_code,
            nextPaymentDate: data.data.next_payment_date,
            emailToken: data.data.email_token,
          };
        }
      } catch (error) {
        logger.error('Error fetching Paystack subscription:', error);
      }
    }

    sendSuccess(res, { subscription: subscriptionDetails });
  } catch (error) {
    next(error);
  }
}

/**
 * Cancel subscription
 */
export async function cancelSubscription(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      throw new AppError(401, 'Unauthorized');
    }

    const { cancelAtPeriodEnd = true } = req.body;

    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    if (!profile.stripeSubscriptionId && !profile.paystackSubscriptionCode) {
      throw new AppError(400, 'No active subscription found');
    }

    // Handle Stripe subscription cancellation
    if (profile.paymentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
      const subscription = await stripe.subscriptions.update(profile.stripeSubscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      });

      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: cancelAtPeriodEnd ? 'ACTIVE' : 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      sendSuccess(res, {
        message: cancelAtPeriodEnd 
          ? 'Subscription will be cancelled at period end' 
          : 'Subscription cancelled immediately',
        subscription: {
          id: subscription.id,
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000),
        },
      });
    } else if (profile.paymentProvider === 'PAYSTACK' && profile.paystackSubscriptionCode) {
      // Paystack cancellation
      if (!profile.paystackEmailToken) {
        throw new AppError(400, 'Email token not found. Cannot cancel Paystack subscription.');
      }

      const response = await fetch(
        `https://api.paystack.co/subscription/disable`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            code: profile.paystackSubscriptionCode,
            token: profile.paystackEmailToken, // Use stored email token
          }),
        }
      );

      if (!response.ok) {
        const errorData = (await response.json()) as { message: string };
        throw new AppError(400, errorData.message || 'Failed to cancel subscription');
      }

      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          subscriptionStatus: 'CANCELLED',
          updatedAt: new Date(),
        },
      });

      sendSuccess(res, {
        message: 'Subscription cancelled successfully',
      });
    }
  } catch (error) {
    next(error);
  }
}
