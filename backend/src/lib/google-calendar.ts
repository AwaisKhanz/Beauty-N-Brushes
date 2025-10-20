/**
 * Google Calendar Integration Library
 * Handles Google Calendar OAuth and sync operations
 */

import { google } from 'googleapis';
import { AppError } from '../middleware/errorHandler';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI;

if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
  console.warn(
    'Google Calendar OAuth credentials not configured. Calendar integration will not work.'
  );
}

export class GoogleCalendarService {
  private oauth2Client;

  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI
    );
  }

  /**
   * Get Google Calendar OAuth URL
   */
  getAuthUrl(state: string): string {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new AppError(500, 'Google Calendar not configured');
    }

    const authUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/userinfo.email',
      ],
      state: state,
      prompt: 'consent', // Force consent screen to get refresh token
    });

    return authUrl;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string) {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new AppError(500, 'Google Calendar not configured');
    }

    try {
      const { tokens } = await this.oauth2Client.getToken(code);

      // Get user info
      this.oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: 'v2', auth: this.oauth2Client });
      const { data } = await oauth2.userinfo.get();

      return {
        accessToken: tokens.access_token || '',
        refreshToken: tokens.refresh_token || '',
        expiresAt: tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : new Date(Date.now() + 3600 * 1000),
        email: data.email || '',
      };
    } catch (error) {
      console.error('Error exchanging Google code for tokens:', error);
      throw new AppError(400, 'Failed to exchange authorization code');
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(refreshToken: string): Promise<string> {
    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new AppError(500, 'Google Calendar not configured');
    }

    try {
      this.oauth2Client.setCredentials({
        refresh_token: refreshToken,
      });

      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return credentials.access_token || '';
    } catch (error) {
      console.error('Error refreshing Google access token:', error);
      throw new AppError(400, 'Failed to refresh access token');
    }
  }

  /**
   * Create calendar event
   */
  async createEvent(accessToken: string, refreshToken: string, eventData: any) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: eventData,
      });

      return response.data;
    } catch (error) {
      console.error('Error creating Google Calendar event:', error);
      throw new AppError(500, 'Failed to create calendar event');
    }
  }

  /**
   * Update calendar event
   */
  async updateEvent(accessToken: string, refreshToken: string, eventId: string, eventData: any) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.update({
        calendarId: 'primary',
        eventId: eventId,
        requestBody: eventData,
      });

      return response.data;
    } catch (error) {
      console.error('Error updating Google Calendar event:', error);
      throw new AppError(500, 'Failed to update calendar event');
    }
  }

  /**
   * Delete calendar event
   */
  async deleteEvent(accessToken: string, refreshToken: string, eventId: string) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: eventId,
      });

      return { success: true };
    } catch (error) {
      console.error('Error deleting Google Calendar event:', error);
      throw new AppError(500, 'Failed to delete calendar event');
    }
  }

  /**
   * List calendar events
   */
  async listEvents(accessToken: string, refreshToken: string, timeMin: Date, timeMax: Date) {
    this.oauth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

    try {
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: timeMin.toISOString(),
        timeMax: timeMax.toISOString(),
        singleEvents: true,
        orderBy: 'startTime',
      });

      return response.data.items || [];
    } catch (error) {
      console.error('Error listing Google Calendar events:', error);
      throw new AppError(500, 'Failed to list calendar events');
    }
  }
}

export const googleCalendarService = new GoogleCalendarService();
