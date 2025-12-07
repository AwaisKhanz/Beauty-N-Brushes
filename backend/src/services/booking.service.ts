/**
 * Booking Service
 * Handles booking creation, updates, and management with team member support
 */

import { prisma } from '../config/database';
import { AppError } from '../middleware/errorHandler';
import { calculateServiceFee } from '../lib/payment';
import { emailService } from '../lib/email';
import { env } from '../config/env';
import { calendarSyncService } from './calendar-sync.service';
import { notificationService } from './notification.service';
import { emitBookingUpdate } from '../config/socket.server';
import { refundService } from './refund.service';
import { format } from 'date-fns';
import type {
  CreateBookingRequest,
  UpdateBookingRequest,
  CancelBookingRequest,
  RescheduleBookingRequest,
  CompleteBookingRequest,
  AssignTeamMemberRequest,
  BookingDetails,
  RequestRescheduleRequest,
  RespondToRescheduleRequest,
} from '../../../shared-types';
import type { RegionCode } from '../types/payment.types';
import type { Currency } from '../../../shared-constants/region.constants';
import { exchangeRateService } from '../lib/exchange-rate.service';

class BookingService {
  /**
   * Create a new booking
   * @param userId - Client user ID
   * @param data - Booking data
   * @param clientRegion - Client's region detected by middleware (server-side only)
   */
  async createBooking(
    userId: string,
    data: CreateBookingRequest,
    clientRegion?: { regionCode: RegionCode; currency: string; paymentProvider: 'stripe' | 'paystack' }
  ) {
    // Get client info
    const client = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        regionCode: true,
      },
    });

    if (!client) {
      throw new AppError(404, 'Client not found');
    }

    // ✅ SECURITY: Use server-detected region from middleware (NEVER trust frontend)
    // Priority: middleware detection > user saved preference
    const finalRegion = clientRegion?.regionCode || client.regionCode || 'NA';
    
    // ✅ Use payment provider from middleware (already determined by region)
    const paymentProvider = clientRegion?.paymentProvider === 'stripe' ? 'STRIPE' : 'PAYSTACK';
    const clientCurrency = clientRegion?.currency || 'USD';
    
    // Get service with provider info and addons
    const service = await prisma.service.findUnique({
      where: { id: data.serviceId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
            currency: true,
            instantBookingEnabled: true,
            isSalon: true,
            regionCode: true,
          },
        },
        addons: true,
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

    // ✅ CURRENCY CONVERSION: Convert USD prices to client's regional currency using LIVE rates
    // Services are stored in USD, but clients pay in their local currency (GHS/NGN for Paystack)
    const targetCurrency = clientCurrency as Currency;
    
    // Calculate base service price in USD first
    const servicePriceUSD = Number(service.priceMin);
    
    // Convert service price to client's currency using live exchange rates
    const servicePrice = await exchangeRateService.convertCurrency(servicePriceUSD, 'USD', targetCurrency);

    // Calculate add-ons total with currency conversion using live rates
    let addonsTotal = 0;
    const selectedAddons = [];
    if (data.selectedAddonIds && data.selectedAddonIds.length > 0) {
      for (const addonId of data.selectedAddonIds) {
        const addon = service.addons.find((a) => a.id === addonId && a.isActive);
        if (addon) {
          selectedAddons.push(addon);
          // Convert addon price from USD to client's currency using live rates
          const addonPriceUSD = Number(addon.addonPrice);
          const addonPrice = await exchangeRateService.convertCurrency(addonPriceUSD, 'USD', targetCurrency);
          addonsTotal += addonPrice;
        }
      }
    }

    // Calculate home service fee with currency conversion using live rates
    let homeServiceFee = 0;
    if (data.homeServiceRequested && service.mobileServiceAvailable && service.homeServiceFee) {
      const homeServiceFeeUSD = Number(service.homeServiceFee);
      homeServiceFee = await exchangeRateService.convertCurrency(homeServiceFeeUSD, 'USD', targetCurrency);
    }

    // TOTAL BOOKING AMOUNT = service + add-ons + home service fee (in client's currency)
    const totalBookingAmount = servicePrice + addonsTotal + homeServiceFee;

    // ✅ Calculate service fee in USD first (on the USD total), then convert
    let totalUSD = servicePriceUSD;
    
    // Add addon prices in USD
    if (data.selectedAddonIds && data.selectedAddonIds.length > 0) {
      for (const addonId of data.selectedAddonIds) {
        const addon = service.addons.find((a) => a.id === addonId && a.isActive);
        if (addon) {
          totalUSD += Number(addon.addonPrice);
        }
      }
    }
    
    // Add home service fee in USD
    if (data.homeServiceRequested && service.mobileServiceAvailable && service.homeServiceFee) {
      totalUSD += Number(service.homeServiceFee);
    }
    
    // Calculate platform fee on USD total
    const serviceFeeUSD = await calculateServiceFee(totalUSD);
    
    // Convert platform fee to client's currency
    const serviceFee = await exchangeRateService.convertCurrency(serviceFeeUSD, 'USD', targetCurrency);

    // ✅ TOTAL AMOUNT = Service Price + Platform Fee (in client's currency)
    const totalAmount = totalBookingAmount + serviceFee;

    // ✅ Calculate deposit on the SERVICE PRICE (not including platform fee)
    // This ensures deposit percentage is accurate (e.g., 25% of service, not 25% of service+fee)
    let finalDepositAmount: number;
    if (service.depositType === 'PERCENTAGE') {
      // Calculate percentage deposit on SERVICE PRICE (before platform fee)
      finalDepositAmount = (totalBookingAmount * Number(service.depositAmount)) / 100;
    } else {
      // Flat deposit amount - convert from USD to client's currency using live rates
      const depositAmountUSD = Number(service.depositAmount);
      finalDepositAmount = await exchangeRateService.convertCurrency(depositAmountUSD, 'USD', targetCurrency);
    }


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

    // Determine booking type and status based on instant booking setting
    const bookingType = service.provider.instantBookingEnabled ? 'INSTANT' : 'REQUEST';
    const bookingStatus = service.provider.instantBookingEnabled ? 'CONFIRMED' : 'PENDING';

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
        servicePrice: totalBookingAmount, // ✅ Total service + add-ons + home service (NOT including service fee)
        depositAmount: finalDepositAmount,
        serviceFee, // ✅ Fee on total booking amount
        totalAmount, // ✅ Service Price + Platform Fee (FULL booking cost)
        currency: clientCurrency, // Use client's region currency
        paymentProvider: paymentProvider, // ✅ Based on CLIENT's region, not provider's
        clientRegionCode: finalRegion, // ✅ Track server-detected region
        bookingStatus,
        paymentStatus: 'AWAITING_DEPOSIT', // ✅ Clear status: deposit not paid yet
        bookingType,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        specialRequests: data.specialRequests || null,
        referencePhotoUrls: data.referencePhotoUrls || [],
        // Home service tracking
        homeServiceRequested: data.homeServiceRequested || false,
        homeServiceFee,
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
            slug: true,
            businessPhone: true,
            city: true,
            state: true,
            isSalon: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
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

    // Create booking add-ons records with converted prices using live rates
    if (selectedAddons.length > 0) {
      const addonDataPromises = selectedAddons.map(async (addon) => {
        const addonPriceUSD = Number(addon.addonPrice);
        const addonPriceConverted = await exchangeRateService.convertCurrency(addonPriceUSD, 'USD', targetCurrency);
        return {
          bookingId: booking.id,
          addonId: addon.id,
          addonName: addon.addonName,
          addonPrice: addonPriceConverted, // Store converted price
        };
      });
      
      const addonData = await Promise.all(addonDataPromises);
      
      await prisma.bookingAddon.createMany({
        data: addonData,
      });
    }

    // Send booking confirmation email
    try {
      const appointmentDateTime = new Date(`${data.appointmentDate}T${data.appointmentTime}`);
      const formattedDateTime = appointmentDateTime.toLocaleString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      await emailService.sendBookingConfirmationEmail(booking.client.email, {
        clientName: `${booking.client.firstName} ${booking.client.lastName}`,
        serviceName: booking.service.title,
        providerName:
          booking.provider.businessName ||
          `${booking.provider.user.firstName} ${booking.provider.user.lastName}`,
        appointmentDateTime: formattedDateTime,
        duration: `${service.durationMinutes} minutes`,
        location: `${booking.provider.locations[0]?.addressLine1 || ''}, ${booking.provider.city}, ${booking.provider.state}`,
        totalAmount: `${booking.currency} ${totalBookingAmount.toFixed(2)}`,
        cancellationPolicy: "Please review the provider's cancellation policy",
        bookingDetailsUrl: `${env.FRONTEND_URL}/client/bookings/${booking.id}`,
      });
    } catch (emailError) {
      // Don't fail booking if email fails
      console.error('Failed to send booking confirmation email:', emailError);
    }

    // Sync to Google Calendar if provider has it connected
    try {
      const startDate = new Date(`${data.appointmentDate}T${data.appointmentTime}:00`);
      const endDate = new Date(startDate.getTime() + service.durationMinutes * 60000);

      const calendarEventId = await calendarSyncService.syncBookingToCalendar(
        {
          bookingId: booking.id,
          title: `${booking.service.title} - ${booking.client.firstName} ${booking.client.lastName}`,
          description: `Client: ${booking.client.firstName} ${booking.client.lastName}\nEmail: ${booking.client.email}\nPhone: ${booking.contactPhone}\nService: ${booking.service.title}\nPrice: ${booking.currency} ${totalBookingAmount.toFixed(2)}\n\nSpecial Requests: ${data.specialRequests || 'None'}`,
          startTime: startDate,
          endTime: endDate,
          clientEmail: booking.client.email,
          clientName: `${booking.client.firstName} ${booking.client.lastName}`,
          location: `${booking.provider.locations[0]?.addressLine1 || ''}, ${booking.provider.city}, ${booking.provider.state}`,
        },
        service.provider.id
      );

      // Update booking with calendar event ID
      if (calendarEventId) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { googleCalendarEventId: calendarEventId },
        });
      }
    } catch (calendarError) {
      // Don't fail booking if calendar sync fails
      console.error('Failed to sync booking to Google Calendar:', calendarError);
    }

    // Send notification to provider about new booking
    try {
      const clientName = `${booking.client.firstName} ${booking.client.lastName}`;
      const providerUserId = await prisma.providerProfile.findUnique({
        where: { id: booking.providerId },
        select: { userId: true },
      });

      if (providerUserId) {
        await notificationService.createBookingCreatedNotification(
          providerUserId.userId,
          clientName,
          booking.service.title,
          format(new Date(data.appointmentDate), 'MMM dd, yyyy'),
          data.appointmentTime,
          booking.id
        );

        // Emit Socket.IO event for real-time update
        emitBookingUpdate(providerUserId.userId, {
          type: 'booking_created',
          booking: {
            id: booking.id,
            clientName,
            serviceName: booking.service.title,
            appointmentDate: data.appointmentDate,
            appointmentTime: data.appointmentTime,
            status: bookingStatus,
          },
        });
      }
    } catch (notificationError) {
      // Don't fail booking if notification fails
      console.error('Failed to send booking notification:', notificationError);
    }

    return booking;
  }

  async getBookingRefunds(bookingId: string, userId: string): Promise<any[]> {
    // Verify user has access to this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      select: {
        id: true,
        clientId: true,
        providerId: true,
      },
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    // Check if user is client or provider
    if (booking.clientId !== userId && booking.providerId !== userId) {
      throw new Error('Access denied');
    }

    // Fetch refunds for this booking
    const refunds = await prisma.refund.findMany({
      where: { bookingId },
      orderBy: { createdAt: 'desc' },
    });

    return refunds;
  }

  /**
   * Confirm a booking (Provider only)
   */
  async confirmBooking(userId: string, bookingId: string): Promise<BookingDetails> {
    // Verify user is provider and owns this booking
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          include: {
            provider: {
              include: {
                user: true,
              },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.service.provider.userId !== userId) {
      throw new AppError(403, 'Not authorized to confirm this booking');
    }

    if (booking.bookingStatus !== 'PENDING') {
      throw new AppError(400, 'Only pending bookings can be confirmed');
    }

    // Update booking status
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'CONFIRMED',
        updatedAt: new Date(),
      },
      include: {
        client: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        service: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
            provider: {
              select: {
                id: true,
                businessName: true,
                city: true,
                state: true,
                isSalon: true,
                locations: {
                  where: { isPrimary: true, isActive: true },
                  take: 1,
                },
              },
            },
          },
        },
        addons: true,
      },
    });

    // Send confirmation email to client
    await emailService.sendBookingConfirmationEmail(updatedBooking.client.email, {
      clientName: `${updatedBooking.client.firstName} ${updatedBooking.client.lastName}`,
      serviceName: updatedBooking.service.title,
      providerName: updatedBooking.service.provider.businessName,
      appointmentDateTime: `${updatedBooking.appointmentDate.toLocaleDateString()} at ${updatedBooking.appointmentTime}`,
      duration: `${updatedBooking.service.durationMinutes || 60} minutes`,
      location: `${updatedBooking.service.provider.locations[0]?.addressLine1 || ''}, ${updatedBooking.service.provider.city}, ${updatedBooking.service.provider.state}`,
      totalAmount: `${updatedBooking.currency} ${updatedBooking.servicePrice.toString()}`,
      cancellationPolicy: "Please review the provider's cancellation policy",
      bookingDetailsUrl: `${env.FRONTEND_URL}/client/bookings/${updatedBooking.id}`,
    });

    // Send notification to client about booking confirmation
    try {
      await notificationService.createBookingConfirmedNotification(
        updatedBooking.client.id,
        updatedBooking.service.provider.businessName,
        format(updatedBooking.appointmentDate, 'MMM dd, yyyy'),
        updatedBooking.appointmentTime,
        updatedBooking.id
      );

      // Emit Socket.IO event for real-time update
      emitBookingUpdate(updatedBooking.client.id, {
        type: 'booking_confirmed',
        booking: {
          id: updatedBooking.id,
          providerName: updatedBooking.service.provider.businessName,
          serviceName: updatedBooking.service.title,
          appointmentDate: updatedBooking.appointmentDate.toISOString(),
          appointmentTime: updatedBooking.appointmentTime,
          status: 'CONFIRMED',
        },
      });
    } catch (notificationError) {
      console.error('Failed to send confirmation notification:', notificationError);
    }

    return updatedBooking as unknown as BookingDetails;
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
   * Determine payment provider based on region
   */
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
            slug: true,
            businessPhone: true,
            city: true,
            state: true,
            isSalon: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
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
        addons: true, // ✅ ADD THIS - Include booking add-ons
        photos: true, // Include booking photos
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

      // Hide client phone until booking is confirmed (Requirements Line 502)
      if (booking.bookingStatus === 'PENDING') {
        return {
          ...booking,
          contactPhone: null,
        };
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
          addons: true, // ✅ ADD THIS
        },
        orderBy: { appointmentDate: 'desc' },
        skip,
        take: limit,
      }),
      prisma.booking.count({ where }),
    ]);

    // Hide client phone for providers when booking is PENDING (Requirements Line 502)
    const processedBookings =
      userRole === 'PROVIDER'
        ? bookings.map((booking) => ({
            ...booking,
            contactPhone: booking.bookingStatus === 'PENDING' ? null : booking.contactPhone,
          }))
        : bookings;

    return {
      bookings: processedBookings,
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
        client: true,
      },
    });

    // Notify client about no-show
    try {
      await notificationService.createBookingNoShowNotification(
        updated.clientId,
        updated.provider.businessName || 'Provider',
        updated.id,
        format(updated.appointmentDate, 'MMM dd, yyyy')
      );

      emitBookingUpdate(updated.clientId, {
        type: 'booking_no_show',
        booking: {
          id: updated.id,
          serviceName: updated.service.title,
          appointmentDate: updated.appointmentDate.toISOString(),
        },
      });
    } catch (err) {
      console.error('Failed to send no-show notification:', err);
    }

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

    // Send notifications to team member and client
    try {
      const clientName = `${updated.client.firstName} ${updated.client.lastName}`;
      const stylistName = updated.assignedTeamMember?.displayName || 'Team Member';

      // Notify team member about assignment
      const teamMemberUser = await prisma.teamMember.findUnique({
        where: { id: data.teamMemberId },
        select: { userId: true },
      });

      if (teamMemberUser?.userId) {
        await notificationService.createTeamMemberAssignedNotification(
          teamMemberUser.userId,
          clientName,
          updated.id
        );

        emitBookingUpdate(teamMemberUser.userId, {
          type: 'booking_assigned_to_you',
          booking: {
            id: updated.id,
            clientName,
            serviceName: updated.service.title,
            appointmentDate: updated.appointmentDate.toISOString(),
            appointmentTime: updated.appointmentTime,
          },
        });
      }

      // Notify client about stylist assignment
      await notificationService.createStylistAssignedNotification(
        updated.client.id,
        stylistName,
        updated.id
      );

      emitBookingUpdate(updated.client.id, {
        type: 'team_member_assigned',
        booking: {
          id: updated.id,
          stylistName,
          serviceName: updated.service.title,
          appointmentDate: updated.appointmentDate.toISOString(),
          appointmentTime: updated.appointmentTime,
        },
      });
    } catch (notificationError) {
      console.error('Failed to send assignment notifications:', notificationError);
    }

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
   * Get available time slots for a provider/service on a specific date
   * Considers: provider availability, existing bookings, blocked dates, service duration
   */
  async getAvailableSlots(providerId: string, serviceId: string, date: string) {
    // 1. Get provider details and availability settings
    const provider = await prisma.providerProfile.findUnique({
      where: { id: providerId },
      include: {
        availability: true,
      },
    });

    if (!provider) {
      throw new AppError(404, 'Provider not found');
    }

    // 2. Get service duration
    const service = await prisma.service.findUnique({
      where: { id: serviceId },
      select: { durationMinutes: true, bufferTimeMinutes: true },
    });

    if (!service) {
      throw new AppError(404, 'Service not found');
    }

    const totalDuration = service.durationMinutes + (service.bufferTimeMinutes || 0);

    // 3. Check if date is blocked
    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay();

    const isBlocked = await prisma.providerTimeOff.findFirst({
      where: {
        providerId: provider.id,
        startDate: { lte: requestedDate },
        endDate: { gte: requestedDate },
      },
    });

    if (isBlocked) {
      return []; // No slots available on blocked dates
    }

    // 4. Get provider's schedule for this day
    const daySchedule = provider.availability.find((a) => a.dayOfWeek === dayOfWeek);

    if (!daySchedule || !daySchedule.isAvailable) {
      return []; // Provider not working on this day
    }

    // 5. Get existing bookings for this date
    const existingBookings = await prisma.booking.findMany({
      where: {
        providerId: provider.id,
        appointmentDate: requestedDate,
        bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        appointmentTime: true,
        appointmentEndTime: true,
      },
    });

    // 6. Generate time slots
    const slots: Array<{ startTime: string; endTime: string; available: boolean }> = [];
    let currentTime = daySchedule.startTime;
    const endTime = daySchedule.endTime;

    while (this.timeToMinutes(currentTime) + totalDuration <= this.timeToMinutes(endTime)) {
      const slotEndTime = this.addMinutes(currentTime, totalDuration);

      // Check if slot conflicts with existing booking
      const hasConflict = existingBookings.some((booking) =>
        this.timesOverlap(
          currentTime,
          slotEndTime,
          booking.appointmentTime,
          booking.appointmentEndTime
        )
      );

      // Check minimum advance notice
      const slotDateTime = new Date(`${date}T${currentTime}`);
      const now = new Date();
      const hoursUntilSlot = (slotDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
      const meetsMinimumNotice = hoursUntilSlot >= (provider.minAdvanceHours || 24);

      // Check if same-day booking allowed
      const isSameDay = requestedDate.toDateString() === now.toDateString();
      const sameDayAllowed = provider.sameDayBookingEnabled || !isSameDay;

      if (!hasConflict && meetsMinimumNotice && sameDayAllowed) {
        slots.push({
          startTime: currentTime,
          endTime: slotEndTime,
          available: true,
        });
      }

      // Move to next slot (15 min intervals)
      currentTime = this.addMinutes(currentTime, 15);
    }

    return slots;
  }

  /**
   * Helper: Convert time string to minutes
   */
  private timeToMinutes(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
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
   * Cancel booking with proper refund logic
   */
  async cancelBooking(userId: string, bookingId: string, data: CancelBookingRequest) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { 
          select: { 
            userId: true, 
            businessName: true,
            user: { select: { email: true } }
          } 
        },
        client: { select: { id: true, firstName: true, lastName: true, email: true } },
        service: { select: { title: true } },
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

    // Cannot cancel if already cancelled or completed
    if (
      booking.bookingStatus === 'CANCELLED_BY_CLIENT' ||
      booking.bookingStatus === 'CANCELLED_BY_PROVIDER' ||
      booking.bookingStatus === 'COMPLETED'
    ) {
      throw new AppError(400, 'Cannot cancel this booking');
    }

    // ✅ Calculate refund amount based on cancellation policy
    const cancelledBy = data.cancelledBy || 'client'; // Default to client if not specified
    const refundAmount = refundService.calculateRefundAmount(
      {
        bookingStatus: booking.bookingStatus,
        depositAmount: Number(booking.depositAmount),
        serviceFee: Number(booking.serviceFee),
        paymentStatus: booking.paymentStatus,
      },
      cancelledBy
    );

    const shouldRefund = refundAmount > 0 && booking.paymentStatus !== 'AWAITING_DEPOSIT';

    // ✅ Process refund if applicable
    if (shouldRefund) {
      const refundResult = await refundService.processRefund(
        bookingId,
        refundAmount,
        data.reason || `Cancelled by ${cancelledBy}`,
        userId
      );

      if (!refundResult.success) {
        throw new AppError(500, `Refund processing failed: ${refundResult.error}`);
      }
    }

    // Update booking status
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus:
          data.cancelledBy === 'client' ? 'CANCELLED_BY_CLIENT' : 'CANCELLED_BY_PROVIDER',
        cancelledAt: new Date(),
        cancellationReason: data.reason || null,
        paymentStatus: shouldRefund ? 'REFUNDED' : booking.paymentStatus,
        updatedAt: new Date(),
      },
      include: {
        service: true,
        provider: { include: { user: { select: { email: true } } } },
        assignedTeamMember: true,
        client: true,
      },
    });

    // Delete calendar event if it exists
    if (updated.googleCalendarEventId) {
      await calendarSyncService.deleteCalendarEvent(bookingId, updated.providerId);
    }

    // Send notification to the other party about cancellation
    try {
      const isClient = data.cancelledBy === 'client';
      const recipientId = isClient ? booking.provider.userId : booking.clientId;
      const cancellerName = isClient
        ? `${updated.client.firstName} ${updated.client.lastName}`
        : updated.provider.businessName;

      await notificationService.createBookingCancelledNotification(
        recipientId,
        cancellerName,
        format(updated.appointmentDate, 'MMM dd, yyyy'),
        updated.id,
        !isClient // isProvider
      );

      // Emit Socket.IO event for real-time update
      emitBookingUpdate(recipientId, {
        type: 'booking_cancelled',
        booking: {
          id: updated.id,
          cancellerName,
          serviceName: updated.service.title,
          appointmentDate: updated.appointmentDate.toISOString(),
          appointmentTime: updated.appointmentTime,
          status: updated.bookingStatus,
          reason: data.reason,
          refundAmount: shouldRefund ? refundAmount : 0,
          refunded: shouldRefund,
        },
      });

      // Phase 6: Send provider no-show email to client with refund info
      await emailService.sendProviderNoShowNotification(
        updated.client.email,
        updated.client.firstName,
        {
          serviceName: updated.service.title,
          clientName: `${updated.client.firstName} ${updated.client.lastName}`,
          appointmentDate: format(updated.appointmentDate, 'MMM dd, yyyy'),
          refundAmount: refundAmount, // Use refundAmount calculated earlier
          currency: updated.currency,
        }
      );

      // Phase 6: Send email notifications
      // Send email to client
      await emailService.sendBookingCancellation(
        updated.client.email,
        updated.client.firstName,
        {
          serviceName: updated.service.title,
          providerName: updated.provider.businessName,
          appointmentDate: format(updated.appointmentDate, 'MMM dd, yyyy'),
          appointmentTime: updated.appointmentTime,
          refundAmount: shouldRefund ? refundAmount : undefined,
          currency: updated.currency,
          cancelledBy: (data.cancelledBy || 'client') as 'client' | 'provider',
          reason: data.reason,
        }
      );

      // Send email to provider
      await emailService.sendProviderCancellationNotification(
        updated.provider.user.email,
        updated.provider.businessName,
        {
          clientName: `${updated.client.firstName} ${updated.client.lastName}`,
          serviceName: updated.service.title,
          appointmentDate: format(updated.appointmentDate, 'MMM dd, yyyy'),
          appointmentTime: updated.appointmentTime,
          cancelledBy: (data.cancelledBy || 'client') as 'client' | 'provider',
          reason: data.reason,
        }
      );
    } catch (notificationError) {
      console.error('Failed to send cancellation notification:', notificationError);
    }

    // TODO: Add cancellation email template to email service
    // For now, notifications are sent via the notification service above

    return updated;
  }

  /**
   * Reschedule booking (within provider's policy)
   */
  async rescheduleBooking(userId: string, bookingId: string, data: RescheduleBookingRequest) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        service: {
          select: {
            durationMinutes: true,
            bufferTimeMinutes: true,
          },
        },
        provider: {
          select: {
            id: true,
            userId: true,
            minAdvanceHours: true,
          },
        },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Only client can reschedule their own booking
    if (booking.clientId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    // Check if booking can be rescheduled
    if (!['PENDING', 'CONFIRMED'].includes(booking.bookingStatus)) {
      throw new AppError(400, 'Only pending or confirmed bookings can be rescheduled');
    }

    // Check minimum advance notice for rescheduling
    const now = new Date();
    const appointmentDateTime = new Date(
      `${booking.appointmentDate.toISOString().split('T')[0]}T${booking.appointmentTime}`
    );
    const hoursUntilAppointment =
      (appointmentDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    const minRescheduleHours = booking.provider.minAdvanceHours || 24;
    if (hoursUntilAppointment < minRescheduleHours) {
      throw new AppError(
        400,
        `Booking must be rescheduled at least ${minRescheduleHours} hours in advance`
      );
    }

    // Check if new slot is available
    const totalDuration =
      booking.service.durationMinutes + (booking.service.bufferTimeMinutes || 0);
    const newEndTime = this.addMinutes(data.newTime, totalDuration);
    const newRequestedDate = new Date(data.newDate);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        providerId: booking.provider.id,
        appointmentDate: newRequestedDate,
        bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
        id: { not: bookingId }, // Exclude current booking
      },
    });

    if (conflictingBooking) {
      const hasConflict = this.timesOverlap(
        data.newTime,
        newEndTime,
        conflictingBooking.appointmentTime,
        conflictingBooking.appointmentEndTime
      );

      if (hasConflict) {
        throw new AppError(400, 'Selected time slot is not available');
      }
    }

    // Update booking with new date/time
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        appointmentDate: newRequestedDate,
        appointmentTime: data.newTime,
        appointmentEndTime: newEndTime,
        rescheduleCount: { increment: 1 },
        updatedAt: new Date(),
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
            slug: true,
            businessPhone: true,
            city: true,
            state: true,
            isSalon: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
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

    // Update Google Calendar event with new date/time
    if (updated.googleCalendarEventId) {
      const startDate = new Date(`${data.newDate}T${data.newTime}:00`);
      const endDate = new Date(startDate.getTime() + updated.service.durationMinutes * 60000);

      await calendarSyncService.updateCalendarEvent(bookingId, updated.provider.id, {
        bookingId,
        title: `${updated.service.title} - ${updated.client.firstName} ${updated.client.lastName}`,
        description: `Rescheduled Booking\n\nClient: ${updated.client.firstName} ${updated.client.lastName}\nEmail: ${updated.client.email}\nPhone: ${updated.client.phone}\nService: ${updated.service.title}`,
        startTime: startDate,
        endTime: endDate,
        clientEmail: updated.client.email,
        clientName: `${updated.client.firstName} ${updated.client.lastName}`,
      });
    }

    // Send notifications to both parties
    try {
      const providerUserId = await prisma.providerProfile.findUnique({
        where: { id: updated.providerId },
        select: { userId: true },
      });

      const newDate = format(new Date(data.newDate), 'MMM dd, yyyy');

      // Notify client
      await notificationService.createBookingRescheduledNotification(
        updated.clientId,
        newDate,
        data.newTime,
        updated.id,
        false
      );

      emitBookingUpdate(updated.clientId, {
        type: 'booking_rescheduled',
        booking: { id: updated.id, serviceName: updated.service.title, newDate, newTime: data.newTime },
      });

      // Notify provider
      if (providerUserId) {
        await notificationService.createBookingRescheduledNotification(
          providerUserId.userId,
          newDate,
          data.newTime,
          updated.id,
          true
        );

        emitBookingUpdate(providerUserId.userId, {
          type: 'booking_rescheduled',
          booking: { id: updated.id, serviceName: updated.service.title, newDate, newTime: data.newTime },
        });
      }
    } catch (err) {
      console.error('Failed to send reschedule notifications:', err);
    }

    return updated;
  }

  /**
   * Request reschedule (provider only)
   */
  async requestReschedule(userId: string, bookingId: string, data: RequestRescheduleRequest) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: {
          select: {
            id: true,
            userId: true,
            businessName: true,
            user: {
          select: {
            email: true,
            firstName: true,
          },
        },
          },
          
        },
        service: {
          select: {

            title: true,
            durationMinutes: true,
            bufferTimeMinutes: true,
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

    // Only the provider can request reschedule
    if (booking.provider.userId !== userId) {
      throw new AppError(403, 'Only the provider can request reschedule');
    }

    // Check if booking can be rescheduled
    if (!['PENDING', 'CONFIRMED'].includes(booking.bookingStatus)) {
      throw new AppError(400, 'Only pending or confirmed bookings can be rescheduled');
    }

    // Check if there's already a pending reschedule request
    const existingRequest = await prisma.rescheduleRequest.findFirst({
      where: {
        bookingId,
        status: 'pending',
      },
    });

    if (existingRequest) {
      throw new AppError(400, 'There is already a pending reschedule request for this booking');
    }

    // Check if new slot is available
    const totalDuration =
      booking.service.durationMinutes + (booking.service.bufferTimeMinutes || 0);
    const newEndTime = this.addMinutes(data.newTime, totalDuration);
    const newRequestedDate = new Date(data.newDate);

    const conflictingBooking = await prisma.booking.findFirst({
      where: {
        providerId: booking.providerId,
        appointmentDate: newRequestedDate,
        OR: [
          {
            AND: [
              { appointmentTime: { lte: data.newTime } },
              { appointmentEndTime: { gt: data.newTime } },
            ],
          },
          {
            AND: [
              { appointmentTime: { lt: newEndTime } },
              { appointmentEndTime: { gte: newEndTime } },
            ],
          },
          {
            AND: [
              { appointmentTime: { gte: data.newTime } },
              { appointmentEndTime: { lte: newEndTime } },
            ],
          },
        ],
        id: { not: bookingId },
        bookingStatus: { in: ['PENDING', 'CONFIRMED'] },
      },
    });

    if (conflictingBooking) {
      throw new AppError(400, 'The requested time slot is not available');
    }

    // Create reschedule request
    const rescheduleRequest = await prisma.rescheduleRequest.create({
      data: {
        bookingId,
        newDate: newRequestedDate,
        newTime: data.newTime,
        reason: data.reason,
        status: 'pending',
      },
    });

    // Notify client about reschedule request
    try {
      await notificationService.createRescheduleRequestNotification(
        booking.clientId,
        booking.provider.businessName,
        format(newRequestedDate, 'MMM dd, yyyy'),
        data.newTime,
        booking.id
      );

      emitBookingUpdate(booking.clientId, {
        type: 'reschedule_requested',
        booking: {
          id: booking.id,
          providerName: booking.provider.businessName,
          proposedDate: format(newRequestedDate, 'MMM dd, yyyy'),
          proposedTime: data.newTime,
        },
      });
    } catch (err) {
      console.error('Failed to send reschedule request notification:', err);
    }

    // Phase 6: Send reschedule request email
    const isClientRequest = booking.clientId === userId;
    const recipientEmail = isClientRequest ? booking.provider.user.email : booking.client.email;
    const recipientName = isClientRequest ? booking.provider.businessName : booking.client.firstName;
    const requestedBy = isClientRequest ? 'Client' : 'Provider';

    await emailService.sendRescheduleRequest(
      recipientEmail,
      recipientName,
      {
        serviceName: booking.service.title,
        currentDate: format(booking.appointmentDate, 'MMM dd, yyyy'),
        currentTime: booking.appointmentTime,
        newDate: format(newRequestedDate, 'MMM dd, yyyy'),
        newTime: data.newTime,
        requestedBy,
      }
    );

    return rescheduleRequest;
  }

  /**
   * Respond to reschedule request (client only)
   */
  async respondToRescheduleRequest(
    userId: string,
    requestId: string,
    data: RespondToRescheduleRequest
  ) {
    const rescheduleRequest = await prisma.rescheduleRequest.findUnique({
      where: { id: requestId },
      include: {
        booking: {
          include: {
            service: {
              select: {
                id: true,
                title: true,
                durationMinutes: true,
                bufferTimeMinutes: true,
              },
            },
            provider: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: {
                    email: true,
                  },
                },
              },
            },
            client: {
              select: {
                id: true,
                firstName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!rescheduleRequest) {
      throw new AppError(404, 'Reschedule request not found');
    }

    // Only the client can respond to reschedule request
    if (rescheduleRequest.booking.clientId !== userId) {
      throw new AppError(403, 'Only the client can respond to reschedule request');
    }

    // Check if request is still pending
    if (rescheduleRequest.status !== 'pending') {
      throw new AppError(400, 'This reschedule request has already been responded to');
    }

    if (data.approved) {
      // Update booking with new date/time
      const totalDuration =
        rescheduleRequest.booking.service.durationMinutes +
        (rescheduleRequest.booking.service.bufferTimeMinutes || 0);
      const newEndTime = this.addMinutes(rescheduleRequest.newTime, totalDuration);

      const updatedBooking = await prisma.booking.update({
        where: { id: rescheduleRequest.bookingId },
        data: {
          appointmentDate: rescheduleRequest.newDate,
          appointmentTime: rescheduleRequest.newTime,
          appointmentEndTime: newEndTime,
          rescheduleCount: { increment: 1 },
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
              user: {
                select: {
                  email: true,
                  firstName: true,
                },
              },
              businessName: true,
              slug: true,
              businessPhone: true,
              city: true,
              state: true,
              isSalon: true,
              locations: {
                where: { isPrimary: true, isActive: true },
                take: 1,
              },
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
          addons: true,
        },
      });

      // Update reschedule request status
      await prisma.rescheduleRequest.update({
        where: { id: requestId },
        data: {
          status: 'approved',
          respondedAt: new Date(),
        },
      });

      // Send notification to provider about approval
      try {
        const providerUserId = await prisma.providerProfile.findUnique({
          where: { id: updatedBooking.provider.id },
          select: { userId: true },
        });

        if (providerUserId) {
          await notificationService.createRescheduleApprovedNotification(
            providerUserId.userId,
            updatedBooking.id
          );

          emitBookingUpdate(providerUserId.userId, {
            type: 'reschedule_approved',
            booking: {
              id: rescheduleRequest.bookingId,
              status: 'approved',
            },
          });
        }
      } catch (err) {
        console.error('Failed to send reschedule approval notification:', err);
      }

      // Phase 6: Send reschedule approved email to provider
      await emailService.sendRescheduleApproved(
        updatedBooking.provider.user.email,
        updatedBooking.provider.businessName,
        {
          serviceName: updatedBooking.service.title,
          newDate: format(updatedBooking.appointmentDate, 'MMM dd, yyyy'),
          newTime: updatedBooking.appointmentTime,
        }
      );

      return updatedBooking;
    } else {
      // Update reschedule request status to denied
      await prisma.rescheduleRequest.update({
        where: { id: requestId },
        data: {
          status: 'denied',
          respondedAt: new Date(),
          responseReason: data.reason,
        },
      });

      // Notify provider about denial
      try {
        const providerUserId = await prisma.providerProfile.findUnique({
          where: { id: rescheduleRequest.booking.providerId },
          select: { userId: true },
        });

        if (providerUserId) {
          await notificationService.createRescheduleRejectedNotification(
            providerUserId.userId,
            rescheduleRequest.bookingId
          );

          emitBookingUpdate(providerUserId.userId, {
            type: 'reschedule_rejected',
            booking: {
              id: rescheduleRequest.bookingId,
              status: 'denied',
            },
          });
        }
      } catch (err) {
        console.error('Failed to send reschedule rejection notification:', err);
      }

      // Phase 6: Send reschedule denied email to provider
      await emailService.sendRescheduleDenied(
        rescheduleRequest.booking.provider.user.email,
        rescheduleRequest.booking.provider.businessName,
        {
          serviceName: rescheduleRequest.booking.service.title,
          currentDate: format(rescheduleRequest.booking.appointmentDate, 'MMM dd, yyyy'),
          currentTime: rescheduleRequest.booking.appointmentTime,
          reason: data.reason,
        }
      );

      return rescheduleRequest.booking;
    }
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
        completedAt: new Date(),
        tipAmount: data.tipAmount || 0,
        internalNotes: data.notes || null,
        balancePaymentMethod: data.balancePaymentMethod || null,
        updatedAt: new Date(),
      },
      include: {
        service: true,
        provider: true,
        assignedTeamMember: true,
        client: true,
        review: true,
      },
    });

    return updated;
  }

  /**
   * Mark booking as no-show (provider only)
   */
  async markNoShow(userId: string, userRole: string, bookingId: string, notes?: string) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: { select: { userId: true } },
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Only provider can mark as no-show
    if (userRole !== 'PROVIDER' || booking.provider.userId !== userId) {
      throw new AppError(403, 'Only the provider can mark bookings as no-show');
    }

    // Can only mark confirmed bookings as no-show
    if (booking.bookingStatus !== 'CONFIRMED') {
      throw new AppError(400, 'Only confirmed bookings can be marked as no-show');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'NO_SHOW',
        internalNotes: notes || null,
        updatedAt: new Date(),
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
            slug: true,
            businessPhone: true,
            addressLine1: true,
            city: true,
            state: true,
            isSalon: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
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

    // Phase 6: Send no-show email to client
    await emailService.sendClientNoShowNotification(
      updated.client.email,
      updated.client.firstName,
      {
        serviceName: updated.service.title,
        providerName: updated.provider.businessName,
        appointmentDate: format(updated.appointmentDate, 'MMM dd, yyyy'),
        depositAmount: Number(updated.depositAmount),
        currency: updated.currency,
      }
    );

    // TODO: Handle deposit forfeiture according to policy

    return updated;
  }

  /**
   * Report Provider No-Show
   * Client reports that provider didn't show up for appointment
   * - Processes full refund to client
   * - Updates provider no-show count
   * - Sends notifications
   */
  async reportProviderNoShow(
    bookingId: string,
    clientId: string,
    data: { reason: string; evidence?: string }
  ): Promise<{ booking: BookingDetails; refundAmount: number }> {
    // Get booking and verify client owns it
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        client: true,
        provider: { include: { user: true } },
        service: true,
      },
    });

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    if (booking.clientId !== clientId) {
      throw new AppError(403, 'You can only report no-shows for your own bookings');
    }

    // Verify appointment has passed
    const appointmentDateTime = new Date(
      `${booking.appointmentDate.toISOString().split('T')[0]}T${booking.appointmentTime}`
    );
    const now = new Date();

    if (now < appointmentDateTime) {
      throw new AppError(400, 'Cannot report no-show before appointment time');
    }

    // Can only report for CONFIRMED bookings
    if (booking.bookingStatus !== 'CONFIRMED') {
      throw new AppError(400, 'Can only report no-show for confirmed bookings');
    }

    // Calculate refund amount (deposit + balance if paid)
    let refundAmount = Number(booking.depositAmount);
    if (booking.paymentStatus === 'FULLY_PAID') {
      refundAmount = Number(booking.servicePrice);
    }

    // Process refund
    const refundResult = await refundService.processRefund(
      bookingId,
      refundAmount,
      `Provider no-show - ${data.reason}`,
      clientId
    );

    if (!refundResult.success) {
      throw new AppError(500, `Failed to process refund: ${refundResult.error}`);
    }

    // Update booking status
    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: 'PROVIDER_NO_SHOW',
        paymentStatus: 'REFUNDED',
        internalNotes: `Provider no-show reported. Reason: ${data.reason}${
          data.evidence ? ` | Evidence: ${data.evidence}` : ''
        }`,
        updatedAt: new Date(),
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
            slug: true,
            businessPhone: true,
            addressLine1: true,
            city: true,
            state: true,
            isSalon: true,
            locations: {
              where: { isPrimary: true, isActive: true },
              take: 1,
            },
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
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

    // Send notification to provider
    await notificationService.createBookingCancelledNotification(
      booking.provider.userId,
      `${booking.client.firstName} ${booking.client.lastName}`,
      booking.appointmentDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      booking.id,
      true // isProvider
    );

    // Emit socket event to provider
    try {
      emitBookingUpdate(booking.provider.userId, {
        type: 'provider_no_show_reported',
        booking: {
          id: booking.id,
          clientName: `${booking.client.firstName} ${booking.client.lastName}`,
          serviceName: booking.service.title,
          appointmentDate: booking.appointmentDate.toISOString(),
          appointmentTime: booking.appointmentTime,
          status: 'PROVIDER_NO_SHOW',
          reason: data.reason,
        },
      });
    } catch (socketError) {
      console.error(
        `Failed to emit socket event for provider no-show ${booking.id}:`,
        socketError
      );
    }

    console.info(
      `Provider no-show reported for booking ${booking.id} - Refund of ${booking.currency} ${refundAmount.toFixed(
        2
      )} processed`
    );

    return {
      booking: updated as unknown as BookingDetails,
      refundAmount,
    };
  }

  /**
   * Add photo to booking
   */
  async addBookingPhoto(
    userId: string,
    bookingId: string,
    data: { photoUrl: string; photoType: 'BEFORE' | 'AFTER' | 'REFERENCE'; caption?: string }
  ) {
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        provider: {
          select: {
            id: true,
            businessName: true,
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

    if (!booking) {
      throw new AppError(404, 'Booking not found');
    }

    // Verify access
    if (booking.clientId !== userId) {
      const providerProfile = await prisma.providerProfile.findUnique({
        where: { userId },
        select: { id: true },
      });

      if (!providerProfile || booking.providerId !== providerProfile.id) {
        throw new AppError(403, 'Access denied');
      }
    }

    const photo = await prisma.bookingPhoto.create({
      data: {
        bookingId,
        uploadedBy: userId,
        photoType: data.photoType,
        imageUrl: data.photoUrl,
        caption: data.caption,
      },
    });

    // Notify the other party about photo addition
    try {
      const isProvider = booking.providerId === (await prisma.providerProfile.findUnique({
        where: { userId },
        select: { id: true },
      }))?.id;

      const recipientId = isProvider ? booking.clientId : (await prisma.providerProfile.findUnique({
        where: { id: booking.providerId },
        select: { userId: true },
      }))?.userId;

      if (recipientId) {
        const uploaderName = isProvider
          ? booking.provider.businessName
          : `${booking.client.firstName} ${booking.client.lastName}`;

        await notificationService.createBookingPhotoAddedNotification(
          recipientId,
          uploaderName,
          data.photoType,
          booking.id,
          !isProvider
        );

        emitBookingUpdate(recipientId, {
          type: 'booking_photo_added',
          booking: {
            id: booking.id,
            photoType: data.photoType,
            uploaderName,
          },
        });
      }
    } catch (err) {
      console.error('Failed to send photo notification:', err);
    }

    return photo;
  }

  /**
   * Delete booking photo
   */
  async deleteBookingPhoto(userId: string, bookingId: string, photoId: string) {
    const photo = await prisma.bookingPhoto.findUnique({
      where: { id: photoId },
      include: { booking: true },
    });

    if (!photo) {
      throw new AppError(404, 'Photo not found');
    }

    if (photo.bookingId !== bookingId) {
      throw new AppError(400, 'Photo does not belong to this booking');
    }

    // Only uploader or provider/admin can delete
    if (photo.uploadedBy !== userId && photo.booking.providerId !== userId) {
      throw new AppError(403, 'Access denied');
    }

    await prisma.bookingPhoto.delete({
      where: { id: photoId },
    });
  }

  /**
   * Get bookings with pending reviews for a client
   */
  async getPendingReviews(userId: string) {
    const now = new Date();

    const bookings = await prisma.booking.findMany({
      where: {
        clientId: userId,
        bookingStatus: 'COMPLETED',
        // No review exists for this booking
        review: null,
        // Optionally filter by review deadline
        OR: [
          { reviewDeadline: null },
          { reviewDeadline: { gte: now } },
        ],
      },
      include: {
        service: {
          select: {
            id: true,
            title: true,
            durationMinutes: true,
          },
        },
        provider: {
          select: {
            id: true,
            businessName: true,
            slug: true,
          },
        },
      },
      orderBy: {
        appointmentDate: 'desc',
      },
      take: 10, // Limit to most recent 10
    });

    return bookings;
  }
}

export const bookingService = new BookingService();

