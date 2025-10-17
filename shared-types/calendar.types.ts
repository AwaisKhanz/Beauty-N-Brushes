/**
 * Calendar & Availability Types
 * Shared between frontend and backend
 */

export interface DaySchedule {
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: string; // HH:mm format
  endTime: string; // HH:mm format
  isAvailable: boolean;
}

export interface AvailabilitySettings {
  timezone: string;
  advanceBookingDays: number;
  minimumNoticeHours: number;
  bufferMinutes: number;
  sameDayBooking: boolean;
}

export interface GetAvailabilityResponse {
  schedule: DaySchedule[];
  settings: AvailabilitySettings;
}

export interface UpdateAvailabilityRequest {
  schedule: DaySchedule[];
  timezone?: string;
  advanceBookingDays?: number;
  minimumNoticeHours?: number;
  bufferMinutes?: number;
  sameDayBooking?: boolean;
}

export interface UpdateAvailabilityResponse {
  message: string;
}

export interface BlockedDate {
  id: string;
  startDate: string;
  endDate: string;
  reason?: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

export interface CreateBlockedDateRequest {
  startDate: string;
  endDate: string;
  reason?: string;
  allDay: boolean;
  startTime?: string;
  endTime?: string;
}

export interface CreateBlockedDateResponse {
  message: string;
  blockedDate: BlockedDate;
}

export interface GetBlockedDatesResponse {
  blockedDates: BlockedDate[];
}

export interface DeleteBlockedDateResponse {
  message: string;
}
