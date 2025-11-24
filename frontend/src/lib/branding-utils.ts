/**
 * Branding Utilities
 * Helper functions for applying custom provider branding to booking pages
 */

export interface ProviderBranding {
  primaryColor?: string | null;
  secondaryColor?: string | null;
  accentColor?: string | null;
  headingFont?: string | null;
  bodyFont?: string | null;
}

/**
 * Apply provider's custom branding to the page
 */
export function applyProviderBranding(branding: ProviderBranding) {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Apply custom colors if provided
  if (branding.primaryColor) {
    root.style.setProperty('--color-primary', branding.primaryColor);
  }

  if (branding.secondaryColor) {
    root.style.setProperty('--color-secondary', branding.secondaryColor);
  }

  if (branding.accentColor) {
    root.style.setProperty('--color-accent', branding.accentColor);
  }

  // Apply custom fonts if provided
  if (branding.headingFont) {
    root.style.setProperty('--font-heading', branding.headingFont);
  }

  if (branding.bodyFont) {
    root.style.setProperty('--font-body', branding.bodyFont);
  }
}

/**
 * Reset branding to platform defaults
 */
export function resetBranding() {
  if (typeof window === 'undefined') return;

  const root = document.documentElement;

  // Reset to default BNB colors
  root.style.removeProperty('--color-primary');
  root.style.removeProperty('--color-secondary');
  root.style.removeProperty('--color-accent');
  root.style.removeProperty('--font-heading');
  root.style.removeProperty('--font-body');
}

/**
 * Generate QR code URL for booking page
 */
export function generateQRCodeUrl(bookingPageUrl: string, size: number = 256): string {
  // Using QR Server API (free, no API key required)
  const encodedUrl = encodeURIComponent(bookingPageUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodedUrl}`;
}

/**
 * Generate social share URL
 */
export function generateShareUrl(
  platform: 'facebook' | 'twitter' | 'linkedin',
  bookingPageUrl: string,
  text: string
) {
  const encodedUrl = encodeURIComponent(bookingPageUrl);
  const encodedText = encodeURIComponent(text);

  switch (platform) {
    case 'facebook':
      return `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    case 'twitter':
      return `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`;
    case 'linkedin':
      return `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
    default:
      return '';
  }
}

/**
 * Copy booking page URL to clipboard
 */
export async function copyBookingPageUrl(url: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error('Failed to copy URL:', error);
    return false;
  }
}
