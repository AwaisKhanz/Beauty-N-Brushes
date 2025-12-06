import { prisma } from '../config/database';
import logger from '../utils/logger';

/**
 * Handle Paystack bank transfer success
 * Phase 4.3: Dedicated Virtual Account
 */
export async function handlePaystackBankTransferSuccess(data: any): Promise<void> {
  logger.info(`Paystack bank transfer received: ${data.reference}`);

  try {
    // Get booking ID from metadata
    const bookingId = data.metadata?.bookingId;
    
    if (!bookingId) {
      logger.warn('Bank transfer webhook missing bookingId in metadata');
      return;
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      logger.warn(`Booking not found for bank transfer: ${bookingId}`);
      return;
    }

    // Update booking with Paystack reference
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        paystackReference: data.reference,
      },
    });

    logger.info(`Booking ${booking.id} confirmed via bank transfer - reference: ${data.reference}`);
  } catch (error) {
    logger.error('Error handling bank transfer success:', error instanceof Error ? error.message : String(error));
  }
}
