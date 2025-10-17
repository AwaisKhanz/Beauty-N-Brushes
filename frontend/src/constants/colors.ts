/**
 * Brand color palette constants
 */

export const BRAND_COLORS = {
  // Official BNB Color Palette
  PRIMARY: '#B06F64', // Dusty Rose
  ACCENT: '#FFB09E', // Peach Blush
  SECONDARY: '#CA8D80', // Warm Taupe
  TERTIARY: '#DF9C8C', // Blush Clay
  BUTTON_DARK: '#2A3F4D', // Dark Slate Blue-Grey
  BUTTON_LIGHT: '#FFB09E', // Peach Blush
} as const;

export const DEFAULT_BRAND_COLORS = {
  primary: 'hsl(230 100% 35%)',
  secondary: 'hsl(12 66% 43%)',
  accent: 'hsl(18 76% 53%)',
} as const;

export const AVAILABLE_FONTS = {
  HEADING: ['Inter', 'Playfair Display', 'Montserrat', 'Roboto', 'Open Sans'],
  BODY: ['Inter', 'Roboto', 'Open Sans', 'Lato', 'Montserrat'],
} as const;

export const DEFAULT_FONTS = {
  heading: 'Inter',
  body: 'Montserrat',
} as const;
