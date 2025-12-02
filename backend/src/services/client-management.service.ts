/**
 * Client Management Service
 * Handles provider's client management including profiles, notes, and history
 */

import { prisma } from '../config/database';
import type { ClientProfile, ClientWithNotes, ClientNote } from '../../../shared-types';

export class ClientManagementService {
  /**
   * Get all clients for a provider
   * FIXED: Now uses proper database-level aggregation and sorts BEFORE pagination
   */
  async getClients(
    userId: string,
    page: number = 1,
    limit: number = 20,
    search?: string,
    sortBy: 'name' | 'bookings' | 'lastBooking' | 'totalSpent' = 'lastBooking',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Promise<{
    clients: ClientProfile[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Step 1: Use Prisma groupBy to aggregate booking statistics at database level
    const bookingStats = await prisma.booking.groupBy({
      by: ['clientId'],
      where: {
        providerId: profile.id,
      },
      _count: {
        id: true,
      },
      _sum: {
        servicePrice: true,
      },
      _min: {
        createdAt: true,
      },
      _max: {
        createdAt: true,
      },
    });

    // Step 2: Get completed booking counts separately (groupBy doesn't support conditional aggregation)
    const completedBookingStats = await prisma.booking.groupBy({
      by: ['clientId'],
      where: {
        providerId: profile.id,
        bookingStatus: 'COMPLETED',
      },
      _count: {
        id: true,
      },
      _sum: {
        servicePrice: true,
      },
    });

    // Create a map for completed bookings
    const completedMap = new Map(
      completedBookingStats.map((stat) => [
        stat.clientId,
        {
          count: stat._count.id,
          totalSpent: Number(stat._sum.servicePrice || 0),
        },
      ])
    );

    // Step 3: Build client stats array with all information
    const clientStatsArray = bookingStats.map((stat) => {
      const completed = completedMap.get(stat.clientId) || { count: 0, totalSpent: 0 };
      return {
        clientId: stat.clientId,
        totalBookings: stat._count.id,
        completedBookings: completed.count,
        totalSpent: completed.totalSpent,
        firstBookingDate: stat._min.createdAt!,
        lastBookingDate: stat._max.createdAt!,
      };
    });

    // Step 4: Get all client IDs for search filtering
    const allClientIds = clientStatsArray.map((stat) => stat.clientId);

    // Build where clause for search
    const userWhere: {
      id: { in: string[] };
      OR?: Array<{
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      id: { in: allClientIds },
    };

    if (search) {
      userWhere.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    // Step 5: Fetch all matching users (for sorting by name if needed)
    const allUsers = await prisma.user.findMany({
      where: userWhere,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        hairType: true,
        hairTexture: true,
        hairPreferences: true,
        createdAt: true,
      },
    });

    // Step 6: Create a map of user data for quick lookup
    const userMap = new Map(allUsers.map((user) => [user.id, user]));

    // Step 7: Build complete client profiles with stats
    const allClientProfiles: ClientProfile[] = clientStatsArray
      .filter((stat) => userMap.has(stat.clientId)) // Only include users that match search
      .map((stat) => {
        const user = userMap.get(stat.clientId)!;
        return {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
          avatarUrl: user.avatarUrl,
          hairType: user.hairType,
          hairTexture: user.hairTexture,
          hairPreferences: user.hairPreferences,
          totalBookings: stat.totalBookings,
          completedBookings: stat.completedBookings,
          totalSpent: stat.totalSpent,
          averageRating: null,
          firstBookingDate: stat.firstBookingDate.toISOString(),
          lastBookingDate: stat.lastBookingDate.toISOString(),
          createdAt: user.createdAt.toISOString(),
        };
      });

    // Step 8: Sort ALL clients BEFORE pagination
    allClientProfiles.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'name') {
        compareValue = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortBy === 'bookings') {
        compareValue = a.totalBookings - b.totalBookings;
      } else if (sortBy === 'lastBooking') {
        compareValue =
          new Date(a.lastBookingDate!).getTime() - new Date(b.lastBookingDate!).getTime();
      } else if (sortBy === 'totalSpent') {
        compareValue = a.totalSpent - b.totalSpent;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    // Step 9: Apply pagination AFTER sorting
    const total = allClientProfiles.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedClients = allClientProfiles.slice(startIndex, endIndex);

    return {
      clients: paginatedClients,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Get client detail with notes and history
   */
  async getClientDetail(userId: string, clientId: string): Promise<ClientWithNotes> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    const client = await prisma.user.findUnique({
      where: { id: clientId },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        avatarUrl: true,
        hairType: true,
        hairTexture: true,
        hairPreferences: true,
        createdAt: true,
      },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Get bookings with provider
    const bookings = await prisma.booking.findMany({
      where: {
        clientId,
        providerId: profile.id,
      },
      include: {
        service: {
          select: {
            title: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate statistics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter((b) => b.bookingStatus === 'COMPLETED').length;
    const totalSpent = bookings
      .filter((b) => b.bookingStatus === 'COMPLETED')
      .reduce((sum, b) => sum + Number(b.servicePrice), 0);

    const firstBookingDate = bookings.length > 0 ? bookings[bookings.length - 1].createdAt : null;
    const lastBookingDate = bookings.length > 0 ? bookings[0].createdAt : null;

    // Get notes
    const notes = await prisma.clientNote.findMany({
      where: {
        providerId: profile.id,
        clientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Get recent bookings
    const recentBookings = bookings.slice(0, 5).map((b) => ({
      id: b.id,
      serviceTitle: b.service.title,
      appointmentDate: b.appointmentDate.toISOString(),
      status: b.bookingStatus,
      totalAmount: Number(b.totalAmount),
    }));

    return {
      id: client.id,
      firstName: client.firstName,
      lastName: client.lastName,
      email: client.email,
      phone: client.phone,
      avatarUrl: client.avatarUrl,
      hairType: client.hairType,
      hairTexture: client.hairTexture,
      hairPreferences: client.hairPreferences,
      totalBookings,
      completedBookings,
      totalSpent,
      averageRating: null,
      firstBookingDate: firstBookingDate?.toISOString() || null,
      lastBookingDate: lastBookingDate?.toISOString() || null,
      createdAt: client.createdAt.toISOString(),
      notes: notes.map((n) => ({
        id: n.id,
        note: n.note,
        createdAt: n.createdAt.toISOString(),
        updatedAt: n.updatedAt.toISOString(),
      })),
      recentBookings,
    };
  }

  /**
   * Create client note
   */
  async createNote(userId: string, clientId: string, note: string): Promise<ClientNote> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Verify client exists and has bookings with provider
    const hasBooking = await prisma.booking.findFirst({
      where: {
        clientId,
        providerId: profile.id,
      },
    });

    if (!hasBooking) {
      throw new Error('Client not found or no bookings with this provider');
    }

    const created = await prisma.clientNote.create({
      data: {
        providerId: profile.id,
        clientId,
        note,
      },
    });

    return {
      id: created.id,
      note: created.note,
      createdAt: created.createdAt.toISOString(),
      updatedAt: created.updatedAt.toISOString(),
    };
  }

  /**
   * Update client note
   */
  async updateNote(userId: string, noteId: string, note: string): Promise<ClientNote> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Verify note belongs to provider
    const existingNote = await prisma.clientNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote || existingNote.providerId !== profile.id) {
      throw new Error('Note not found or access denied');
    }

    const updated = await prisma.clientNote.update({
      where: { id: noteId },
      data: { note },
    });

    return {
      id: updated.id,
      note: updated.note,
      createdAt: updated.createdAt.toISOString(),
      updatedAt: updated.updatedAt.toISOString(),
    };
  }

  /**
   * Delete client note
   */
  async deleteNote(userId: string, noteId: string): Promise<void> {
    const profile = await prisma.providerProfile.findUnique({
      where: { userId },
    });

    if (!profile) {
      throw new Error('Provider profile not found');
    }

    // Verify note belongs to provider
    const existingNote = await prisma.clientNote.findUnique({
      where: { id: noteId },
    });

    if (!existingNote || existingNote.providerId !== profile.id) {
      throw new Error('Note not found or access denied');
    }

    await prisma.clientNote.delete({
      where: { id: noteId },
    });
  }
}

export const clientManagementService = new ClientManagementService();
