import { prisma } from '../config/database';
import type { PayoutStatus } from '@prisma/client';
import type {
  FinanceSummary,
  EarningsBreakdown,
  BookingFinancialDetail,
  PayoutHistory,
} from '../../../shared-types';

export class FinanceService {
  /**
   * Get provider's finance summary
   */
  async getFinanceSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<FinanceSummary> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Set default date range if not provided (last 30 days)
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days ago

    // Get all bookings in date range
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        addons: true,
      },
    });

    // Calculate totals
    const totalEarnings = bookings
      .filter((b) => b.bookingStatus === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.servicePrice), 0);

    const totalDepositsReceived = bookings
      .filter((b) => b.paymentStatus !== 'PENDING')
      .reduce((sum, b) => sum + Number(b.depositAmount), 0);

    const balanceOwed = bookings
      .filter((b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'COMPLETED')
      .reduce((sum, b) => sum + (Number(b.servicePrice) - Number(b.depositAmount)), 0);

    const totalServiceFees = bookings.reduce((sum, b) => sum + Number(b.serviceFee), 0);

    // Get monthly bookings (last 30 days)
    const monthStart = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const monthlyBookings = bookings.filter(
      (b) => b.createdAt >= monthStart && b.bookingStatus === 'COMPLETED'
    );

    const monthlyEarnings = monthlyBookings.reduce((sum, b) => sum + Number(b.servicePrice), 0);

    // Get weekly bookings (last 7 days)
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const weeklyBookings = bookings.filter(
      (b) => b.createdAt >= weekStart && b.bookingStatus === 'COMPLETED'
    );

    const weeklyEarnings = weeklyBookings.reduce((sum, b) => sum + Number(b.servicePrice), 0);

    // Get payouts
    const payouts = await prisma.payout.findMany({
      where: {
        providerId: profile.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    const totalPayouts = payouts
      .filter((p) => p.status === 'COMPLETED')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    const pendingPayouts = payouts
      .filter((p) => p.status === 'PENDING' || p.status === 'PROCESSING')
      .reduce((sum, p) => sum + Number(p.amount), 0);

    return {
      totalEarnings,
      monthlyEarnings,
      weeklyEarnings,
      totalDepositsReceived,
      pendingDeposits: 0, // Can be calculated based on pending bookings
      balanceOwed,
      cashCollected: 0, // Will be tracked when cash payments are implemented
      totalServiceFees,
      totalPayouts,
      pendingPayouts,
      totalBookings: bookings.length,
      completedBookings: bookings.filter((b) => b.bookingStatus === 'COMPLETED').length,
      currency: profile.currency,
    };
  }

  /**
   * Get earnings breakdown by date interval
   */
  async getEarningsBreakdown(
    userId: string,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<EarningsBreakdown[]> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Get all bookings in date range
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by interval
    const breakdownMap = new Map<string, EarningsBreakdown>();

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt);
      let key: string;

      if (interval === 'day') {
        key = date.toISOString().split('T')[0]; // YYYY-MM-DD
      } else if (interval === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        // month
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }

      if (!breakdownMap.has(key)) {
        breakdownMap.set(key, {
          date: key,
          earnings: 0,
          bookingCount: 0,
          depositAmount: 0,
          serviceFees: 0,
        });
      }

      const entry = breakdownMap.get(key)!;

      if (booking.bookingStatus === 'COMPLETED') {
        entry.earnings += Number(booking.servicePrice);
      }
      entry.bookingCount += 1;
      entry.depositAmount += Number(booking.depositAmount);
      entry.serviceFees += Number(booking.serviceFee);
    });

    return Array.from(breakdownMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Get payout history
   */
  async getPayoutHistory(
    userId: string,
    page: number = 1,
    limit: number = 20,
    status?: PayoutStatus
  ): Promise<PayoutHistory> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    const where: { providerId: string; status?: PayoutStatus } = {
      providerId: profile.id,
    };

    if (status) {
      where.status = status;
    }

    const [payouts, total] = await Promise.all([
      prisma.payout.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.payout.count({ where }),
    ]);

    return {
      payouts: payouts.map((p) => ({
        id: p.id,
        providerId: p.providerId,
        amount: Number(p.amount),
        currency: p.currency,
        paymentProvider: p.paymentProvider as 'STRIPE' | 'PAYSTACK',
        status: p.status as PayoutStatus,
        paidAt: p.paidAt?.toISOString() || null,
        referenceId: p.referenceId,
        bookingIds: p.bookingIds,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get booking financial details
   */
  async getBookingFinancials(
    userId: string,
    page: number = 1,
    limit: number = 20,
    startDate?: Date,
    endDate?: Date,
    paymentStatus?: string,
    bookingStatus?: string
  ): Promise<{
    bookings: BookingFinancialDetail[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    summary: {
      totalEarnings: number;
      totalDeposits: number;
      totalBalance: number;
      totalServiceFees: number;
    };
  }> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    const where: Record<string, unknown> = {
      providerId: profile.id,
    };

    if (startDate && endDate) {
      where.createdAt = {
        gte: startDate,
        lte: endDate,
      };
    }

    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    if (bookingStatus) {
      where.bookingStatus = bookingStatus;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          client: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          service: {
            select: {
              title: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    const bookingDetails: BookingFinancialDetail[] = bookings.map((b) => ({
      id: b.id,
      bookingDate: b.createdAt.toISOString(),
      clientName: `${b.client.firstName} ${b.client.lastName}`,
      serviceName: b.service.title,
      servicePrice: Number(b.servicePrice),
      depositAmount: Number(b.depositAmount),
      balanceOwed: Number(b.servicePrice) - Number(b.depositAmount),
      serviceFee: Number(b.serviceFee),
      totalAmount: Number(b.totalAmount),
      paymentStatus: b.paymentStatus,
      bookingStatus: b.bookingStatus,
      currency: b.currency,
      paidAt: b.paidAt?.toISOString() || null,
      completedAt: b.completedAt?.toISOString() || null,
    }));

    // Calculate summary
    const summary = {
      totalEarnings: bookings
        .filter((b) => b.bookingStatus === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.servicePrice), 0),
      totalDeposits: bookings.reduce((sum, b) => sum + Number(b.depositAmount), 0),
      totalBalance: bookings.reduce(
        (sum, b) => sum + (Number(b.servicePrice) - Number(b.depositAmount)),
        0
      ),
      totalServiceFees: bookings.reduce((sum, b) => sum + Number(b.serviceFee), 0),
    };

    return {
      bookings: bookingDetails,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      summary,
    };
  }

  /**
   * Create a payout request (platform-wide timing: immediate after completion or 24 hours)
   */
  async createPayout(
    userId: string,
    amount: number,
    bookingIds: string[]
  ): Promise<{
    id: string;
    providerId: string;
    amount: number;
    currency: string;
    paymentProvider: 'STRIPE' | 'PAYSTACK';
    status: PayoutStatus;
    paidAt: string | null;
    referenceId: string | null;
    bookingIds: string[];
    createdAt: string;
    updatedAt: string;
  }> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Verify bookings belong to provider and are completed
    const bookings = await prisma.booking.findMany({
      where: {
        id: { in: bookingIds },
        providerId: profile.id,
        bookingStatus: 'COMPLETED',
      },
    });

    if (bookings.length !== bookingIds.length) {
      throw new Error('Invalid bookings or bookings not completed');
    }

    // Calculate total from bookings
    const calculatedAmount = bookings.reduce((sum, b) => sum + Number(b.servicePrice), 0);

    if (Math.abs(calculatedAmount - amount) > 0.01) {
      throw new Error('Amount mismatch');
    }

    // Create payout record
    const payout = await prisma.payout.create({
      data: {
        providerId: profile.id,
        amount,
        currency: profile.currency,
        paymentProvider: profile.paymentProvider,
        status: 'PENDING',
        bookingIds,
      },
    });

    return {
      id: payout.id,
      providerId: payout.providerId,
      amount: Number(payout.amount),
      currency: payout.currency,
      paymentProvider: payout.paymentProvider as 'STRIPE' | 'PAYSTACK',
      status: payout.status as PayoutStatus,
      paidAt: payout.paidAt?.toISOString() || null,
      referenceId: payout.referenceId,
      bookingIds: payout.bookingIds,
      createdAt: payout.createdAt.toISOString(),
      updatedAt: payout.updatedAt.toISOString(),
    };
  }
}

export const financeService = new FinanceService();
