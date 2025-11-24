/**
 * Analytics Service
 * Handles provider analytics including booking trends, revenue tracking, and performance metrics
 */

import { prisma } from '../config/database';
import type {
  AnalyticsSummary,
  BookingTrend,
  BookingTrendsByDay,
  BookingTrendsByHour,
  ServicePerformance,
  ClientDemographics,
  RevenueBreakdown,
} from '../../../shared-types';

export class AnalyticsService {
  /**
   * Get analytics summary for provider (default: last 30 days)
   */
  async getAnalyticsSummary(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<AnalyticsSummary> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Default to last 30 days
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get previous period for growth comparison
    const periodLength = end.getTime() - start.getTime();
    const previousStart = new Date(start.getTime() - periodLength);
    const previousEnd = new Date(start.getTime() - 1);

    // Get bookings for current period
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Get bookings for previous period (for growth calculation)
    const previousBookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
        createdAt: {
          gte: previousStart,
          lte: previousEnd,
        },
      },
    });

    // Calculate booking counts
    const totalBookings = bookings.length;
    const confirmedBookings = bookings.filter(
      (b) => b.bookingStatus === 'CONFIRMED' || b.bookingStatus === 'COMPLETED'
    ).length;
    const completedBookings = bookings.filter((b) => b.bookingStatus === 'COMPLETED').length;
    const cancelledBookings = bookings.filter(
      (b) =>
        b.bookingStatus === 'CANCELLED_BY_CLIENT' || b.bookingStatus === 'CANCELLED_BY_PROVIDER'
    ).length;
    const noShowBookings = bookings.filter((b) => b.bookingStatus === 'NO_SHOW').length;

    // Calculate revenue
    const totalRevenue = bookings
      .filter((b) => b.bookingStatus === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.servicePrice), 0);

    const previousRevenue = previousBookings
      .filter((b) => b.bookingStatus === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.servicePrice), 0);

    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    const monthOverMonthGrowth =
      previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

    // Client metrics
    const uniqueClientIds = new Set(bookings.map((b) => b.clientId));
    const totalClients = uniqueClientIds.size;

    // Get new clients (first booking in this period)
    const clientFirstBookings = await prisma.booking.groupBy({
      by: ['clientId'],
      where: {
        providerId: profile.id,
      },
      _min: {
        createdAt: true,
      },
    });

    const newClientIds = clientFirstBookings
      .filter((c) => {
        const firstBooking = c._min.createdAt;
        return firstBooking && firstBooking >= start && firstBooking <= end;
      })
      .map((c) => c.clientId);

    const newClients = newClientIds.length;
    const returningClients = totalClients - newClients;
    const clientRetentionRate = totalClients > 0 ? (returningClients / totalClients) * 100 : 0;

    // Get profile views (from schema field)
    const profileViews = profile.profileViews || 0;
    const conversionRate = profileViews > 0 ? (totalBookings / profileViews) * 100 : 0;

    // Find top service
    const serviceBookingCounts = await prisma.booking.groupBy({
      by: ['serviceId'],
      where: {
        providerId: profile.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 1,
    });

    let topService = null;
    if (serviceBookingCounts.length > 0) {
      const topServiceData = await prisma.service.findUnique({
        where: { id: serviceBookingCounts[0].serviceId },
        select: {
          id: true,
          title: true,
        },
      });

      if (topServiceData) {
        topService = {
          id: topServiceData.id,
          title: topServiceData.title,
          bookingCount: serviceBookingCounts[0]._count.id,
        };
      }
    }

    return {
      dateRange: {
        startDate: start.toISOString(),
        endDate: end.toISOString(),
      },
      totalBookings,
      confirmedBookings,
      completedBookings,
      cancelledBookings,
      noShowBookings,
      totalRevenue,
      averageBookingValue,
      monthOverMonthGrowth,
      totalClients,
      newClients,
      returningClients,
      clientRetentionRate,
      averageRating: Number(profile.averageRating),
      totalReviews: profile.totalReviews,
      profileViews,
      conversionRate,
      topService,
    };
  }

  /**
   * Get booking trends over time
   */
  async getBookingTrends(
    userId: string,
    startDate: Date,
    endDate: Date,
    interval: 'day' | 'week' | 'month' = 'day'
  ): Promise<{
    trends: BookingTrend[];
    byDay: BookingTrendsByDay[];
    byHour: BookingTrendsByHour[];
  }> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

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

    // Group by interval for trends
    const trendsMap = new Map<string, BookingTrend>();

    bookings.forEach((booking) => {
      const date = new Date(booking.createdAt);
      let key: string;

      if (interval === 'day') {
        key = date.toISOString().split('T')[0];
      } else if (interval === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`;
      }

      if (!trendsMap.has(key)) {
        trendsMap.set(key, {
          date: key,
          bookingCount: 0,
          revenue: 0,
          confirmedCount: 0,
          completedCount: 0,
          cancelledCount: 0,
        });
      }

      const trend = trendsMap.get(key)!;
      trend.bookingCount += 1;

      if (booking.bookingStatus === 'COMPLETED') {
        trend.revenue += Number(booking.servicePrice);
        trend.completedCount += 1;
      }

      if (booking.bookingStatus === 'CONFIRMED') {
        trend.confirmedCount += 1;
      }

      if (
        booking.bookingStatus === 'CANCELLED_BY_CLIENT' ||
        booking.bookingStatus === 'CANCELLED_BY_PROVIDER'
      ) {
        trend.cancelledCount += 1;
      }
    });

    const trends = Array.from(trendsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Group by day of week
    const byDayMap = new Map<number, { count: number; revenue: number }>();
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    bookings.forEach((booking) => {
      const dayOfWeek = new Date(booking.createdAt).getDay();
      if (!byDayMap.has(dayOfWeek)) {
        byDayMap.set(dayOfWeek, { count: 0, revenue: 0 });
      }
      const dayData = byDayMap.get(dayOfWeek)!;
      dayData.count += 1;
      if (booking.bookingStatus === 'COMPLETED') {
        dayData.revenue += Number(booking.servicePrice);
      }
    });

    const byDay: BookingTrendsByDay[] = Array.from({ length: 7 }, (_, i) => {
      const data = byDayMap.get(i) || { count: 0, revenue: 0 };
      return {
        dayOfWeek: i,
        dayName: dayNames[i],
        bookingCount: data.count,
        averageRevenue: data.count > 0 ? data.revenue / data.count : 0,
      };
    });

    // Group by hour of day
    const byHourMap = new Map<number, number>();

    bookings.forEach((booking) => {
      const hour = parseInt(booking.appointmentTime.split(':')[0]);
      byHourMap.set(hour, (byHourMap.get(hour) || 0) + 1);
    });

    const byHour: BookingTrendsByHour[] = Array.from({ length: 24 }, (_, i) => ({
      hour: i,
      bookingCount: byHourMap.get(i) || 0,
      peakDay: null, // Can be enhanced to show which day this hour is most popular
    }));

    return {
      trends,
      byDay,
      byHour,
    };
  }

  /**
   * Get service performance metrics
   */
  async getServicePerformance(
    userId: string,
    startDate?: Date,
    endDate?: Date,
    sortBy: 'bookings' | 'revenue' | 'rating' = 'bookings',
    limit: number = 10
  ): Promise<ServicePerformance[]> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const services = await prisma.service.findMany({
      where: {
        providerId: profile.id,
      },
      include: {
        category: {
          select: { name: true },
        },
        bookings: {
          where: {
            createdAt: {
              gte: start,
              lte: end,
            },
          },
        },
        _count: {
          select: {
            bookings: true,
          },
        },
      },
    });

    const performance: ServicePerformance[] = services.map((service) => {
      const bookingCount = service.bookings.length;
      const revenue = service.bookings
        .filter((b) => b.bookingStatus === 'COMPLETED')
        .reduce((sum, b) => sum + Number(b.servicePrice), 0);

      const averagePrice = bookingCount > 0 ? revenue / bookingCount : Number(service.priceMin);

      // Calculate conversion rate (bookings / views * 100)
      const conversionRate = service.viewCount > 0 ? (bookingCount / service.viewCount) * 100 : 0;

      return {
        id: service.id,
        title: service.title,
        category: service.category.name,
        bookingCount,
        revenue,
        averagePrice,
        averageRating: 0, // Can be calculated from reviews
        reviewCount: 0, // Can be calculated from reviews
        conversionRate,
      };
    });

    // Sort by requested field
    performance.sort((a, b) => {
      if (sortBy === 'bookings') {
        return b.bookingCount - a.bookingCount;
      } else if (sortBy === 'revenue') {
        return b.revenue - a.revenue;
      } else {
        return b.averageRating - a.averageRating;
      }
    });

    return performance.slice(0, limit);
  }

  /**
   * Get client demographics
   */
  async getClientDemographics(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ClientDemographics> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Get bookings in period
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Group by category
    const categoryMap = new Map<string, Set<string>>();
    const totalClients = new Set<string>();

    bookings.forEach((booking) => {
      const category = booking.service.category.name;
      totalClients.add(booking.clientId);

      if (!categoryMap.has(category)) {
        categoryMap.set(category, new Set());
      }
      categoryMap.get(category)!.add(booking.clientId);
    });

    const byCategory = Array.from(categoryMap.entries()).map(([category, clients]) => ({
      category,
      clientCount: clients.size,
      percentage: totalClients.size > 0 ? (clients.size / totalClients.size) * 100 : 0,
    }));

    // New vs returning clients
    const allClientBookings = await prisma.booking.groupBy({
      by: ['clientId'],
      where: {
        providerId: profile.id,
      },
      _min: {
        createdAt: true,
      },
    });

    const newClientIds = allClientBookings
      .filter((c) => {
        const firstBooking = c._min.createdAt;
        return firstBooking && firstBooking >= start && firstBooking <= end;
      })
      .map((c) => c.clientId);

    const newClientsCount = newClientIds.length;
    const returningClientsCount = totalClients.size - newClientsCount;
    const repeatClientRate =
      totalClients.size > 0 ? (returningClientsCount / totalClients.size) * 100 : 0;

    // Top clients
    const clientStats = await prisma.booking.groupBy({
      by: ['clientId'],
      where: {
        providerId: profile.id,
        createdAt: {
          gte: start,
          lte: end,
        },
        bookingStatus: 'COMPLETED',
      },
      _count: {
        id: true,
      },
      _sum: {
        servicePrice: true,
      },
      _max: {
        createdAt: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    const topClientsData = await Promise.all(
      clientStats.map(async (stat) => {
        const client = await prisma.user.findUnique({
          where: { id: stat.clientId },
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        });

        return {
          id: stat.clientId,
          name: client ? `${client.firstName} ${client.lastName}` : 'Unknown',
          bookingCount: stat._count.id,
          totalSpent: Number(stat._sum.servicePrice || 0),
          lastBookingDate: stat._max.createdAt?.toISOString() || '',
        };
      })
    );

    return {
      byCategory,
      newClientsCount,
      returningClientsCount,
      repeatClientRate,
      topClients: topClientsData,
    };
  }

  /**
   * Get revenue breakdown
   */
  async getRevenueBreakdown(
    userId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<RevenueBreakdown> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    const bookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
        createdAt: {
          gte: start,
          lte: end,
        },
      },
      include: {
        service: {
          include: {
            category: true,
          },
        },
      },
    });

    // Calculate totals
    const totalRevenue = bookings
      .filter((b) => b.bookingStatus === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.servicePrice), 0);

    const depositRevenue = bookings.reduce((sum, b) => sum + Number(b.depositAmount), 0);

    const balanceRevenue = bookings
      .filter((b) => b.bookingStatus === 'COMPLETED')
      .reduce((sum, b) => sum + (Number(b.servicePrice) - Number(b.depositAmount)), 0);

    const tipsRevenue = bookings.reduce((sum, b) => sum + Number(b.tipAmount), 0);

    const serviceFeesPaid = bookings.reduce((sum, b) => sum + Number(b.serviceFee), 0);

    // By payment method
    const paymentMethodMap = new Map<string, number>();
    bookings.forEach((booking) => {
      if (booking.paymentMethod) {
        const method = booking.paymentMethod;
        paymentMethodMap.set(
          method,
          (paymentMethodMap.get(method) || 0) + Number(booking.servicePrice)
        );
      }
    });

    const byPaymentMethod = Array.from(paymentMethodMap.entries()).map(([method, amount]) => ({
      method,
      amount,
      percentage: totalRevenue > 0 ? (amount / totalRevenue) * 100 : 0,
    }));

    // By category
    const categoryMap = new Map<string, number>();
    bookings
      .filter((b) => b.bookingStatus === 'COMPLETED')
      .forEach((booking) => {
        const category = booking.service.category.name;
        categoryMap.set(category, (categoryMap.get(category) || 0) + Number(booking.servicePrice));
      });

    const byCategory = Array.from(categoryMap.entries()).map(([category, revenue]) => ({
      category,
      revenue,
      percentage: totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0,
    }));

    return {
      totalRevenue,
      depositRevenue,
      balanceRevenue,
      tipsRevenue,
      serviceFeesPaid,
      byPaymentMethod,
      byCategory,
    };
  }
}

export const analyticsService = new AnalyticsService();
