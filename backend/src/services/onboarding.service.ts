import { prisma } from '../config/database';
import type { PaymentProvider, SubscriptionTier } from '@prisma/client';
import { stripeService, paystackService, getPaymentProvider } from '../lib/payment';
import { emailService } from '../lib/email';
import type { RegionCode } from '../types/payment.types';
import type {
  AccountTypeData,
  BusinessDetailsData,
  BrandCustomizationData,
  PolicyData,
  AvailabilityScheduleData,
  OnboardingStatus,
} from '../types/onboarding.types';

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

    // Update provider profile
    const updatedProfile = await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        businessName: data.businessName,
        tagline: data.tagline,
        businessType: data.businessType,
        description: data.description,
        addressLine1: data.address,
        city: data.city,
        state: data.state,
        zipCode: data.zipCode,
        country: data.country,
        latitude: data.latitude,
        longitude: data.longitude,
        businessEmail: data.businessEmail,
        businessPhone: data.phone,
        instagramHandle: data.instagramHandle,
        websiteUrl: data.website,
        serviceSpecializations: data.serviceSpecializations,
        yearsExperience: data.yearsExperience,
        slug: finalSlug,
      },
    });

    // Note: Additional salon locations can be added via separate endpoint
    // This would require a separate table for salon locations

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
    const paymentProvider = getPaymentProvider(regionCode);
    const tier = profile.subscriptionTier === 'SOLO' ? 'solo' : 'salon';

    let subscriptionResult;

    if (paymentProvider === 'stripe') {
      // TRIAL MODE: Skip Stripe API calls for trial setup
      if (paymentMethodId === 'stripe_trial') {
        // Create trial subscription without payment method
        subscriptionResult = {
          customerId: `trial_customer_${profile.id}`,
          subscriptionId: `trial_sub_${profile.id}`,
          paymentMethodId: 'stripe_trial',
          last4: null,
          cardBrand: null,
          trialEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          nextBillingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          monthlyFee: tier === 'solo' ? 19.0 : 49.0,
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
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          paymentProvider: 'STRIPE' as PaymentProvider,
          regionCode,
          currency: 'USD',
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
          trialEndDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          nextBillingDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
          monthlyFee: tier === 'solo' ? 19.0 : 49.0,
        };
      } else {
        // Normal Paystack subscription (when payment collection is implemented)
        subscriptionResult = await paystackService.createProviderSubscription(
          profile.user.email,
          profile.user.firstName,
          profile.user.lastName,
          tier,
          regionCode,
          profile.id
        );
      }

      // Get currency for region
      const currency = regionCode === 'GH' ? 'GHS' : 'NGN';

      // Update provider profile with Paystack details
      await prisma.providerProfile.update({
        where: { id: profile.id },
        data: {
          paymentProvider: 'PAYSTACK' as PaymentProvider,
          regionCode,
          currency,
          paystackCustomerCode: subscriptionResult.customerId,
          paystackSubscriptionCode: subscriptionResult.subscriptionId || null, // May be empty during trial
          subscriptionStatus: 'TRIAL',
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

    // Update provider profile with booking settings
    await prisma.providerProfile.update({
      where: { id: profile.id },
      data: {
        advanceBookingDays: data.advanceBookingDays,
        minAdvanceHours: data.minimumNoticeHours,
      },
    });

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
          depositRequired: data.depositRequired,
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
          depositRequired: data.depositRequired,
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
        services: true,
        availability: true,
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
          serviceCreated: false,
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
        businessDetails: !!profile.businessName && !!profile.addressLine1,
        profileMedia: !!profile.user.avatarUrl, // Profile photo is REQUIRED
        brandCustomization: !!profile.brandColorPrimary,
        policies: !!profile.policies,
        paymentSetup: hasPaymentSetup, // Check subscription exists (Stripe OR Paystack)
        serviceCreated: profile.services.length > 0,
        availabilitySet: profile.availability.length > 0,
      },
      // Include the actual profile data for form pre-filling
      profile: {
        isSalon: profile.isSalon,
        businessName: profile.businessName,
        businessType: profile.businessType,
        description: profile.description,
        tagline: profile.tagline,
        addressLine1: profile.addressLine1,
        addressLine2: profile.addressLine2,
        city: profile.city,
        state: profile.state,
        zipCode: profile.zipCode,
        country: profile.country,
        latitude: profile.latitude ? Number(profile.latitude) : null,
        longitude: profile.longitude ? Number(profile.longitude) : null,
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
        policies: profile.policies,
        subscriptionTier: profile.subscriptionTier,
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
      'serviceCreated',
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
    const appUrl = process.env.APP_URL || 'http://localhost:3000';
    const trialEndDate = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000);

    await emailService.sendWelcomeEmail(profile.user.email, profile.user.firstName, {
      trialEndDate: trialEndDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      bookingPageUrl: `${appUrl}/@${profile.slug}`,
      dashboardUrl: `${appUrl}/dashboard`,
    });

    return profile;
  }
}

export const onboardingService = new OnboardingService();
