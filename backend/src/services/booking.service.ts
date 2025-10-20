/**
 * Booking Service
 * Handles booking creation, updates, and management with team member support
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { calculateServiceFee } from '../lib/payment';
import type {
  CreateBookingRequest,
  UpdateBookingRequest,
  CancelBookingRequest,
  CompleteBookingRequest,
  AssignTeamMemberRequest,
} from '../../../shared-types';
import type { RegionCode } from '../types/payment.types';

class BookingService {
  /**
   * Create booking with team member assignment support
   */
  async createBooking(userId: string, data: CreateBookingRequest) {
    // Get service with provider info
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
      include: {
        provider: {
          select: {
            id: true,
            isSalon: true,
            teamMemberLimit: true,
            regionCode: true,
            currency: true,
            paymentProvider: true,
          },
        },
        category: {
          select: { name: true },
        },
      },
    });

    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    if (!service.active) {
      throw new AppError(400, 'Service is not available for booking');
    }

    // Calculate pricing
    const servicePrice = Number(service.priceMin);
    const depositAmount =
      service.depositType === 'PERCENTAGE'
        ? (servicePrice * Number(service.depositAmount)) / 100
        : Number(service.depositAmount);

    const serviceFee = calculateServiceFee(servicePrice, service.provider.regionCode as RegionCode);
    const totalAmount = depositAmount + serviceFee;

    // Handle team member assignment for salon bookings
    let assignedTeamMemberId: string | null = null;
    let anyAvailableStylist = false;

    if (service.provider.isSalon) {
      if (data.anyAvailableStylist) {
        // Client selected "any available stylist"
        anyAvailableStylist = true;
        // Find available team member for this date/time
        assignedTeamMemberId = await this.findAvailableTeamMember(
          service.provider.id,
          data.appointmentDate,
          data.appointmentTime,
          service.durationMinutes
        );
      } else if (data.assignedTeamMemberId) {
        // Client selected specific team member
        // Verify team member belongs to this salon
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            id: data.assignedTeamMemberId,
            providerId: service.provider.id,
            isActive: true,
          },
        });

        if (!teamMember) {
          throw new AppError(404, 'Selected team member not found or unavailable');
        }

        assignedTeamMemberId = teamMember.id;
      }
      // If neither anyAvailable nor specific member, salon admin will assign later
    }

    // Calculate end time
    const startDate = new Date(`${data.appointmentDate}T${data.appointmentTime}:00`);
    const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);
    const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;

    // Create booking
    const booking = await prisma.booking.create({
      data: {
        clientId: userId,
        providerId: service.provider.id,
        serviceId: service.id,
        assignedTeamMemberId,
        anyAvailableStylist,
        appointmentDate: new Date(data.appointmentDate),
        appointmentTime: data.appointmentTime,
        appointmentEndTime: endTime,
        servicePrice,
        depositAmount,
        serviceFee,
        totalAmount,
        currency: service.provider.currency,
        paymentProvider: service.provider.paymentProvider,
        bookingStatus: 'PENDING',
        paymentStatus: 'PENDING',
        bookingType: 'instant', // TODO: Check provider settings
        specialRequests: data.specialRequests || null,
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            category: {
              select: { name: true },
            },
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            businessPhone: true,
            addressLine1: true,
            city: true,
            state: true,
            isSalon: true,
          },
        },
        assignedTeamMember: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            specializations: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    return booking;
  }

  /**
   * Find available team member for auto-assignment
   */
  private async findAvailableTeamMember(
    salonId: string,
    date: string,
    time: string,
    durationMinutes: number
  ): Promise<string | null> {
    const appointmentDate = new Date(date);

    // Get active team members for this salon
    const teamMembers = await prisma.teamMember.findMany({
      where: {
        providerId: salonId,
        isActive: true,
      },
      include: {
        bookings: {
          where: {
            appointmentDate,
            bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
          },
        },
      },
    });

    // Find team member with no conflicting bookings
    for (const member of teamMembers) {
      const hasConflict = member.bookings.some((booking) => {
        // Check if times overlap
        const bookingStart = booking.appointmentTime;
        const bookingEnd = booking.appointmentEndTime;

        return this.timesOverlap(
          time,
          this.addMinutes(time, durationMinutes),
          bookingStart,
          bookingEnd
        );
      });

      if (!hasConflict) {
        return member.id;
      }
    }

    // No available team member found
    return null;
  }

  /**
   * Check if two time ranges overlap
   */
  private timesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  /**
   * Add minutes to time string
   */
  private addMinutes(time: string, minutes: number): string {
    const [hours, mins] = time.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, mins + minutes);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  }

  /**
   * Get booking by ID
   */
  async getBooking(userId: string, bookingId: string, userRole: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            category: {
              select: { name: true },
            },
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            businessPhone: true,
            addressLine1: true,
            city: true,
            state: true,
            isSalon: true,
          },
        },
        assignedTeamMember: {
          select: {
            id: true,
            displayName: true,
            avatarUrl: true,
            specializations: true,
          },
        },
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Verify access
    if (userRole === 'CLIENT' && booking.clientId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    if (userRole === 'PROVIDER') {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId },
      });

      if (!profile || booking.providerId !== profile.id) {
        // Check if user is assigned team member
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            providerId: booking.providerId,
            isActive: true,
          },
        });

        if (!teamMember || booking.assignedTeamMemberId !== teamMember.id) {
          throw new AppError(403, 'Access denied');
        }
      }
    }

    return booking;
  }

  /**
   * List bookings for user
   */
  async listBookings(userId: string, userRole: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const where: {
      clientId?: string;
      providerId?: string;
      assignedTeamMemberId?: string;
    } = {};

    if (userRole === 'CLIENT') {
      where.clientId = userId;
    } else if (userRole === 'PROVIDER') {
      const profile = await prisma.providerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!profile) {
        throw new AppError(404, 'Provider profile not found');
      }

      // Provider - show all bookings for their business
      where.providerId = profile.id;
    }

    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where,
        include: {
          service: {
            select: {
              id: true,
              title: true,
              durationMinutes: true,
              category: {
                select: { name: true },
              },
            },
          },
          provider: {
            select: {
              id: true,
              businessName: true,
              businessPhone: true,
              city: true,
              state: true,
              isSalon: true,
            },
          },
          assignedTeamMember: {
            select: {
              id: true,
              displayName: true,
              avatarUrl: true,
              specializations: true,
            },
          },
          client: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
        },
        orderBy: { appointmentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    return {
      bookings,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update booking (including team member reassignment)
   */
  async updateBooking(userId: string, bookingId: string, data: UpdateBookingRequest) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: {
          select: {
            userId: true,
            isSalon: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Verify access (provider or salon admin only)
    if (booking.provider.userId !== userId) {
      throw new AppError(403, 'Only the provider can update bookings');
    }

    // If reassigning team member, verify they exist and are active
    if (data.assignedTeamMemberId) {
      const teamMember = await prisma.teamMember.findFirst({
        where: {
          id: data.assignedTeamMemberId,
          providerId: booking.providerId,
          isActive: true,
        },
      });

      if (!teamMember) {
        throw new AppError(404, 'Team member not found or inactive');
      }
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(data.appointmentDate && { appointmentDate: new Date(data.appointmentDate) }),
        ...(data.appointmentTime && { appointmentTime: data.appointmentTime }),
        ...(data.appointmentEndTime && { appointmentEndTime: data.appointmentEndTime }),
        ...(data.specialRequests !== undefined && { specialRequests: data.specialRequests }),
        ...(data.internalNotes !== undefined && { internalNotes: data.internalNotes }),
        ...(data.assignedTeamMemberId !== undefined && {
          assignedTeamMemberId: data.assignedTeamMemberId,
        }),
        updatedAt: new Date(),
      },
      include: {
        service: true,
        provider: true,
        assignedTeamMember: true,
        client: true,
      },
    });

    return updated;
  }

  /**
   * Assign team member to booking (salon admin)
   */
  async assignTeamMember(userId: string, bookingId: string, data: AssignTeamMemberRequest) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: {
          select: {
            userId: true,
            isSalon: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Only salon owner can assign
    if (booking.provider.userId !== userId) {
      throw new AppError(403, 'Only salon owner can assign team members');
    }

    if (!booking.provider.isSalon) {
      throw new AppError(400, 'Team member assignment only available for salon accounts');
    }

    // Verify team member
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        id: data.teamMemberId,
        providerId: booking.providerId,
        isActive: true,
      },
    });

    if (!teamMember) {
      throw new AppError(404, 'Team member not found or inactive');
    }

    // Check for conflicts
    const hasConflict = await this.checkTeamMemberConflict(
      data.teamMemberId,
      booking.appointmentDate.toISOString().split('T')[0],
      booking.appointmentTime,
      booking.appointmentEndTime
    );

    if (hasConflict) {
      throw new AppError(400, 'Team member has a conflicting booking at this time');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        assignedTeamMemberId: data.teamMemberId,
        anyAvailableStylist: false,
        updatedAt: new Date(),
      },
      include: {
        service: true,
        provider: true,
        assignedTeamMember: true,
        client: true,
      },
    });

    return updated;
  }

  /**
   * Check if team member has conflicting booking
   */
  private async checkTeamMemberConflict(
    teamMemberId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Promise<boolean> {
    const conflicts = await prisma.booking.findMany({
      where: {
        assignedTeamMemberId: teamMemberId,
        appointmentDate: new Date(date),
        bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    return conflicts.some((booking) => {
      return this.timesOverlap(
        startTime,
        endTime,
        booking.appointmentTime,
        booking.appointmentEndTime
      );
    });
  }

  /**
   * Get available team members for a booking slot
   */
  async getAvailableStylists(
    providerId: string,
    date: string,
    time: string,
    durationMinutes: number
  ) {
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      select: { isSalon: true },
    });

    if (!provider || !provider.isSalon) {
      throw new AppError(400, 'This feature is only for salon accounts');
    }

    const endTime = this.addMinutes(time, durationMinutes);
    const appointmentDate = new Date(date);

    const teamMembers = await prisma.teamMember.findMany({
      where: {
        providerId: providerId,
        isActive: true,
      },
      include: {
        bookings: {
          where: {
            appointmentDate,
            bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
          },
        },
      },
    });

    const stylists = teamMembers.map((member) => {
      const hasConflict = member.bookings.some((booking) => {
        return this.timesOverlap(
          time,
          endTime,
          booking.appointmentTime,
          booking.appointmentEndTime
        );
      });

      return {
        id: member.id,
        displayName: member.displayName,
        avatarUrl: member.avatarUrl,
        specializations: member.specializations,
        isAvailable: !hasConflict,
        nextAvailableSlot: null, // TODO: Calculate next available slot
      };
    });

    return stylists;
  }

  /**
   * Cancel booking
   */
  async cancelBooking(userId: string, bookingId: string, data: CancelBookingRequest) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Verify access
    if (data.cancelledBy === 'client' && booking.clientId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    if (data.cancelledBy === 'provider' && booking.provider.userId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus:
          data.cancelledBy === 'client' ? 'CANCELLED_BY_CLIENT' : 'CANCELLED_BY_PROVIDER',
        cancelledAt: new Date(),
        cancellationReason: data.reason || null,
        updatedAt: new Date(),
      },
      include: {
        service: true,
        provider: true,
        assignedTeamMember: true,
        client: true,
      },
    });

    return updated;
  }

  /**
   * Complete booking
   */
  async completeBooking(userId: string, bookingId: string, data: CompleteBookingRequest) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Only provider can complete
    if (booking.provider.userId !== userId) {
      throw new AppError(403, 'Only the provider can complete bookings');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'COMPLETED',
        tipAmount: data.tipAmount || 0,
        internalNotes: data.notes || null,
        updatedAt: new Date(),
      },
      include: {
        service: true,
        provider: true,
        assignedTeamMember: true,
        client: true,
      },
    });

    return updated;
  }
}

export const bookingService = new BookingService();
