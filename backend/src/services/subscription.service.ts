import { prisma } from '../config/database';
import type {
  SubscriptionConfigResponse,
  UpdateSubscriptionConfigRequest,
} from '../../../shared-types';

export class SubscriptionService {
  /**
   * Get subscription configuration (singleton)
   * Creates default config if it doesn't exist
   */
  async getSubscriptionConfig(): Promise<SubscriptionConfigResponse> {
    let config = await prisma.subscriptionConfig.findUnique({
      where: { id: 'default' },
    });

    // Create default config if it doesn't exist
    if (!config) {
      config = await prisma.subscriptionConfig.create({
        data: {
          id: 'default',
          trialEnabled: true,
          trialDurationDays: 60,
        },
      });
    }

    return {
      id: config.id,
      trialEnabled: config.trialEnabled,
      trialDurationDays: config.trialDurationDays,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  /**
   * Update subscription configuration (admin only)
   */
  async updateSubscriptionConfig(
    data: UpdateSubscriptionConfigRequest
  ): Promise<SubscriptionConfigResponse> {
    // Validate trial duration if provided
    if (data.trialDurationDays !== undefined) {
      const MIN_DAYS = 1;
      const MAX_DAYS = 365;

      if (data.trialDurationDays < MIN_DAYS || data.trialDurationDays > MAX_DAYS) {
        throw new Error(
          `Trial duration must be between ${MIN_DAYS} and ${MAX_DAYS} days`
        );
      }
    }

    // Ensure config exists
    await this.getSubscriptionConfig();

    // Update config
    const config = await prisma.subscriptionConfig.update({
      where: { id: 'default' },
      data: {
        ...(data.trialEnabled !== undefined && { trialEnabled: data.trialEnabled }),
        ...(data.trialDurationDays !== undefined && {
          trialDurationDays: data.trialDurationDays,
        }),
      },
    });

    return {
      id: config.id,
      trialEnabled: config.trialEnabled,
      trialDurationDays: config.trialDurationDays,
      createdAt: config.createdAt.toISOString(),
      updatedAt: config.updatedAt.toISOString(),
    };
  }

  /**
   * Calculate trial end date based on current configuration
   * Returns null if trials are disabled
   */
  async getTrialEndDate(): Promise<Date | null> {
    const config = await this.getSubscriptionConfig();

    if (!config.trialEnabled) {
      return null;
    }

    const now = new Date();
    const trialEndDate = new Date(now);
    trialEndDate.setDate(trialEndDate.getDate() + config.trialDurationDays);

    return trialEndDate;
  }
}

export const subscriptionService = new SubscriptionService();
