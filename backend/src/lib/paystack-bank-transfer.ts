/**
 * Paystack Bank Transfer Utilities
 * Phase 4.3: Dedicated Virtual Account Management
 */

import { paymentConfig } from '../config/payment.config';
import logger from '../utils/logger';

interface CreateVirtualAccountParams {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  preferredBank?: 'wema-bank' | 'titan-paystack';
}

interface VirtualAccountResponse {
  bank: {
    name: string;
    id: number;
    slug: string;
  };
  account_name: string;
  account_number: string;
  assigned: boolean;
  currency: string;
  customer: {
    id: number;
    email: string;
  };
}

/**
 * Create dedicated virtual account for bank transfer
 * Paystack API: https://paystack.com/docs/api/#dedicated-virtual-account-assign
 */
export async function createDedicatedVirtualAccount(
  params: CreateVirtualAccountParams
): Promise<VirtualAccountResponse> {
  try {
    const response = await fetch('https://api.paystack.co/dedicated_account/assign', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: params.email,
        first_name: params.firstName,
        last_name: params.lastName,
        phone: params.phone || '',
        preferred_bank: params.preferredBank || 'wema-bank',
        country: 'NG', // Nigeria only
      }),
    });

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.message || 'Failed to create virtual account');
    }

    const data: any = await response.json();
    return data.data as VirtualAccountResponse;
  } catch (error) {
    logger.error('Error creating dedicated virtual account:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Get existing virtual accounts for a customer
 */
export async function getVirtualAccounts(customerId: number): Promise<VirtualAccountResponse[]> {
  try {
    const response = await fetch(
      `https://api.paystack.co/dedicated_account?customer=${customerId}`,
      {
        headers: {
          Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        },
      }
    );

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.message || 'Failed to fetch virtual accounts');
    }

    const data: any = await response.json();
    return data.data as VirtualAccountResponse[];
  } catch (error) {
    logger.error('Error fetching virtual accounts:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Deactivate a virtual account
 */
export async function deactivateVirtualAccount(accountId: number): Promise<void> {
  try {
    const response = await fetch(
      `https://api.paystack.co/dedicated_account/${accountId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        },
      }
    );

    if (!response.ok) {
      const error: any = await response.json();
      throw new Error(error.message || 'Failed to deactivate virtual account');
    }
  } catch (error) {
    logger.error('Error deactivating virtual account:', error instanceof Error ? error.message : String(error));
    throw error;
  }
}

export const bankTransferService = {
  createDedicatedVirtualAccount,
  getVirtualAccounts,
  deactivateVirtualAccount,
};
