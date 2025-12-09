/**
 * Paystack Customer Management Service
 * 
 * Handles creation and retrieval of Paystack customers
 */

import { prisma } from '../config/database';
import { paymentConfig } from '../config/payment.config';
import { AppError } from '../middleware/errorHandler';

interface PaystackCustomer {
  id: number;
  customer_code: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  metadata: Record<string, unknown> | null;
  risk_action: string;
}

interface PaystackCustomerResponse {
  status: boolean;
  message: string;
  data: PaystackCustomer;
}

/**
 * Get or create a Paystack customer for a user
 */
export async function getOrCreatePaystackCustomer(
  userId: string,
  email: string,
  firstName?: string,
  lastName?: string,
  phone?: string
): Promise<PaystackCustomer> {
  // Check if customer already exists in our database
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      paystackCustomerCode: true,
      firstName: true,
      lastName: true,
      phone: true,
    },
  });

  // If we have a Paystack customer code, fetch from Paystack
  if (user?.paystackCustomerCode) {
    try {
      const response = await fetch(
        `https://api.paystack.co/customer/${user.paystackCustomerCode}`,
        {
          headers: {
            Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
          },
        }
      );

      if (response.ok) {
        const data = (await response.json()) as PaystackCustomerResponse;
        return data.data;
      }
    } catch (error) {
      console.error('Error fetching Paystack customer:', error);
      // Continue to create new customer if fetch fails
    }
  }

  // Create new Paystack customer
  const customerData = {
    email,
    first_name: firstName || user?.firstName || undefined,
    last_name: lastName || user?.lastName || undefined,
    phone: phone || user?.phone || undefined,
    metadata: {
      userId,
    },
  };

  const response = await fetch('https://api.paystack.co/customer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(customerData),
  });

  if (!response.ok) {
    const errorData = await response.json() as { message?: string };
    throw new AppError(400, errorData.message || 'Failed to create Paystack customer');
  }

  const data = (await response.json()) as PaystackCustomerResponse;

  // Save customer code to database
  await prisma.user.update({
    where: { id: userId },
    data: {
      paystackCustomerCode: data.data.customer_code,
    },
  });

  return data.data;
}

/**
 * Fetch Paystack customer by customer code
 */
export async function getPaystackCustomer(
  customerCode: string
): Promise<PaystackCustomer> {
  const response = await fetch(
    `https://api.paystack.co/customer/${customerCode}`,
    {
      headers: {
        Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
      },
    }
  );

  if (!response.ok) {
    const errorData = await response.json() as { message?: string };
    throw new AppError(404, errorData.message || 'Customer not found');
  }

  const data = (await response.json()) as PaystackCustomerResponse;
  return data.data;
}

/**
 * Update Paystack customer
 */
export async function updatePaystackCustomer(
  customerCode: string,
  updates: {
    first_name?: string;
    last_name?: string;
    phone?: string;
    metadata?: Record<string, unknown>;
  }
): Promise<PaystackCustomer> {
  const response = await fetch(
    `https://api.paystack.co/customer/${customerCode}`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${paymentConfig.paystack.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    }
  );

  if (!response.ok) {
    const errorData = await response.json() as { message?: string };
    throw new AppError(400, errorData.message || 'Failed to update customer');
  }

  const data = (await response.json()) as PaystackCustomerResponse;
  return data.data;
}
