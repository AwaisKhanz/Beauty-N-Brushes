/**
 * Client Management Service
 * Handles provider's client management including profiles, notes, and history
 */

import { prisma } from '../config/database';
import type { ClientProfile, ClientWithNotes, ClientNote } from '../../../shared-types';

export class ClientManagementService {
  /**
   * Get all clients for a provider
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

    // Get unique client IDs from bookings
    const bookings = await prisma.booking.findMany({
      where: {
        providerId: profile.id,
      },
      select: {
        clientId: true,
        bookingStatus: true,
        servicePrice: true,
        appointmentDate: true,
        createdAt: true,
      },
    });

    // Group by client
    const clientMap = new Map<
      string,
      {
        totalBookings: number;
        completedBookings: number;
        totalSpent: number;
        firstBookingDate: Date;
        lastBookingDate: Date;
      }
    >();

    bookings.forEach((booking) => {
      if (!clientMap.has(booking.clientId)) {
        clientMap.set(booking.clientId, {
          totalBookings: 0,
          completedBookings: 0,
          totalSpent: 0,
          firstBookingDate: booking.createdAt,
          lastBookingDate: booking.createdAt,
        });
      }

      const clientData = clientMap.get(booking.clientId)!;
      clientData.totalBookings += 1;

      if (booking.bookingStatus === 'COMPLETED') {
        clientData.completedBookings += 1;
        clientData.totalSpent += Number(booking.servicePrice);
      }

      if (booking.createdAt < clientData.firstBookingDate) {
        clientData.firstBookingDate = booking.createdAt;
      }

      if (booking.createdAt > clientData.lastBookingDate) {
        clientData.lastBookingDate = booking.createdAt;
      }
    });

    const clientIds = Array.from(clientMap.keys());

    // Build where clause for search
    const where: {
      id: { in: string[] };
      OR?: Array<{
        firstName?: { contains: string; mode: 'insensitive' };
        lastName?: { contains: string; mode: 'insensitive' };
        email?: { contains: string; mode: 'insensitive' };
      }>;
    } = {
      id: { in: clientIds },
    };

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [clients, total] = await Promise.all([
      prisma.user.findMany({
        where,
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
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.user.count({ where }),
    ]);

    // Map to ClientProfile with statistics
    const clientProfiles: ClientProfile[] = clients.map((client) => {
      const stats = clientMap.get(client.id)!;

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
        totalBookings: stats.totalBookings,
        completedBookings: stats.completedBookings,
        totalSpent: stats.totalSpent,
        averageRating: null, // Can be calculated from reviews if needed
        firstBookingDate: stats.firstBookingDate.toISOString(),
        lastBookingDate: stats.lastBookingDate.toISOString(),
        createdAt: client.createdAt.toISOString(),
      };
    });

    // Sort clients
    clientProfiles.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'name') {
        compareValue = `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      } else if (sortBy === 'bookings') {
        compareValue = b.totalBookings - a.totalBookings;
      } else if (sortBy === 'lastBooking') {
        compareValue =
          new Date(b.lastBookingDate!).getTime() - new Date(a.lastBookingDate!).getTime();
      } else if (sortBy === 'totalSpent') {
        compareValue = b.totalSpent - a.totalSpent;
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return {
      clients: clientProfiles,
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
