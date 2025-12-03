import https from 'https';
import type { RegionCode } from '../../../shared-constants';

interface GeolocationData {
  country_code: string;
  country_name: string;
  currency: string;
  ip: string;
}

/**
 * Service for detecting user region from IP address
 */
export class RegionDetectionService {
  /**
   * Detect region from IP address using ipapi.co
   * Maps country codes to our supported regions (NA, EU, GH, NG)
   */
  async detectRegionFromIP(ipAddress: string): Promise<RegionCode> {
    try {
      // Skip detection for localhost/private IPs
      if (this.isPrivateIP(ipAddress)) {
        console.log('Private IP detected, defaulting to NA');
        return 'NA';
      }

      const geoData = await this.fetchGeolocation(ipAddress);
      const countryCode = geoData.country_code;
      
      return this.mapCountryToRegion(countryCode);
    } catch (error) {
      console.error('Failed to detect region from IP:', error);
      // Default to NA if detection fails
      return 'NA';
    }
  }

  /**
   * Fetch geolocation data from ipapi.co
   */
  private fetchGeolocation(ipAddress: string): Promise<GeolocationData> {
    return new Promise((resolve, reject) => {
      const url = `https://ipapi.co/${ipAddress}/json/`;
      
      https.get(url, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            
            // Check for API errors
            if (parsed.error) {
              reject(new Error(`Geolocation API error: ${parsed.reason || 'Unknown'}`));
              return;
            }

            resolve(parsed);
          } catch (error) {
            reject(new Error('Failed to parse geolocation response'));
          }
        });
      }).on('error', (error) => {
        reject(error);
      });
    });
  }

  /**
   * Map country code to our supported regions
   */
  private mapCountryToRegion(countryCode: string): RegionCode {
    // Ghana
    if (countryCode === 'GH') return 'GH';
    
    // Nigeria
    if (countryCode === 'NG') return 'NG';
    
    // European countries (EU member states + UK, Norway, Switzerland)
    const europeanCountries = [
      'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
      'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
      'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE', 'GB', 'NO', 'CH',
      'IS', 'LI', 'MC', 'SM', 'VA'
    ];
    
    if (europeanCountries.includes(countryCode)) return 'EU';
    
    // Default to North America for US, CA, and all other countries
    return 'NA';
  }

  /**
   * Get client IP from request
   * Handles various proxy headers
   */
  getClientIP(req: any): string {
    // Check various headers that might contain the real IP
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      // x-forwarded-for can contain multiple IPs, take the first one
      const ips = forwarded.split(',');
      return ips[0].trim();
    }

    const realIP = req.headers['x-real-ip'];
    if (realIP) {
      return realIP;
    }

    // Cloudflare
    const cfConnectingIP = req.headers['cf-connecting-ip'];
    if (cfConnectingIP) {
      return cfConnectingIP;
    }

    // Fall back to connection remote address
    return req.connection?.remoteAddress || 
           req.socket?.remoteAddress || 
           req.ip || 
           '';
  }

  /**
   * Check if IP is private/localhost
   */
  private isPrivateIP(ip: string): boolean {
    if (!ip) return true;
    
    // Remove IPv6 prefix if present
    const cleanIP = ip.replace(/^::ffff:/, '');
    
    // Localhost
    if (cleanIP === '127.0.0.1' || cleanIP === 'localhost' || cleanIP === '::1') {
      return true;
    }

    // Private IP ranges
    const privateRanges = [
      /^10\./,                    // 10.0.0.0 - 10.255.255.255
      /^172\.(1[6-9]|2\d|3[01])\./, // 172.16.0.0 - 172.31.255.255
      /^192\.168\./,              // 192.168.0.0 - 192.168.255.255
    ];

    return privateRanges.some(range => range.test(cleanIP));
  }
}

// Export singleton instance
export const regionDetectionService = new RegionDetectionService();
