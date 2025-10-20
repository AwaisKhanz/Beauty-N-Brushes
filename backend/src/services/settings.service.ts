import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import bcrypt from 'bcrypt';
import Stripe from 'stripe';
import type {
  UpdateProfileSettingsRequest,
  UpdateBookingSettingsRequest,
  UpdatePoliciesRequest,
  UpdateNotificationSettingsRequest,
  UpdateAccountRequest,
  UpdateBrandingRequest,
  UpdateLocationRequest,
  UpdateBusinessDetailsSettingsRequest,
  ChangeTierRequest,
  CancelSubscriptionRequest,
} from '../../../shared-types';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

class SettingsService {
  /**
   * Get provider profile settings
   */
  async getProfileSettings(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        businessName: true,
        tagline: true,
        description: true,
        yearsExperience: true,
        websiteUrl: true,
        instagramHandle: true,
        tiktokHandle: true,
        facebookUrl: true,
        instantBookingEnabled: true,
        acceptsNewClients: true,
        mobileServiceAvailable: true,
        advanceBookingDays: true,
        minAdvanceHours: true,
        bookingBufferMinutes: true,
        sameDayBookingEnabled: true,
        parkingAvailable: true,
        wheelchairAccessible: true,
        regionCode: true,
        currency: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    return profile;
  }

  /**
   * Update provider profile settings
   */
  async updateProfileSettings(userId: string, data: UpdateProfileSettingsRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const updated = await prisma.providerProfile.update({
      where: { userId },
      data: {
        ...(data.businessName !== undefined && { businessName: data.businessName }),
        ...(data.tagline !== undefined && { tagline: data.tagline }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.yearsExperience !== undefined && { yearsExperience: data.yearsExperience }),
        ...(data.websiteUrl !== undefined && { websiteUrl: data.websiteUrl }),
        ...(data.instagramHandle !== undefined && { instagramHandle: data.instagramHandle }),
        ...(data.tiktokHandle !== undefined && { tiktokHandle: data.tiktokHandle }),
        ...(data.facebookUrl !== undefined && { facebookUrl: data.facebookUrl }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        businessName: true,
        tagline: true,
        description: true,
        yearsExperience: true,
        websiteUrl: true,
        instagramHandle: true,
        tiktokHandle: true,
        facebookUrl: true,
        instantBookingEnabled: true,
        acceptsNewClients: true,
        mobileServiceAvailable: true,
        advanceBookingDays: true,
        minAdvanceHours: true,
        bookingBufferMinutes: true,
        sameDayBookingEnabled: true,
        parkingAvailable: true,
        wheelchairAccessible: true,
        regionCode: true,
        currency: true,
      },
    });

    return updated;
  }

  /**
   * Get booking settings
   */
  async getBookingSettings(userId: string) {
    return this.getProfileSettings(userId);
  }

  /**
   * Update booking settings
   */
  async updateBookingSettings(userId: string, data: UpdateBookingSettingsRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const updated = await prisma.providerProfile.update({
      where: { userId },
      data: {
        ...(data.instantBookingEnabled !== undefined && {
          instantBookingEnabled: data.instantBookingEnabled,
        }),
        ...(data.acceptsNewClients !== undefined && {
          acceptsNewClients: data.acceptsNewClients,
        }),
        ...(data.mobileServiceAvailable !== undefined && {
          mobileServiceAvailable: data.mobileServiceAvailable,
        }),
        ...(data.advanceBookingDays !== undefined && {
          advanceBookingDays: data.advanceBookingDays,
        }),
        ...(data.minAdvanceHours !== undefined && { minAdvanceHours: data.minAdvanceHours }),
        ...(data.bookingBufferMinutes !== undefined && {
          bookingBufferMinutes: data.bookingBufferMinutes,
        }),
        ...(data.sameDayBookingEnabled !== undefined && {
          sameDayBookingEnabled: data.sameDayBookingEnabled,
        }),
        ...(data.parkingAvailable !== undefined && { parkingAvailable: data.parkingAvailable }),
        ...(data.wheelchairAccessible !== undefined && {
          wheelchairAccessible: data.wheelchairAccessible,
        }),
        updatedAt: new Date(),
      },
      select: {
        id: true,
        businessName: true,
        tagline: true,
        description: true,
        yearsExperience: true,
        websiteUrl: true,
        instagramHandle: true,
        tiktokHandle: true,
        facebookUrl: true,
        instantBookingEnabled: true,
        acceptsNewClients: true,
        mobileServiceAvailable: true,
        advanceBookingDays: true,
        minAdvanceHours: true,
        bookingBufferMinutes: true,
        sameDayBookingEnabled: true,
        parkingAvailable: true,
        wheelchairAccessible: true,
        regionCode: true,
        currency: true,
      },
    });

    return updated;
  }

  /**
   * Get provider policies
   */
  async getPolicies(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    let policies = await prisma.providerPolicy.findUnique({
      where: { providerId: profile.id },
    });

    // Create default policies if they don't exist
    if (!policies) {
      policies = await prisma.providerPolicy.create({
        data: {
          providerId: profile.id,
          cancellationWindowHours: 24,
          cancellationFeePercentage: 50,
          lateGracePeriodMinutes: 15,
          lateCancellationAfterMinutes: 15,
          noShowFeePercentage: 100,
          rescheduleAllowed: true,
          rescheduleWindowHours: 24,
          maxReschedules: 2,
          consultationRequired: false,
          requiresClientProducts: false,
        },
      });
    }

    return policies;
  }

  /**
   * Update provider policies
   */
  async updatePolicies(userId: string, data: UpdatePoliciesRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const updated = await prisma.providerPolicy.upsert({
      where: { providerId: profile.id },
      create: {
        providerId: profile.id,
        cancellationWindowHours: data.cancellationWindowHours ?? 24,
        cancellationFeePercentage: data.cancellationFeePercentage ?? 50,
        cancellationPolicyText: data.cancellationPolicyText,
        lateGracePeriodMinutes: data.lateGracePeriodMinutes ?? 15,
        lateCancellationAfterMinutes: data.lateCancellationAfterMinutes ?? 15,
        latePolicyText: data.latePolicyText,
        noShowFeePercentage: data.noShowFeePercentage ?? 100,
        noShowPolicyText: data.noShowPolicyText,
        rescheduleAllowed: data.rescheduleAllowed ?? true,
        rescheduleWindowHours: data.rescheduleWindowHours ?? 24,
        maxReschedules: data.maxReschedules ?? 2,
        reschedulePolicyText: data.reschedulePolicyText,
        refundPolicyText: data.refundPolicyText,
        consultationRequired: data.consultationRequired ?? false,
        requiresClientProducts: data.requiresClientProducts ?? false,
        touchUpPolicyText: data.touchUpPolicyText,
      },
      update: {
        ...(data.cancellationWindowHours !== undefined && {
          cancellationWindowHours: data.cancellationWindowHours,
        }),
        ...(data.cancellationFeePercentage !== undefined && {
          cancellationFeePercentage: data.cancellationFeePercentage,
        }),
        ...(data.cancellationPolicyText !== undefined && {
          cancellationPolicyText: data.cancellationPolicyText,
        }),
        ...(data.lateGracePeriodMinutes !== undefined && {
          lateGracePeriodMinutes: data.lateGracePeriodMinutes,
        }),
        ...(data.lateCancellationAfterMinutes !== undefined && {
          lateCancellationAfterMinutes: data.lateCancellationAfterMinutes,
        }),
        ...(data.latePolicyText !== undefined && { latePolicyText: data.latePolicyText }),
        ...(data.noShowFeePercentage !== undefined && {
          noShowFeePercentage: data.noShowFeePercentage,
        }),
        ...(data.noShowPolicyText !== undefined && { noShowPolicyText: data.noShowPolicyText }),
        ...(data.rescheduleAllowed !== undefined && { rescheduleAllowed: data.rescheduleAllowed }),
        ...(data.rescheduleWindowHours !== undefined && {
          rescheduleWindowHours: data.rescheduleWindowHours,
        }),
        ...(data.maxReschedules !== undefined && { maxReschedules: data.maxReschedules }),
        ...(data.reschedulePolicyText !== undefined && {
          reschedulePolicyText: data.reschedulePolicyText,
        }),
        ...(data.refundPolicyText !== undefined && { refundPolicyText: data.refundPolicyText }),
        ...(data.consultationRequired !== undefined && {
          consultationRequired: data.consultationRequired,
        }),
        ...(data.requiresClientProducts !== undefined && {
          requiresClientProducts: data.requiresClientProducts,
        }),
        ...(data.touchUpPolicyText !== undefined && { touchUpPolicyText: data.touchUpPolicyText }),
        updatedAt: new Date(),
      },
    });

    return updated;
  }

  /**
   * Get subscription info
   */
  async getSubscriptionInfo(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        subscriptionTier: true,
        subscriptionStatus: true,
        trialEndDate: true,
        nextBillingDate: true,
        monthlyFee: true,
        currency: true,
        paymentProvider: true,
        last4Digits: true,
        cardBrand: true,
        stripeCustomerId: true,
        paystackCustomerCode: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Fetch billing history
    const billingHistory = [];

    // For Stripe regions, fetch invoices
    if (profile.paymentProvider === 'STRIPE' && profile.stripeCustomerId) {
      try {
        const invoices = await stripe.invoices.list({
          customer: profile.stripeCustomerId,
          limit: 12,
        });

        for (const invoice of invoices.data) {
          billingHistory.push({
            id: invoice.id,
            date: new Date(invoice.created * 1000).toISOString(),
            amount: invoice.amount_paid / 100,
            currency: invoice.currency.toUpperCase(),
            status: invoice.status || 'unknown',
            invoiceUrl: invoice.invoice_pdf || undefined,
          });
        }
      } catch (error) {
        console.error('Error fetching Stripe invoices:', error);
      }
    }

    // For Paystack regions, would fetch transaction history from Paystack API
    // TODO: Implement Paystack transaction history when available

    return {
      subscriptionTier: profile.subscriptionTier?.toLowerCase() as 'solo' | 'salon',
      subscriptionStatus: profile.subscriptionStatus?.toLowerCase() as
        | 'trial'
        | 'active'
        | 'past_due'
        | 'cancelled'
        | 'expired',
      trialEndDate: profile.trialEndDate?.toISOString() || null,
      nextBillingDate: profile.nextBillingDate?.toISOString() || null,
      monthlyFee: Number(profile.monthlyFee || 0),
      currency: profile.currency || 'USD',
      paymentProvider: profile.paymentProvider?.toLowerCase() as 'stripe' | 'paystack',
      last4Digits: profile.last4Digits || null,
      cardBrand: profile.cardBrand || null,
      billingHistory,
    };
  }

  /**
   * Update payment method
   */
  async updatePaymentMethod(
    userId: string,
    paymentMethodId: string,
    region: 'NA' | 'EU' | 'GH' | 'NG'
  ) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        paymentProvider: true,
        stripeCustomerId: true,
        paystackCustomerCode: true,
        regionCode: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Verify region matches
    if (profile.regionCode !== region) {
      throw new AppError(400, 'Region mismatch');
    }

    if (profile.paymentProvider === 'STRIPE') {
      // Stripe payment method update
      if (!profile.stripeCustomerId) {
        throw new AppError(400, 'No Stripe customer ID found');
      }

      try {
        // Attach payment method to customer
        await stripe.paymentMethods.attach(paymentMethodId, {
          customer: profile.stripeCustomerId,
        });

        // Set as default payment method
        await stripe.customers.update(profile.stripeCustomerId, {
          invoice_settings: {
            default_payment_method: paymentMethodId,
          },
        });

        // Get payment method details
        const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);

        // Update database
        await prisma.providerProfile.update({
          where: { userId },
          data: {
            paymentMethodId: paymentMethodId,
            last4Digits: paymentMethod.card?.last4 || null,
            cardBrand: paymentMethod.card?.brand || null,
            updatedAt: new Date(),
          },
        });
      } catch (error) {
        console.error('Error updating Stripe payment method:', error);
        throw new AppError(500, 'Failed to update payment method');
      }
    } else if (profile.paymentProvider === 'PAYSTACK') {
      // Paystack payment method update
      // The paymentMethodId here would be the authorization code from Paystack
      await prisma.providerProfile.update({
        where: { userId },
        data: {
          paymentMethodId: paymentMethodId,
          updatedAt: new Date(),
        },
      });
    }

    return { success: true };
  }

  /**
   * Get notification settings
   */
  async getNotificationSettings(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    return user;
  }

  /**
   * Update notification settings
   */
  async updateNotificationSettings(userId: string, data: UpdateNotificationSettingsRequest) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.emailNotifications !== undefined && {
          emailNotifications: data.emailNotifications,
        }),
        ...(data.smsNotifications !== undefined && { smsNotifications: data.smsNotifications }),
        updatedAt: new Date(),
      },
      select: {
        emailNotifications: true,
        smsNotifications: true,
      },
    });

    return updated;
  }

  /**
   * Update account settings
   */
  async updateAccount(userId: string, data: UpdateAccountRequest) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new AppError(404, 'User not found');
    }

    // If updating password, verify current password
    if (data.newPassword) {
      if (!data.currentPassword) {
        throw new AppError(400, 'Current password required');
      }

      if (!user.passwordHash) {
        throw new AppError(400, 'Account uses OAuth authentication');
      }

      const isPasswordValid = await bcrypt.compare(data.currentPassword, user.passwordHash);
      if (!isPasswordValid) {
        throw new AppError(401, 'Current password is incorrect');
      }

      const hashedPassword = await bcrypt.hash(data.newPassword, 10);

      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash: hashedPassword,
          updatedAt: new Date(),
        },
      });
    }

    // Update email
    if (data.email && data.email !== user.email) {
      // Check if email is already in use
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AppError(400, 'Email already in use');
      }

      await prisma.user.update({
        where: { id: userId },
        data: {
          email: data.email,
          emailVerified: false, // Require re-verification
          updatedAt: new Date(),
        },
      });
    }

    // Update phone
    if (data.phone) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          phone: data.phone,
          phoneVerified: false, // Require re-verification
          updatedAt: new Date(),
        },
      });
    }

    return { success: true };
  }

  /**
   * Deactivate account (soft delete)
   */
  async deactivateAccount(userId: string) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        status: 'SUSPENDED',
        updatedAt: new Date(),
      },
    });

    return { success: true };
  }

  /**
   * Get branding settings
   */
  async getBrandingSettings(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        logoUrl: true,
        brandColorPrimary: true,
        brandColorSecondary: true,
        brandColorAccent: true,
        brandFontHeading: true,
        brandFontBody: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    return profile;
  }

  /**
   * Update branding settings
   */
  async updateBrandingSettings(userId: string, data: UpdateBrandingRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const updated = await prisma.providerProfile.update({
      where: { userId },
      data: {
        ...(data.logoUrl !== undefined && { logoUrl: data.logoUrl }),
        ...(data.brandColorPrimary !== undefined && { brandColorPrimary: data.brandColorPrimary }),
        ...(data.brandColorSecondary !== undefined && {
          brandColorSecondary: data.brandColorSecondary,
        }),
        ...(data.brandColorAccent !== undefined && { brandColorAccent: data.brandColorAccent }),
        ...(data.brandFontHeading !== undefined && { brandFontHeading: data.brandFontHeading }),
        ...(data.brandFontBody !== undefined && { brandFontBody: data.brandFontBody }),
        updatedAt: new Date(),
      },
      select: {
        logoUrl: true,
        brandColorPrimary: true,
        brandColorSecondary: true,
        brandColorAccent: true,
        brandFontHeading: true,
        brandFontBody: true,
      },
    });

    return updated;
  }

  /**
   * Get location settings
   */
  async getLocationSettings(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        businessPhone: true,
        latitude: true,
        longitude: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    return profile;
  }

  /**
   * Update location settings
   */
  async updateLocationSettings(userId: string, data: UpdateLocationRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const updated = await prisma.providerProfile.update({
      where: { userId },
      data: {
        ...(data.addressLine1 !== undefined && { addressLine1: data.addressLine1 }),
        ...(data.addressLine2 !== undefined && { addressLine2: data.addressLine2 }),
        ...(data.city !== undefined && { city: data.city }),
        ...(data.state !== undefined && { state: data.state }),
        ...(data.zipCode !== undefined && { zipCode: data.zipCode }),
        ...(data.country !== undefined && { country: data.country }),
        ...(data.businessPhone !== undefined && { businessPhone: data.businessPhone }),
        ...(data.latitude !== undefined && { latitude: data.latitude }),
        ...(data.longitude !== undefined && { longitude: data.longitude }),
        updatedAt: new Date(),
      },
      select: {
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        businessPhone: true,
        latitude: true,
        longitude: true,
      },
    });

    return updated;
  }

  /**
   * Get business details
   */
  async getBusinessDetails(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        businessPhone: true,
        businessType: true,
        licenseNumber: true,
        licenseVerified: true,
        insuranceVerified: true,
        timezone: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    return profile;
  }

  /**
   * Update business details
   */
  async updateBusinessDetails(userId: string, data: UpdateBusinessDetailsSettingsRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    const updated = await prisma.providerProfile.update({
      where: { userId },
      data: {
        ...(data.businessPhone !== undefined && { businessPhone: data.businessPhone }),
        ...(data.businessType !== undefined && { businessType: data.businessType }),
        ...(data.licenseNumber !== undefined && { licenseNumber: data.licenseNumber }),
        ...(data.timezone !== undefined && { timezone: data.timezone }),
        updatedAt: new Date(),
      },
      select: {
        businessPhone: true,
        businessType: true,
        licenseNumber: true,
        licenseVerified: true,
        insuranceVerified: true,
        timezone: true,
      },
    });

    return updated;
  }

  /**
   * Get Google Calendar connection status
   */
  async getGoogleCalendarStatus(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        googleCalendarConnected: true,
        googleEmail: true,
        googleCalendarLastSync: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    return {
      connected: profile.googleCalendarConnected || false,
      email: profile.googleEmail || null,
      lastSyncAt: profile.googleCalendarLastSync?.toISOString() || null,
    };
  }

  /**
   * Change subscription tier
   */
  async changeSubscriptionTier(userId: string, data: ChangeTierRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        subscriptionTier: true,
        paymentProvider: true,
        regionCode: true,
        stripeSubscriptionId: true,
        paystackSubscriptionCode: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    if (profile.subscriptionTier === data.newTier.toUpperCase()) {
      throw new AppError(400, 'Already subscribed to this tier');
    }

    // Calculate new monthly fee
    const newMonthlyFee = data.newTier === 'solo' ? 19.0 : 49.0;

    // Update subscription in payment provider
    if (profile.paymentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
      const newPriceId =
        data.newTier === 'solo'
          ? process.env.STRIPE_SOLO_PRICE_ID
          : process.env.STRIPE_SALON_PRICE_ID;

      if (!newPriceId) {
        throw new AppError(500, 'Stripe price ID not configured');
      }

      try {
        const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);

        await stripe.subscriptions.update(profile.stripeSubscriptionId, {
          items: [
            {
              id: subscription.items.data[0].id,
              price: newPriceId,
            },
          ],
          proration_behavior: 'create_prorations',
        });
      } catch (error) {
        console.error('Error updating Stripe subscription:', error);
        throw new AppError(500, 'Failed to update subscription');
      }
    }
    // TODO: Implement Paystack subscription tier change

    // Update database
    await prisma.providerProfile.update({
      where: { userId },
      data: {
        subscriptionTier: data.newTier.toUpperCase() as 'SOLO' | 'SALON',
        monthlyFee: newMonthlyFee,
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Subscription tier changed successfully',
      newTier: data.newTier,
      newMonthlyFee,
      effectiveDate: new Date().toISOString(),
    };
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(userId: string, data: CancelSubscriptionRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      select: {
        id: true,
        paymentProvider: true,
        stripeSubscriptionId: true,
        paystackSubscriptionCode: true,
        nextBillingDate: true,
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Cancel subscription in payment provider
    if (profile.paymentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(profile.stripeSubscriptionId, {
          cancel_at_period_end: true,
          cancellation_details: {
            comment: data.reason || 'User requested cancellation',
          },
        });
      } catch (error) {
        console.error('Error cancelling Stripe subscription:', error);
        throw new AppError(500, 'Failed to cancel subscription');
      }
    }
    // TODO: Implement Paystack subscription cancellation

    // Update database
    await prisma.providerProfile.update({
      where: { userId },
      data: {
        subscriptionStatus: 'CANCELLED',
        updatedAt: new Date(),
      },
    });

    return {
      message: 'Subscription cancelled successfully',
      cancelledAt: new Date().toISOString(),
      accessUntil: profile.nextBillingDate?.toISOString() || new Date().toISOString(),
    };
  }
}

export const settingsService = new SettingsService();
