import { prisma } from '../config/database';
import type { PaymentProvider, SubscriptionTier } from '@prisma/client';
import { stripeService, paystackService, getPaymentProvider } from '../lib/payment';
import { emailService } from '../lib/email';
import { env } from '../config/env';
import type { RegionCode } from '../types/payment.types';
import type {
  AccountTypeData,
  BusinessDetailsData,
  BrandCustomizationData,
  PolicyData,
  AvailabilityScheduleData,
  OnboardingStatus,
} from '../types/onboarding.types';
import { SUBSCRIPTION_TIERS, TRIAL_PERIOD_DAYS, REGIONS } from '../../../shared-constants';

export class OnboardingService {
  /**
   * Create provider profile with account type
   */
  async createProviderProfile(data: AccountTypeData) {
    const { userId, accountType } = data;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (user.role !== 'PROVIDER') {
      throw new Error('User must have PROVIDER role');
    }

    // Check if provider profile already exists
    const existingProfile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    // Determine subscription tier and payment defaults
    const subscriptionTier: SubscriptionTier = accountType === 'solo' ? 'SOLO' : 'SALON';
    const isSalon = accountType === 'salon';

    // If profile exists, update the account type
    if (existingProfile) {
      const profile = await prisma.providerProfile.update({
        where: { userId },
        data: {
          isSalon,
          subscriptionTier,
        },
      });
      return profile;
    }

    // Create provider profile
    const profile = await prisma.providerProfile.create({
      data: {
        userId,
        businessName: '', // Will be filled in business details step
        city: '', // Will be filled in business details step
        state: '', // Will be filled in business details step
        zipCode: '', // Will be filled in business details step
        slug: `provider-${userId}`, // Temporary slug, will be updated with business name
        isSalon,
        subscriptionTier,
        subscriptionStatus: 'TRIAL',
        profileCompleted: false,
        // Default to North America Stripe for now - will be updated in payment setup
        paymentProvider: 'STRIPE' as PaymentProvider,
        regionCode: 'NA',
        currency: 'USD',
      },
    });

    return {
      id: profile.id,
      accountType,
      subscriptionTier,
      isSalon,
    };
  }

  /**
   * Update business details
   */
  async updateBusinessDetails(userId: string, data: BusinessDetailsData) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Generate slug from business name
    const slug = data.businessName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');

    // Check if slug is unique
    const existingSlug = await prisma.providerProfile.findFirst({
      where: {
        slug,
        id: { not: profile.id },
      },
    });

    const finalSlug = existingSlug ? `${slug}-${Date.now()}` : slug;

    // Update provider profile (without address fields - those go to ProviderLocation)
    const updatedProfile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        businessName: data.businessName,
        tagline: data.tagline,
        businessType: data.businessType,
        description: data.description,
        // Keep city, state, zipCode for search/filtering optimization
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        businessEmail: data.businessEmail,
        businessPhone: data.phone,
        instagramHandle: data.instagramHandle,
        websiteUrl: data.website,
        serviceSpecializations: data.serviceSpecializations,
        yearsExperience: data.yearsExperience,
        slug: finalSlug,
      },
    });

    // Create or update primary location in ProviderLocation table
    const existingLocation = await prisma.providerLocation.findFirst({
      where: { 
        providerId: profile.id,
        isPrimary: true,
      },
    });

    if (existingLocation) {
      // Update existing primary location
      await prisma.providerLocation.update({
        where: { id: existingLocation.id },
        data: {
          name: 'Primary Location',
          addressLine1: data.address,
          addressLine2: null,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          businessPhone: data.phone,
        },
      });
    } else {
      // Create new primary location
      await prisma.providerLocation.create({
        data: {
          providerId: profile.id,
          name: 'Primary Location',
          addressLine1: data.address,
          addressLine2: null,
          city: data.city,
          state: data.state,
          zipCode: data.zipCode,
          country: data.country,
          latitude: data.latitude,
          longitude: data.longitude,
          businessPhone: data.phone,
          isPrimary: true,
          isActive: true,
        },
      });
    }

    return updatedProfile;
  }

  /**
   * Update profile media
   */
  async updateProfileMedia(
    userId: string,
    data: {
      profilePhotoUrl?: string;
      logoUrl?: string;
      coverPhotoUrl?: string;
    }
  ) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Update provider profile with media URLs
    const updatedProfile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        logoUrl: data.logoUrl || profile.logoUrl,
        coverPhotoUrl: data.coverPhotoUrl || profile.coverPhotoUrl,
      },
    });

    // Update user avatar if profile photo provided
    if (data.profilePhotoUrl) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          avatarUrl: data.profilePhotoUrl,
        },
      });
    }

    return updatedProfile;
  }

  /**
   * Update brand customization
   */
  async updateBrandCustomization(userId: string, data: BrandCustomizationData) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    const updatedProfile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        brandColorPrimary: data.brandColorPrimary,
        brandColorSecondary: data.brandColorSecondary,
        brandColorAccent: data.brandColorAccent,
        brandFontHeading: data.brandFontHeading,
        brandFontBody: data.brandFontBody,
      },
    });

    return updatedProfile;
  }

  /**
   * Setup payment and create subscription
   */
  async setupPayment(userId: string, regionCode: RegionCode, paymentMethodId?: string) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: true,
      },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Get payment provider for region
    // getPaymentProvider returns lowercase ('stripe' | 'paystack')
    // But database enum uses uppercase ('STRIPE' | 'PAYSTACK')
    const paymentProviderLower = getPaymentProvider(regionCode);
    const paymentProvider = paymentProviderLower.toUpperCase() as PaymentProvider; // Convert to DB enum format
    const tier = profile.subscriptionTier === 'SOLO' ? 'solo' : 'salon';

    let subscriptionResult;

    if (paymentProviderLower === 'stripe') {
      // TRIAL MODE: Skip Stripe API calls for trial setup
      if (paymentMethodId === 'stripe_trial') {
        // Create trial subscription without payment method
        subscriptionResult = {
          customerId: `trial_customer_${profile.id}`,
          subscriptionId: `trial_sub_${profile.id}`,
          paymentMethodId: 'stripe_trial',
          last4: null,
          cardBrand: null,
          trialEndDate: new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000),
          monthlyFee:
            tier === 'solo'
              ? SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD
              : SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD,
        };
      } else {
        // Normal Stripe subscription (when payment collection is implemented)
        if (!paymentMethodId) {
          throw new Error('Payment method ID required for Stripe');
        }

        subscriptionResult = await stripeService.createProviderSubscription(
          profile.user.email,
          profile.user.firstName,
          profile.user.lastName,
          paymentMethodId,
          tier,
          profile.id
        );
      }

      // Update provider profile with Stripe details
      // Get currency for region from REGIONS constant (USD for NA, EUR for EU)
      const currency = REGIONS[regionCode].currency;
      
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          paymentProvider: paymentProvider, // Already uppercase from conversion above
          regionCode,
          currency,
          stripeCustomerId: subscriptionResult.customerId,
          stripeSubscriptionId: subscriptionResult.subscriptionId,
          paymentMethodId: subscriptionResult.paymentMethodId,
          last4Digits: subscriptionResult.last4,
          cardBrand: subscriptionResult.cardBrand,
          subscriptionStatus: 'TRIAL',
          trialEndDate: subscriptionResult.trialEndDate,
          nextBillingDate: subscriptionResult.nextBillingDate,
          monthlyFee: subscriptionResult.monthlyFee,
        },
      });
    } else {
      // Paystack subscription (GH/NG)
      // TRIAL MODE: Skip Paystack API calls for trial setup
      if (paymentMethodId === 'paystack_trial') {
        // Create trial subscription without payment method
        subscriptionResult = {
          customerId: `trial_customer_${profile.id}`,
          subscriptionId: `trial_sub_${profile.id}`,
          planCode: null,
          paymentMethodId: 'paystack_trial',
          last4: null,
          cardBrand: null,
          trialEndDate: new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000),
          nextBillingDate: new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000),
          monthlyFee:
            tier === 'solo'
              ? SUBSCRIPTION_TIERS.SOLO.monthlyPriceUSD
              : SUBSCRIPTION_TIERS.SALON.monthlyPriceUSD,
        };
      } else {
        // Normal Paystack subscription with authorization code
        // paymentMethodId is actually the authorization code from Paystack transaction
        // Authorization codes from Paystack start with 'AUTH_' but we accept any valid code
        const authorizationCode = paymentMethodId || undefined;

        subscriptionResult = await paystackService.createProviderSubscription(
          profile.user.email,
          profile.user.firstName,
          profile.user.lastName,
          tier,
          regionCode,
          profile.id,
          authorizationCode
        );
      }

      // Get currency for region
      const currency = regionCode === 'GH' ? 'GHS' : 'NGN';

      // Determine subscription status based on whether subscription was created
      const subscriptionStatus = subscriptionResult.subscriptionId
        ? 'ACTIVE' // Subscription created with authorization code
        : 'TRIAL'; // Trial mode without payment method

      // Update provider profile with Paystack details
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          paymentProvider: paymentProvider, // Already uppercase from conversion above
          regionCode,
          currency,
          paystackCustomerCode: subscriptionResult.customerId,
          paystackSubscriptionCode: subscriptionResult.subscriptionId || null,
          paystackEmailToken: subscriptionResult.emailToken || null, // Store email token for cancellation
          paymentMethodId: paymentMethodId || null, // Store authorization code or null
          subscriptionStatus,
          trialEndDate: subscriptionResult.trialEndDate,
          nextBillingDate: subscriptionResult.nextBillingDate,
          monthlyFee: subscriptionResult.monthlyFee,
        },
      });
    }

    return subscriptionResult;
  }

  /**
   * Save business policies
   */
  async savePolicies(userId: string, data: PolicyData) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Create or update provider policy
    const existingPolicy = await prisma.providerPolicy.findUnique({
      where: { providerId: profile.id },
    });

    if (existingPolicy) {
      // Update existing policy
      const policy = await prisma.providerPolicy.update({
        where: { id: existingPolicy.id },
        data: {
          cancellationPolicyText: data.cancellationPolicy,
          latePolicyText: data.lateArrivalPolicy,
          refundPolicyText: data.refundPolicy,
          // Deposits are ALWAYS mandatory per requirements
        },
      });
      return policy;
    } else {
      // Create new policy
      const policy = await prisma.providerPolicy.create({
        data: {
          providerId: profile.id,
          cancellationPolicyText: data.cancellationPolicy,
          latePolicyText: data.lateArrivalPolicy,
          refundPolicyText: data.refundPolicy,
          // Deposits are ALWAYS mandatory per requirements
        },
      });
      return policy;
    }
  }

  /**
   * Setup availability schedule
   */
  async setupAvailability(userId: string, data: AvailabilityScheduleData) {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Validate at least one day is available
    const availableDays = data.schedule.filter((day) => day.isAvailable);
    if (availableDays.length === 0) {
      throw new Error('At least one day must be available');
    }

    // Update provider booking settings
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        timezone: data.timezone,
        advanceBookingDays: data.advanceBookingDays,
        minAdvanceHours: data.minimumNoticeHours,
        bookingBufferMinutes: data.bufferMinutes,
        sameDayBookingEnabled: data.sameDayBooking,
      },
    });

    // Delete existing availability
    await prisma.providerAvailability.deleteMany({
      where: { providerId: profile.id },
    });

    // Create new availability records
    await prisma.providerAvailability.createMany({
      data: data.schedule.map((day) => ({
        providerId: profile.id,
        dayOfWeek: day.dayOfWeek,
        startTime: day.startTime,
        endTime: day.endTime,
        isAvailable: day.isAvailable,
      })),
    });

    return { message: 'Availability saved successfully' };
  }

  /**
   * Get provider onboarding status
   */
  async getOnboardingStatus(userId: string): Promise<OnboardingStatus> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
      include: {
        user: true,
        policies: true,
        availability: true,
        locations: {
          where: { isPrimary: true },
          take: 1,
        },
      },
    });

    if (!profile) {
      return {
        hasProfile: false,
        completed: false,
        steps: {
          accountType: false,
          businessDetails: false,
          profileMedia: false,
          brandCustomization: false,
          policies: false,
          paymentSetup: false,
          availabilitySet: false,
        },
      };
    }

    // Check if payment setup is complete (either Stripe or Paystack)
    // For Paystack during trial, customer code is enough (subscription created later with payment)
    const hasPaymentSetup =
      !!(profile.stripeCustomerId && profile.stripeSubscriptionId) ||
      !!profile.paystackCustomerCode;

    return {
      hasProfile: true,
      completed: profile.profileCompleted,
      steps: {
        accountType: true,
        businessDetails: !!profile.businessName && !!profile.locations[0]?.addressLine1,
        profileMedia: !!profile.user.avatarUrl, // Profile photo is REQUIRED
        brandCustomization: !!profile.brandColorPrimary,
        policies: !!profile.policies,
        paymentSetup: hasPaymentSetup, // Check subscription exists (Stripe OR Paystack)
        availabilitySet: profile.availability.length > 0,
      },
      // Include the actual profile data for form pre-filling
      profile: {
        isSalon: profile.isSalon,
        businessName: profile.businessName,
        businessType: profile.businessType,
        description: profile.description,
        tagline: profile.tagline,
        // Get location data from ProviderLocation table
        addressLine1: profile.locations[0]?.addressLine1 || null,
        addressLine2: profile.locations[0]?.addressLine2 || null,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        country: profile.country,
        latitude: profile.locations[0]?.latitude ? Number(profile.locations[0].latitude) : null,
        longitude: profile.locations[0]?.longitude ? Number(profile.locations[0].longitude) : null,
        businessEmail: profile.businessEmail,
        businessPhone: profile.businessPhone,
        instagramHandle: profile.instagramHandle,
        websiteUrl: profile.websiteUrl,
        serviceSpecializations: profile.serviceSpecializations,
        yearsExperience: profile.yearsExperience,
        brandColorPrimary: profile.brandColorPrimary,
        brandColorSecondary: profile.brandColorSecondary,
        brandColorAccent: profile.brandColorAccent,
        brandFontHeading: profile.brandFontHeading,
        brandFontBody: profile.brandFontBody,
        logoUrl: profile.logoUrl,
        coverPhotoUrl: profile.coverPhotoUrl,
        avatarUrl: profile.user.avatarUrl,
        policies: profile.policies
          ? {
              cancellationPolicy: profile.policies.cancellationPolicyText || '',
              lateArrivalPolicy: profile.policies.latePolicyText || '',
              depositRequired: true, // Always mandatory per requirements
              refundPolicy: profile.policies.refundPolicyText || '',
            }
          : null,
        subscriptionTier: profile.subscriptionTier as string,
      },
    };
  }

  /**
   * Complete onboarding
   */
  async completeOnboarding(userId: string) {
    const status = await this.getOnboardingStatus(userId);

    if (!status.hasProfile) {
      throw new Error('Provider profile not found');
    }

    // Validate all required steps are completed
    const requiredSteps = [
      'accountType',
      'businessDetails',
      'profileMedia',
      'brandCustomization',
      'policies',
      'paymentSetup',
      'availabilitySet',
    ];

    const incompleteSteps = requiredSteps.filter(
      (step) => !status.steps[step as keyof typeof status.steps]
    );

    if (incompleteSteps.length > 0) {
      throw new Error(`Incomplete onboarding steps: ${incompleteSteps.join(', ')}`);
    }

    // Mark profile as completed
    const profile = await prisma.providerProfile.update({
      where: { userId },
      data: {
        profileCompleted: true,
        verificationStatus: 'pending', // For automated review
      },
      include: { user: true },
    });

    // Send welcome email
    const trialEndDate = new Date(Date.now() + TRIAL_PERIOD_DAYS * 24 * 60 * 60 * 1000);

    await emailService.sendWelcomeEmail(profile.user.email, profile.user.firstName, {
      trialEndDate: trialEndDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      bookingPageUrl: `${env.FRONTEND_URL}/@${profile.slug}`,
      dashboardUrl: `${env.FRONTEND_URL}/dashboard`,
    });

    return profile;
  }
}

export const onboardingService = new OnboardingService();
