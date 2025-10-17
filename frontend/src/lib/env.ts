// Frontend environment variables (type-safe)

export const env = {
  apiUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1',
  appUrl: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  stripePublishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || '',
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '',
  cloudFrontUrl: process.env.NEXT_PUBLIC_CLOUDFRONT_URL || '',
  gaId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || '',
} as const;

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const required = ['apiUrl', 'appUrl'];

  for (const key of required) {
    if (!env[key as keyof typeof env]) {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
}
