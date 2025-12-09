import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { geocodingService } from '../lib/geocoding';
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
import { SUBSCRIPTION_TIERS } from '../../../shared-constants';
import { paymentConfig } from '../config/payment.config';

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
        coverPhotoUrl: true,
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
        // Business Details
        businessType: true,
        timezone: true,
        // Business Address
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        businessPhone: true,
        businessEmail: true,
        // Google Places
        placeId: true,
        formattedAddress: true,
        addressComponents: true,
        latitude: true,
        longitude: true,
        user: {
          select: {
            avatarUrl: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Map user avatarUrl to profilePhotoUrl
    return {
      ...profile,
      profilePhotoUrl: profile.user.avatarUrl,
      user: undefined,
    } as Omit<typeof profile, 'user'> & { profilePhotoUrl: string | null };
  }

  /**
   * Update provider profile settings
   */
  async updateProfileSettings(userId: string, data: UpdateProfileSettingsRequest) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: {
          select: {
            id: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Update profile cover photo if provided
    const profileUpdateData: {
      businessName?: string;
      tagline?: string | null;
      description?: string | null;
      yearsExperience?: number | null;
      websiteUrl?: string | null;
      instagramHandle?: string | null;
      tiktokHandle?: string | null;
      facebookUrl?: string | null;
      coverPhotoUrl?: string | null;
      // Business Details
      // Business Details
      businessType?: string | null;
      timezone?: string | null;
      // Business Address
      addressLine1?: string;
      addressLine2?: string | null;
      city?: string;
      state?: string;
      zipCode?: string | null;
      country?: string;
      businessPhone?: string | null;
      businessEmail?: string | null;
      // Google Places
      placeId?: string | null;
      formattedAddress?: string | null;
      addressComponents?: any;
      latitude?: number | null;
      longitude?: number | null;
      updatedAt: Date;
    } = {
      updatedAt: new Date(),
    };

    if (data.businessName !== undefined) profileUpdateData.businessName = data.businessName;
    if (data.tagline !== undefined) profileUpdateData.tagline = data.tagline;
    if (data.description !== undefined) profileUpdateData.description = data.description;
    if (data.yearsExperience !== undefined) profileUpdateData.yearsExperience = data.yearsExperience;
    if (data.websiteUrl !== undefined) profileUpdateData.websiteUrl = data.websiteUrl;
    if (data.instagramHandle !== undefined) profileUpdateData.instagramHandle = data.instagramHandle;
    if (data.tiktokHandle !== undefined) profileUpdateData.tiktokHandle = data.tiktokHandle;
    if (data.facebookUrl !== undefined) profileUpdateData.facebookUrl = data.facebookUrl;
    if (data.coverPhotoUrl !== undefined) profileUpdateData.coverPhotoUrl = data.coverPhotoUrl;
    // Business Details
    if (data.businessType !== undefined) profileUpdateData.businessType = data.businessType;
    if (data.timezone !== undefined) profileUpdateData.timezone = data.timezone;
    // Business Address
    if (data.addressLine1 !== undefined) profileUpdateData.addressLine1 = data.addressLine1;
    if (data.addressLine2 !== undefined) profileUpdateData.addressLine2 = data.addressLine2;
    if (data.city !== undefined) profileUpdateData.city = data.city;
    if (data.state !== undefined) profileUpdateData.state = data.state;
    if (data.zipCode !== undefined) profileUpdateData.zipCode = data.zipCode;
    if (data.country !== undefined) profileUpdateData.country = data.country;
    if (data.businessPhone !== undefined) profileUpdateData.businessPhone = data.businessPhone;
    if (data.businessEmail !== undefined) profileUpdateData.businessEmail = data.businessEmail;
    // Google Places
    if (data.placeId !== undefined) profileUpdateData.placeId = data.placeId;
    if (data.formattedAddress !== undefined) profileUpdateData.formattedAddress = data.formattedAddress;
    if (data.addressComponents !== undefined) profileUpdateData.addressComponents = data.addressComponents;
    if (data.latitude !== undefined) profileUpdateData.latitude = data.latitude;
    if (data.longitude !== undefined) profileUpdateData.longitude = data.longitude;

    // Update user avatar if profile photo provided
    if (data.profilePhotoUrl !== undefined) {
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: data.profilePhotoUrl },
      });
    }

    // Update profile
    const updatedProfile = await prisma.providerProfile.update({
      where: { userId },
      data: profileUpdateData,
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
        coverPhotoUrl: true,
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
        // Business Details
        businessType: true,
        timezone: true,
        // Business Address
        addressLine1: true,
        addressLine2: true,
        city: true,
        state: true,
        zipCode: true,
        country: true,
        businessPhone: true,
        businessEmail: true,
        // Google Places
        placeId: true,
        formattedAddress: true,
        addressComponents: true,
        latitude: true,
        longitude: true,
      },
    });

    // Get updated user avatar for response
    const updatedUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    return {
      ...updatedProfile,
      profilePhotoUrl: updatedUser?.avatarUrl || null,
    };
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
          coverPhotoUrl: true,
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
  async getSubscriptionInfo(
    userId: string,
    regionInfo: { regionCode: string; currency: string; paymentProvider: string }
  ) {
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
        stripeSubscriptionId: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    // Fetch billing history
    const billingHistory = [];

    let cancelAtPeriodEnd = false;
    let stripeNextBillingDate: Date | null = null;

    // Determine current payment provider from region info
    const currentProvider = (regionInfo.paymentProvider || profile.paymentProvider?.toLowerCase() || 'stripe').toUpperCase();

    // For Stripe regions, fetch invoices and subscription status
    if (currentProvider === 'STRIPE' && profile.stripeCustomerId) {
      // Check subscription status for cancel_at_period_end
      if (profile.stripeSubscriptionId) {
        try {
          const subscription = await stripe.subscriptions.retrieve(profile.stripeSubscriptionId);
          cancelAtPeriodEnd = subscription.cancel_at_period_end;
          stripeNextBillingDate = new Date(subscription.current_period_end * 1000);
        } catch (error) {
          console.error('Error fetching Stripe subscription:', error);
        }
      }

      // Skip invoice fetching for trial placeholder customers
      // Skip invoice fetching for trial placeholder customers
      const isTrialPlaceholder = profile.stripeCustomerId.startsWith('trial_customer_');
      
      if (!isTrialPlaceholder) {
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
    }

    console.log('profile:', profile);

    // For Paystack regions, fetch transaction history from Paystack API
    if (currentProvider === 'PAYSTACK' && profile.paystackCustomerCode) {
      console.log('Fetching Paystack transactions for customer:', profile.paystackCustomerCode);
      try {
        // Fetch transactions for this specific customer
        const response = await fetch(
          `https://api.paystack.co/transaction?customer=${profile.paystackCustomerCode}&perPage=50`,
          {
            headers: {
              Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
            },
          }
        );

        console.log('Paystack transaction response status:', response.status);

        if (response.ok) {
          const data = (await response.json()) as {
            status: boolean;
            message: string;
            data: Array<{
              id: number;
              reference: string;
              amount: number;
              currency: string;
              status: string;
              paid_at: string;
              created_at: string;
              customer: {
                id: number;
                customer_code: string;
                email: string;
              };
            }>;
          };

          console.log('Paystack transactions found:', data.data?.length || 0);

          if (data.data && data.data.length > 0) {
            for (const transaction of data.data) {
              // Only include successful transactions
              if (transaction.status === 'success' && transaction.paid_at) {
                billingHistory.push({
                  id: transaction.reference,
                  date: new Date(transaction.paid_at).toISOString(),
                  amount: transaction.amount / 100, // Convert from kobo/pesewas
                  currency: transaction.currency,
                  status: transaction.status,
                  invoiceUrl: undefined, // Paystack doesn't provide invoice URLs in transaction list
                });
              }
            }
          }
          console.log('Billing history items added:', billingHistory.length);
        } else {
          const errorText = await response.text();
          console.error('Paystack API error:', response.status, errorText);
        }
      } catch (error) {
        console.error('Error fetching Paystack transactions:', error);
      }
    } else {
      console.log('Skipping Paystack transactions:', {
        currentProvider,
        hasCustomerCode: !!profile.paystackCustomerCode,
      });
    }

    // Use current region info from middleware instead of potentially outdated database values
    const currentCurrency = regionInfo.currency || profile.currency || 'USD';
    // currentProvider already defined above at line 469

    return {
      subscriptionTier: profile.subscriptionTier?.toLowerCase() as 'solo' | 'salon',
      subscriptionStatus: profile.subscriptionStatus?.toLowerCase() as
        | 'trial'
        | 'active'
        | 'past_due'
        | 'paused'
        | 'cancelled'
        | 'expired',
      cancelAtPeriodEnd,
      trialEndDate: profile.trialEndDate?.toISOString() || null,
      nextBillingDate: stripeNextBillingDate?.toISOString() || profile.nextBillingDate?.toISOString() || null,
      monthlyFee: Number(profile.monthlyFee || 0),
      currency: currentCurrency, // Use current region currency
      paymentProvider: currentProvider as 'stripe' | 'paystack', // Use current region provider
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
      // Stripe payment method update - Only allow one payment method per provider
      let stripeCustomerId = profile.stripeCustomerId;
      
      // Check if customer ID is a trial placeholder (starts with 'trial_customer_')
      const isTrialPlaceholder = stripeCustomerId?.startsWith('trial_customer_');
      
      // Create real Stripe customer if doesn't exist or is a trial placeholder
      if (!stripeCustomerId || isTrialPlaceholder) {
        // Get provider user info
        const providerUser = await prisma.user.findUnique({
          where: { id: userId },
          select: {
            email: true,
            firstName: true,
            lastName: true,
          },
        });
        
        if (!providerUser) {
          throw new AppError(404, 'User not found');
        }
        
        const customer = await stripe.customers.create({
          email: providerUser.email,
          name: `${providerUser.firstName} ${providerUser.lastName}`,
          metadata: {
            providerId: profile.id,
            userId: userId,
            type: 'provider',
          },
        });
        stripeCustomerId = customer.id;
        
        // Update profile with real customer ID
        await prisma.providerProfile.update({
          where: { userId },
          data: { stripeCustomerId },
        });
      }

      try {
        // Get current payment method if exists
        const currentProfile = await prisma.providerProfile.findUnique({
          where: { userId },
          select: {
            paymentMethodId: true,
          },
        });

        // If provider already has a payment method, detach the old one (skip trial placeholders)
        if (currentProfile?.paymentMethodId && currentProfile.paymentMethodId !== 'stripe_trial') {
          try {
            await stripe.paymentMethods.detach(currentProfile.paymentMethodId);
          } catch (error) {
            // Ignore errors if payment method doesn't exist or is already detached
            console.warn(`Failed to detach old payment method: ${error}`);
          }
        }

        // Attach new payment method to customer
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

        // Update database - replace existing payment method
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
    // The paymentMethodId here is the authorization code from Paystack
    
    if (!profile.paystackCustomerCode) {
      throw new AppError(400, 'Paystack customer not found');
    }

    try {
      // Get authorization details from Paystack
      const authResponse = await fetch(
        `https://api.paystack.co/customer/${profile.paystackCustomerCode}/authorization`,
        {
          headers: {
            Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
          },
        }
      );

      if (!authResponse.ok) {
        throw new AppError(500, 'Failed to fetch Paystack authorizations');
      }

      const authData = (await authResponse.json()) as {
        status: boolean;
        data: Array<{
          authorization_code: string;
          bin: string;
          last4: string;
          exp_month: string;
          exp_year: string;
          channel: string;
          card_type: string;
          bank: string;
          country_code: string;
          brand: string;
          reusable: boolean;
          signature: string;
        }>;
      };

      // Find the authorization that matches the provided code
      const authorization = authData.data.find((auth) => auth.authorization_code === paymentMethodId);

      if (!authorization) {
        throw new AppError(404, 'Authorization code not found');
      }

      // Update database with new payment method details
      await prisma.providerProfile.update({
        where: { userId },
        data: {
          paymentMethodId: paymentMethodId,
          last4Digits: authorization.last4,
          cardBrand: authorization.brand,
          updatedAt: new Date(),
        },
      });

      // If user has an active subscription, update it with the new authorization
      const subscriptionCode = await prisma.providerProfile.findUnique({
        where: { userId },
        select: { paystackSubscriptionCode: true },
      });

      if (subscriptionCode?.paystackSubscriptionCode) {
        // Update subscription authorization on Paystack
        const updateResponse = await fetch(
          `https://api.paystack.co/subscription/${subscriptionCode.paystackSubscriptionCode}`,
          {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              authorization: paymentMethodId,
            }),
          }
        );

        if (!updateResponse.ok) {
          console.error('Failed to update Paystack subscription authorization');
        }
      }
    } catch (error) {
      console.error('Error updating Paystack payment method:', error);
      throw new AppError(500, 'Failed to update payment method');
    }
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

    // Geocode address if coordinates are not provided but address components are
    let latitude = data.latitude;
    let longitude = data.longitude;

    if (
      (latitude === undefined || longitude === undefined || latitude === null || longitude === null) &&
      data.addressLine1 &&
      data.city &&
      data.state &&
      data.country
    ) {
      try {
        const geocodingResult = await geocodingService.geocodeAddressComponents({
          addressLine1: data.addressLine1,
          addressLine2: data.addressLine2 || undefined,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode || undefined,
          country: data.country,
        });

        if (geocodingResult) {
          latitude = geocodingResult.latitude;
          longitude = geocodingResult.longitude;
        }
      } catch (error) {
        // Geocoding is optional, don't fail if it doesn't work
        console.warn('Geocoding failed for address:', error);
      }
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
        ...(latitude !== undefined && latitude !== null && { latitude }),
        ...(longitude !== undefined && longitude !== null && { longitude }),
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
  async changeSubscriptionTier(
    userId: string,
    data: ChangeTierRequest,
    regionInfo: { regionCode: string; currency: string; paymentProvider: string }
  ) {
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
    const newMonthlyFee = data.newTier === 'solo' ? SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD : SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD;

    // Use current payment provider from region detection, not stored value
    const currentProvider = (regionInfo.paymentProvider || 'stripe').toUpperCase();

    console.log('Changing subscription tier:', {
      userId,
      oldTier: profile.subscriptionTier,
      newTier: data.newTier,
      storedProvider: profile.paymentProvider,
      currentProvider,
      regionCode: regionInfo.regionCode,
    });

    // Update subscription in payment provider
    if (currentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
      const newPriceId =
        data.newTier === 'solo'
          ? process.env.STRIPE_SOLO_PRICE_ID
          : process.env.STRIPE_SALON_PRICE_ID;

      if (!newPriceId) {
        throw new AppError(500, 'Stripe price ID not configured');
      }

      // Check if subscription ID is a trial placeholder
      const isTrialSubscription = profile.stripeSubscriptionId.startsWith('trial_sub_');

      try {
        if (isTrialSubscription) {
          // Trial subscription - need to create a real subscription
          // Get provider details for customer creation
          const providerProfile = await prisma.providerProfile.findUnique({
            where: { userId },
            include: {
              user: true,
            },
          });

          if (!providerProfile) {
            throw new AppError(404, 'Provider profile not found');
          }

          // Ensure we have a real Stripe customer
          let stripeCustomerId = providerProfile.stripeCustomerId;
          const isTrialCustomer = stripeCustomerId?.startsWith('trial_customer_');

          if (!stripeCustomerId || isTrialCustomer) {
            const customer = await stripe.customers.create({
              email: providerProfile.user.email,
              name: `${providerProfile.user.firstName} ${providerProfile.user.lastName}`,
              metadata: {
                providerId: providerProfile.id,
                userId: userId,
                type: 'provider',
              },
            });
            stripeCustomerId = customer.id;

            // Update profile with real customer ID
            await prisma.providerProfile.update({
              where: { userId },
              data: { stripeCustomerId },
            });
          }

          // Check if provider has a payment method
          if (!providerProfile.paymentMethodId || providerProfile.paymentMethodId === 'stripe_trial') {
            throw new AppError(
              400,
              'Please add a payment method before changing subscription tier'
            );
          }

          // Create real Stripe subscription
          const subscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: newPriceId }],
            default_payment_method: providerProfile.paymentMethodId,
            trial_period_days: 0, // No additional trial when upgrading from trial
            metadata: {
              providerId: providerProfile.id,
              tier: data.newTier,
            },
          });

          // Update profile with real subscription ID
          await prisma.providerProfile.update({
            where: { userId },
            data: {
              stripeSubscriptionId: subscription.id,
              subscriptionStatus: 'ACTIVE',
            },
          });
        } else {
          // Real subscription - update it
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
        }
      } catch (error) {
        console.error('Error updating Stripe subscription:', error);
        throw new AppError(500, 'Failed to update subscription');
      }
    } else if (currentProvider === 'PAYSTACK' && profile.paystackSubscriptionCode) {
      // Paystack tier change - requires cancel and recreate
      const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId },
        include: { user: true },
      });

      if (!providerProfile) {
        throw new AppError(404, 'Provider profile not found');
      }

      // Check if we have email token for cancellation
      if (!providerProfile.paystackEmailToken) {
        throw new AppError(
          400,
          'Email token not found. Cannot change Paystack subscription tier.'
        );
      }

      // Check if we have authorization code for new subscription
      if (!providerProfile.paymentMethodId) {
        throw new AppError(
          400,
          'Payment method not found. Please add a payment method before changing subscription tier.'
        );
      }

      try {
        const { paystackService } = await import('../lib/payment');
        
        console.log('Changing Paystack subscription tier:', {
          oldTier: profile.subscriptionTier,
          newTier: data.newTier,
          subscriptionCode: profile.paystackSubscriptionCode,
          hasEmailToken: !!providerProfile.paystackEmailToken,
          hasAuthCode: !!providerProfile.paymentMethodId,
        });
        
        // Use the changeSubscriptionTier method which handles cancel + recreate
        const result = await paystackService.changeSubscriptionTier(
          profile.paystackSubscriptionCode,
          providerProfile.paystackEmailToken,
          providerProfile.user.email,
          providerProfile.user.firstName,
          providerProfile.user.lastName,
          data.newTier as 'solo' | 'salon',
          providerProfile.regionCode as 'GH' | 'NG',
          providerProfile.id,
          providerProfile.paymentMethodId // Authorization code
        );

        console.log('Paystack tier change result:', {
          newSubscriptionId: result.subscriptionId,
          newEmailToken: result.emailToken,
          nextBillingDate: result.nextBillingDate,
          monthlyFee: result.monthlyFee,
        });

        // Update profile with new subscription details
        await prisma.providerProfile.update({
          where: { userId },
          data: {
            paystackSubscriptionCode: result.subscriptionId,
            paystackEmailToken: result.emailToken || null,
            nextBillingDate: result.nextBillingDate,
            monthlyFee: result.monthlyFee,
          },
        });
      } catch (error) {
        console.error('Error changing Paystack subscription tier:', error);
        throw new AppError(500, 'Failed to change subscription tier');
      }
    }

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
  async cancelSubscription(
    userId: string,
    data: CancelSubscriptionRequest,
    regionInfo: { regionCode: string; currency: string; paymentProvider: string }
  ) {
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

    // Use current payment provider from region detection, not stored value
    const currentProvider = (regionInfo.paymentProvider || 'stripe').toUpperCase();

    console.log('Cancelling subscription:', {
      userId,
      storedProvider: profile.paymentProvider,
      currentProvider,
      regionCode: regionInfo.regionCode,
    });

    // Cancel subscription in payment provider
    if (currentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
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
    } else if (
      currentProvider === 'PAYSTACK' &&
      profile.paystackSubscriptionCode
    ) {
      // Cancel Paystack subscription
      try {
        // Get email token
        const fullProfile = await prisma.providerProfile.findUnique({
          where: { userId },
          select: { paystackEmailToken: true },
        });

        if (!fullProfile?.paystackEmailToken) {
          throw new AppError(
            400,
            'Email token not found. Cannot cancel Paystack subscription.'
          );
        }

        const { paystackService } = await import('../lib/payment');
        await paystackService.cancelSubscription(
          profile.paystackSubscriptionCode,
          fullProfile.paystackEmailToken
        );
      } catch (error) {
        console.error('Error cancelling Paystack subscription:', error);
        throw new AppError(500, 'Failed to cancel subscription');
      }
    }

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
  /**
   * Resume subscription (un-cancel)
   */
  async resumeSubscription(userId: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new AppError(404, 'Provider profile not found');
    }

    if (profile.paymentProvider === 'STRIPE' && profile.stripeSubscriptionId) {
      try {
        await stripe.subscriptions.update(profile.stripeSubscriptionId, {
          cancel_at_period_end: false,
        });
      } catch (error) {
        console.error('Error resuming Stripe subscription:', error);
        throw new AppError(500, 'Failed to resume subscription');
      }
    } else {
      throw new AppError(400, 'Resuming subscription not supported for this provider');
    }

    return {
      message: 'Subscription resumed successfully. Your plan will continue.',
    };
  }
}

export const settingsService = new SettingsService();
