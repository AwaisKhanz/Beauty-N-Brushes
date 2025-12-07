import Stripe from 'stripe';
import { prisma } from '../config/database';
import { paymentConfig } from '../config/payment.config';
import logger from '../utils/logger';
import { AppError } from '../middleware/errorHandler';
import { emitRefundUpdate } from '../config/socket.server';

const stripe = new Stripe(paymentConfig.stripe.secretKey || '', {
  apiVersion: '2023-10-16',
});

export class RefundService {
  /**
   * Process refund based on payment provider and booking details
   */
  async processRefund(
    bookingId: string,
    amount: number,
    reason: string,
    initiatedBy: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: {
          id: true,
          paymentProvider: true,
          stripePaymentIntentId: true,
          paystackReference: true,
          paymentStatus: true,
          depositAmount: true,
          serviceFee: true,
          currency: true,
          clientId: true,
        },
      });

      if (!booking) {
        throw new AppError(404, 'Booking not found');
      }

      // Check if payment was actually made
      if (booking.paymentStatus === 'AWAITING_DEPOSIT') {
        logger.info(`No refund needed for booking ${bookingId} - payment never made`);
        return { success: true, refundId: 'NO_PAYMENT' };
      }

      // Determine payment provider and process refund
      if (booking.paymentProvider === 'STRIPE' && booking.stripePaymentIntentId) {
        return await this.processStripeRefund(booking, amount, reason, initiatedBy);
      } else if (booking.paymentProvider === 'PAYSTACK' && booking.paystackReference) {
        return await this.processPaystackRefund(booking, amount, reason, initiatedBy);
      }

      logger.warn(`Unknown payment provider for booking ${bookingId}`);
      return { success: false, error: 'Unknown payment provider' };
    } catch (error) {
      logger.error('Error processing refund:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Process Stripe refund with database tracking
   */
  private async processStripeRefund(
    booking: any,
    amount: number,
    reason: string,
    initiatedBy: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    let refundRecord: any = null;

    try {
      logger.info(`Processing Stripe refund for booking ${booking.id}: $${amount}`);

      // Create refund record in database FIRST
      refundRecord = await prisma.refund.create({
        data: {
          bookingId: booking.id,
          amount,
          currency: booking.currency,
          reason,
          paymentProvider: 'STRIPE',
          status: 'PENDING',
          initiatedBy,
        },
      });

      // Process Stripe refund
      const refund = await stripe.refunds.create({
        payment_intent: booking.stripePaymentIntentId,
        amount: Math.round(amount * 100), // Convert to cents
        reason: 'requested_by_customer',
        metadata: {
          bookingId: booking.id,
          refundRecordId: refundRecord.id,
          reason,
        },
      });

      // Update refund record with Stripe ID and status
      await prisma.refund.update({
        where: { id: refundRecord.id },
        data: {
          stripeRefundId: refund.id,
          status: 'PROCESSING',
        },
      });

      logger.info(`Stripe refund initiated: ${refund.id}`);
      
      // Emit socket event for real-time update
      emitRefundUpdate(booking.clientId, {
        type: 'refund_initiated',
        bookingId: booking.id,
        refundId: refund.id,
        amount,
        currency: booking.currency,
        status: 'PROCESSING',
      });

      return { success: true, refundId: refund.id };
    } catch (error: any) {
      logger.error('Stripe refund failed:', error);

      // Mark refund as failed if record was created
      if (refundRecord) {
        await prisma.refund.update({
          where: { id: refundRecord.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: error.message,
          },
        });
      }

      return {
        success: false,
        error: error.message || 'Stripe refund failed',
      };
    }
  }

  /**
   * Process Paystack refund with API integration
   */
  private async processPaystackRefund(
    booking: any,
    amount: number,
    reason: string,
    initiatedBy: string
  ): Promise<{ success: boolean; refundId?: string; error?: string }> {
    let refundRecord: any = null;

    try {
      logger.info(`Processing Paystack refund for booking ${booking.id}: ${amount}`);

      // Create refund record
      refundRecord = await prisma.refund.create({
        data: {
          bookingId: booking.id,
          amount,
          currency: booking.currency,
          reason,
          paymentProvider: 'PAYSTACK',
          status: 'PENDING',
          initiatedBy,
        },
      });

      // Call Paystack Refund API
      const response = await fetch('https://api.paystack.co/refund', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${paymentConfig.paystack.secretKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transaction: booking.paystackReference,
          amount: Math.round(amount * 100), // Convert to kobo/cents
          currency: booking.currency,
          merchant_note: reason,
        }),
      });

      const data = await response.json() as {
        status: boolean;
        message?: string;
        data?: { id?: number | string };
      };

      if (!data.status) {
        throw new Error(data.message || 'Paystack refund failed');
      }

      // Update refund record with Paystack ID
      await prisma.refund.update({
        where: { id: refundRecord.id },
        data: {
          paystackRefundId: data.data?.id?.toString(),
          status: 'PROCESSING',
        },
      });

      logger.info(`Paystack refund initiated: ${data.data?.id}`);

      // Emit socket event
      emitRefundUpdate(booking.clientId, {
        type: 'refund_initiated',
        bookingId: booking.id,
        refundId: data.data?.id?.toString(),
        amount,
        currency: booking.currency,
        status: 'PROCESSING',
      });

      return { success: true, refundId: data.data?.id?.toString() };
    } catch (error: any) {
      logger.error('Paystack refund failed:', error);

      // Mark refund as failed
      if (refundRecord) {
        await prisma.refund.update({
          where: { id: refundRecord.id },
          data: {
            status: 'FAILED',
            failedAt: new Date(),
            failureReason: error.message,
          },
        });
      }

      return {
        success: false,
        error: error.message || 'Paystack refund failed',
      };
    }
  }

  /**
   * Calculate refund amount based on booking status and cancellation policy
   */
  calculateRefundAmount(
    booking: {
      bookingStatus: string;
      depositAmount: number;
      serviceFee: number;
      paymentStatus: string;
    },
    cancelledBy: 'client' | 'provider'
  ): number {
    // Provider cancellation = always full refund
    if (cancelledBy === 'provider') {
      return Number(booking.depositAmount) + Number(booking.serviceFee);
    }

    // Client cancellation depends on booking status
    if (cancelledBy === 'client') {
      // If still PENDING (not confirmed by provider) = full refund
      if (booking.bookingStatus === 'PENDING') {
        return Number(booking.depositAmount) + Number(booking.serviceFee);
      }

      // If CONFIRMED or later = no refund (deposit forfeited)
      if (booking.bookingStatus === 'CONFIRMED' || booking.bookingStatus === 'COMPLETED') {
        return 0;
      }
    }

    return 0;
  }

  /**
   * Get refund status by booking ID
   */
  async getRefundsByBookingId(bookingId: string) {
    return await prisma.refund.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get refund by ID
   */
  async getRefundById(refundId: string) {
    return await prisma.refund.findUnique({
      where: { id: refundId },
      include: {
        booking: {
          include: {
            client: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });
  }
}

export const refundService = new RefundService();
