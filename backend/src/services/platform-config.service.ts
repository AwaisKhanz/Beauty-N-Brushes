/**
 * Platform Configuration Service
 * Manages configurable platform settings (service fees, etc.)
 */

import { prisma } from '../config/database';

export interface ServiceFeeConfig {
  base: number;
  percentage: number;
  cap: number;
}

class PlatformConfigService {
  /**
   * Get config value by key
   */
  async getConfig(key: string): Promise<string | null> {
    const config = await prisma.platformConfig.findUnique({
      where: { key },
    });

    return config?.value || null;
  }

  /**
   * Get service fee configuration
   */
  async getServiceFeeConfig(): Promise<ServiceFeeConfig> {
    const [base, percentage, cap] = await Promise.all([
      this.getConfig('SERVICE_FEE_BASE'),
      this.getConfig('SERVICE_FEE_PERCENTAGE'),
      this.getConfig('SERVICE_FEE_CAP'),
    ]);

    return {
      base: base ? parseFloat(base) : 1.25,
      percentage: percentage ? parseFloat(percentage) : 3.6,
      cap: cap ? parseFloat(cap) : 8.0,
    };
  }

  /**
   * Update config value (admin only)
   */
  async updateConfig(key: string, value: string, userId: string): Promise<void> {
    await prisma.platformConfig.upsert({
      where: { key },
      update: {
        value,
        updatedBy: userId,
        updatedAt: new Date(),
      },
      create: {
        key,
        value,
        dataType: 'number', // Default to number for now
        category: 'payment',
        updatedBy: userId,
      },
    });
  }

  /**
   * Get all configs by category
   */
  async getConfigsByCategory(category: string) {
    return prisma.platformConfig.findMany({
      where: { category },
      orderBy: { key: 'asc' },
    });
  }

  /**
   * Get all payment configs (for admin settings page)
   */
  async getPaymentConfigs() {
    return this.getConfigsByCategory('payment');
  }
}

export const platformConfigService = new PlatformConfigService();
