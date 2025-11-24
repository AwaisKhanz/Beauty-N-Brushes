/**
 * Calendar Sync Service
 * Handles two-way synchronization between bookings and Google Calendar
 */

import { prisma } from '../config/database';
import { googleCalendarService } from '../lib/google-calendar';
import logger from '../utils/logger';

export interface BookingCalendarData {
  bookingId: string;
  title: string;
  description: string;
  startTime: Date;
  endTime: Date;
  clientEmail: string;
  clientName: string;
  location?: string;
}

export class CalendarSyncService {
  /**
   * Sync booking to Google Calendar
   */
  async syncBookingToCalendar(
    booking: BookingCalendarData,
    providerId: string
  ): Promise<string | null> {
    try {
      // Get provider's Google Calendar credentials
      const provider = await prisma.providerProfile.findUnique({
        where: { id: providerId },
        select: {
          googleCalendarConnected: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          timezone: true,
        },
      });

      if (!provider || !provider.googleCalendarConnected) {
        logger.info(`Provider ${providerId} does not have Google Calendar connected`);
        return null;
      }

      if (!provider.googleAccessToken || !provider.googleRefreshToken) {
        logger.warn(`Provider ${providerId} has calendar connected but missing tokens`);
        return null;
      }

      // Create calendar event
      const event = {
        summary: booking.title,
        description: booking.description,
        start: {
          dateTime: booking.startTime.toISOString(),
          timeZone: provider.timezone || 'America/New_York',
        },
        end: {
          dateTime: booking.endTime.toISOString(),
          timeZone: provider.timezone || 'America/New_York',
        },
        attendees: [
          {
            email: booking.clientEmail,
            displayName: booking.clientName,
          },
        ],
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours before
            { method: 'popup', minutes: 60 }, // 1 hour before
          ],
        },
      };

      if (booking.location) {
        Object.assign(event, { location: booking.location });
      }

      const createdEvent = await googleCalendarService.createEvent(
        provider.googleAccessToken,
        provider.googleRefreshToken,
        event
      );

      logger.info(
        `Created Google Calendar event ${createdEvent.id} for booking ${booking.bookingId}`
      );

      return createdEvent.id || null;
    } catch (error) {
      logger.error(`Failed to sync booking ${booking.bookingId} to Google Calendar:`, error);
      // Don't throw - calendar sync is optional, shouldn't block booking creation
      return null;
    }
  }

  /**
   * Update calendar event for booking
   */
  async updateCalendarEvent(
    bookingId: string,
    providerId: string,
    updates: Partial<BookingCalendarData>
  ): Promise<void> {
    try {
      // Get booking's calendar event ID
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { googleCalendarEventId: true },
      });

      if (!booking || !booking.googleCalendarEventId) {
        logger.info(`Booking ${bookingId} has no linked calendar event`);
        return;
      }

      // Get provider's Google Calendar credentials
      const provider = await prisma.providerProfile.findUnique({
        where: { id: providerId },
        select: {
          googleCalendarConnected: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          timezone: true,
        },
      });

      if (!provider || !provider.googleCalendarConnected) {
        return;
      }

      if (!provider.googleAccessToken || !provider.googleRefreshToken) {
        return;
      }

      // Build update data
      const eventUpdate: Record<string, unknown> = {};

      if (updates.title) {
        eventUpdate.summary = updates.title;
      }

      if (updates.description) {
        eventUpdate.description = updates.description;
      }

      if (updates.startTime && updates.endTime) {
        eventUpdate.start = {
          dateTime: updates.startTime.toISOString(),
          timeZone: provider.timezone || 'America/New_York',
        };
        eventUpdate.end = {
          dateTime: updates.endTime.toISOString(),
          timeZone: provider.timezone || 'America/New_York',
        };
      }

      if (updates.location) {
        eventUpdate.location = updates.location;
      }

      await googleCalendarService.updateEvent(
        provider.googleAccessToken,
        provider.googleRefreshToken,
        booking.googleCalendarEventId,
        eventUpdate
      );

      logger.info(`Updated Google Calendar event for booking ${bookingId}`);
    } catch (error) {
      logger.error(`Failed to update calendar event for booking ${bookingId}:`, error);
      // Don't throw - calendar sync is optional
    }
  }

  /**
   * Delete calendar event for booking
   */
  async deleteCalendarEvent(bookingId: string, providerId: string): Promise<void> {
    try {
      // Get booking's calendar event ID
      const booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        select: { googleCalendarEventId: true },
      });

      if (!booking || !booking.googleCalendarEventId) {
        return;
      }

      // Get provider's Google Calendar credentials
      const provider = await prisma.providerProfile.findUnique({
        where: { id: providerId },
        select: {
          googleCalendarConnected: true,
          googleAccessToken: true,
          googleRefreshToken: true,
        },
      });

      if (!provider || !provider.googleCalendarConnected) {
        return;
      }

      if (!provider.googleAccessToken || !provider.googleRefreshToken) {
        return;
      }

      await googleCalendarService.deleteEvent(
        provider.googleAccessToken,
        provider.googleRefreshToken,
        booking.googleCalendarEventId
      );

      // Clear the event ID from booking
      await prisma.booking.update({
        where: { id: bookingId },
        data: { googleCalendarEventId: null },
      });

      logger.info(`Deleted Google Calendar event for booking ${bookingId}`);
    } catch (error) {
      logger.error(`Failed to delete calendar event for booking ${bookingId}:`, error);
      // Don't throw - calendar sync is optional
    }
  }

  /**
   * Sync external Google Calendar events to block BNB availability
   * This can be run periodically (e.g., every hour) to keep availability in sync
   */
  async syncExternalEventsToAvailability(providerId: string): Promise<void> {
    try {
      const provider = await prisma.providerProfile.findUnique({
        where: { id: providerId },
        select: {
          googleCalendarConnected: true,
          googleAccessToken: true,
          googleRefreshToken: true,
          googleCalendarLastSync: true,
          timezone: true,
        },
      });

      if (!provider || !provider.googleCalendarConnected) {
        return;
      }

      if (!provider.googleAccessToken || !provider.googleRefreshToken) {
        return;
      }

      // Get events from Google Calendar for next 30 days
      const timeMin = new Date();
      const timeMax = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

      const events = await googleCalendarService.listEvents(
        provider.googleAccessToken,
        provider.googleRefreshToken,
        timeMin,
        timeMax
      );

      // Filter out BNB-created events (those with our booking IDs)
      const bnbBookings = await prisma.booking.findMany({
        where: {
          providerId,
          googleCalendarEventId: { not: null },
        },
        select: { googleCalendarEventId: true },
      });

      const bnbEventIds = new Set(bnbBookings.map((b) => b.googleCalendarEventId).filter(Boolean));

      const externalEvents = events.filter((event) => !bnbEventIds.has(event.id || ''));

      // Create time-off blocks for external events
      // This prevents double-booking during times provider is busy elsewhere
      for (const event of externalEvents) {
        if (!event.start?.dateTime || !event.end?.dateTime) {
          continue; // Skip all-day events
        }

        const startDate = new Date(event.start.dateTime);
        const endDate = new Date(event.end.dateTime);

        // Check if time-off already exists for this event
        const existingTimeOff = await prisma.providerTimeOff.findFirst({
          where: {
            providerId,
            startDate: {
              lte: endDate,
            },
            endDate: {
              gte: startDate,
            },
          },
        });

        if (!existingTimeOff) {
          // Create time-off block
          await prisma.providerTimeOff.create({
            data: {
              providerId,
              startDate,
              endDate,
              reason: `Google Calendar: ${event.summary || 'Busy'}`,
              allDay: false,
            },
          });

          logger.info(`Created time-off block for external event: ${event.summary}`);
        }
      }

      // Update last sync time
      await prisma.providerProfile.update({
        where: { id: providerId },
        data: {
          googleCalendarLastSync: new Date(),
        },
      });

      logger.info(`Synced external calendar events for provider ${providerId}`);
    } catch (error) {
      logger.error(`Failed to sync external events for provider ${providerId}:`, error);
      // Don't throw - sync failures shouldn't break the app
    }
  }
}

export const calendarSyncService = new CalendarSyncService();
