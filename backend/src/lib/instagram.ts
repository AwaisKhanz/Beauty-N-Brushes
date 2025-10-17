/**
 * Instagram Basic Display API Integration
 * Docs: https://developers.facebook.com/docs/instagram-basic-display-api
 *
 * SETUP REQUIRED:
 * 1. Create a Facebook App
 * 2. Add Instagram Basic Display product
 * 3. Configure OAuth redirect URIs
 * 4. Add environment variables:
 *    - INSTAGRAM_CLIENT_ID
 *    - INSTAGRAM_CLIENT_SECRET
 *    - INSTAGRAM_REDIRECT_URI
 */

import type { InstagramAuthResponse, InstagramMedia } from '../types/integration.types';

export class InstagramService {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  constructor() {
    this.clientId = process.env.INSTAGRAM_CLIENT_ID || '';
    this.clientSecret = process.env.INSTAGRAM_CLIENT_SECRET || '';
    this.redirectUri = process.env.INSTAGRAM_REDIRECT_URI || '';

    if (!this.clientId || !this.clientSecret || !this.redirectUri) {
      console.warn(
        'Instagram OAuth credentials not configured. Instagram integration will not work.'
      );
    }
  }

  /**
   * Get Instagram OAuth URL
   */
  getAuthorizationUrl(state?: string): string {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      scope: 'user_profile,user_media',
      response_type: 'code',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  }

  /**
   * Exchange authorization code for access token
   */
  async exchangeCodeForToken(code: string): Promise<InstagramAuthResponse> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      client_secret: this.clientSecret,
      grant_type: 'authorization_code',
      redirect_uri: this.redirectUri,
      code,
    });

    const response = await fetch('https://api.instagram.com/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const error = (await response.json()) as { error_message?: string };
      throw new Error(`Instagram OAuth error: ${error.error_message || 'Unknown error'}`);
    }

    return response.json() as Promise<InstagramAuthResponse>;
  }

  /**
   * Get long-lived access token (60 days validity)
   */
  async getLongLivedToken(
    shortLivedToken: string
  ): Promise<{ access_token: string; expires_in: number }> {
    const params = new URLSearchParams({
      grant_type: 'ig_exchange_token',
      client_secret: this.clientSecret,
      access_token: shortLivedToken,
    });

    const response = await fetch(`https://graph.instagram.com/access_token?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to exchange for long-lived token');
    }

    return response.json() as Promise<{ access_token: string; expires_in: number }>;
  }

  /**
   * Get user's media
   */
  async getUserMedia(accessToken: string, limit: number = 25): Promise<InstagramMedia[]> {
    const params = new URLSearchParams({
      fields: 'id,media_type,media_url,permalink,thumbnail_url,caption,timestamp',
      access_token: accessToken,
      limit: limit.toString(),
    });

    const response = await fetch(`https://graph.instagram.com/me/media?${params.toString()}`, {
      method: 'GET',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch Instagram media');
    }

    const data = (await response.json()) as { data?: InstagramMedia[] };
    return data.data || [];
  }

  /**
   * Refresh long-lived token (extends expiration)
   */
  async refreshToken(accessToken: string): Promise<{ access_token: string; expires_in: number }> {
    const params = new URLSearchParams({
      grant_type: 'ig_refresh_token',
      access_token: accessToken,
    });

    const response = await fetch(
      `https://graph.instagram.com/refresh_access_token?${params.toString()}`,
      { method: 'GET' }
    );

    if (!response.ok) {
      throw new Error('Failed to refresh access token');
    }

    return response.json() as Promise<{ access_token: string; expires_in: number }>;
  }
}

export const instagramService = new InstagramService();
