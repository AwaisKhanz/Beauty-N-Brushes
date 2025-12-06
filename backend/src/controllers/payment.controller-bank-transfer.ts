import { Response } from 'express';
import { AuthRequest } from '../types';
import { sendSuccess } from '../utils/response';
import { AppError } from '../middleware/errorHandler';
import { prisma } from '../config/database';

/**
 * Create dedicated virtual account for bank transfer
 * Phase 4.3: Bank Transfer Implementation
 */
export async function createBankTransferAccount(
  req: AuthRequest,
  res: Response
): Promise<void> {
  try {
    const { bookingId, email, name } = req.body;

    if (!bookingId || !email || !name) {
      throw new AppError(400, 'Missing required fields');
    }

    // Get booking details
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Only for Nigeria (NGN)
    if (booking.clientRegionCode !== 'NG') {
      throw new AppError(400, 'Bank transfer is only available for Nigeria');
    }

    // Import bank transfer service
    const { createDedicatedVirtualAccount } = await import('../lib/paystack-bank-transfer');

    // Split name into first and last
    const nameParts = name.split(' ');
    const firstName = nameParts[0] || 'Customer';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Create virtual account
    const accountDetails = await createDedicatedVirtualAccount({
      email,
      firstName,
      lastName,
      phone: booking.client.phone || undefined,
    });

    sendSuccess(res, {
      accountDetails,
      amount: booking.depositAmount,
      currency: 'NGN',
    });
  } catch (error) {
    throw new AppError(500, 'Failed to create bank transfer account');
  }
}
