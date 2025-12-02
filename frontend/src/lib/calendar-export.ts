/**
 * Calendar Export Utilities
 * Generate .ics files for calendar integration
 */

import type { BookingDetails } from '../../../shared-types';

interface CalendarEvent {
  title: string;
  description?: string;
  location?: string;
  startDate: Date;
  endDate: Date;
  url?: string;
}

/**
 * Format date for iCalendar format (YYYYMMDDTHHmmssZ)
 */
function formatICalDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  const hours = String(date.getUTCHours()).padStart(2, '0');
  const minutes = String(date.getUTCMinutes()).padStart(2, '0');
  const seconds = String(date.getUTCSeconds()).padStart(2, '0');

  return `${year}${month}${day}T${hours}${minutes}${seconds}Z`;
}

/**
 * Generate .ics file content
 */
function generateICS(event: CalendarEvent): string {
  const now = new Date();
  const dtstamp = formatICalDate(now);
  const dtstart = formatICalDate(event.startDate);
  const dtend = formatICalDate(event.endDate);

  // Generate unique ID
  const uid = `${Date.now()}-${Math.random().toString(36).substring(7)}@beautynbrushes.com`;

  // Escape special characters in text fields
  const escapeText = (text: string) => {
    return text
      .replace(/\\/g, '\\\\')
      .replace(/;/g, '\\;')
      .replace(/,/g, '\\,')
      .replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Beauty N Brushes//Booking Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTAMP:${dtstamp}`,
    `DTSTART:${dtstart}`,
    `DTEND:${dtend}`,
    `SUMMARY:${escapeText(event.title)}`,
  ];

  if (event.description) {
    lines.push(`DESCRIPTION:${escapeText(event.description)}`);
  }

  if (event.location) {
    lines.push(`LOCATION:${escapeText(event.location)}`);
  }

  if (event.url) {
    lines.push(`URL:${event.url}`);
  }

  lines.push(
    'STATUS:CONFIRMED',
    'SEQUENCE:0',
    'BEGIN:VALARM',
    'TRIGGER:-PT24H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Beauty appointment in 24 hours',
    'END:VALARM',
    'BEGIN:VALARM',
    'TRIGGER:-PT1H',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Beauty appointment in 1 hour',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  );

  return lines.join('\r\n');
}

/**
 * Download .ics file
 */
export function downloadICS(event: CalendarEvent, filename: string = 'booking.ics'): void {
  const icsContent = generateICS(event);
  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

/**
 * Export booking to calendar
 */
export function exportBookingToCalendar(booking: BookingDetails): void {
  if (!booking.service || !booking.provider) {
    throw new Error('Booking must include service and provider details');
  }
  // Combine date and time
  const [year, month, day] = booking.appointmentDate.split('-').map(Number);
  const [startHour, startMinute] = booking.appointmentTime.split(':').map(Number);
  const [endHour, endMinute] = booking.appointmentEndTime.split(':').map(Number);

  const startDate = new Date(year, month - 1, day, startHour, startMinute);
  const endDate = new Date(year, month - 1, day, endHour, endMinute);

  const location = booking.provider.locations?.[0]?.addressLine1
    ? `${booking.provider.locations[0].addressLine1}, ${booking.provider.city}, ${booking.provider.state}`
    : `${booking.provider.city}, ${booking.provider.state}`;

  const description = [
    `Appointment at ${booking.provider.businessName}`,
    booking.specialRequests ? `\nSpecial Requests: ${booking.specialRequests}` : '',
    `\nBooking ID: ${booking.id}`,
    `\nView booking: ${process.env.NEXT_PUBLIC_APP_URL}/client/bookings/${booking.id}`,
  ]
    .filter(Boolean)
    .join('');

  const event: CalendarEvent = {
    title: `${booking.service.title} - ${booking.provider.businessName}`,
    description,
    location,
    startDate,
    endDate,
    url: `${process.env.NEXT_PUBLIC_APP_URL}/client/bookings/${booking.id}`,
  };

  downloadICS(event, `booking-${booking.id}.ics`);
}
