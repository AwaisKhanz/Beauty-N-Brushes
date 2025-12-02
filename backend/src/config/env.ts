import dotenv from 'dotenv';
import { z } from 'zod';

// Load environment variables
dotenv.config();

// Define environment schema
const envSchema = z.object({
  // Server
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().default('5000'),
  APP_URL: z.string().default('http://localhost:5000'),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  // Database
  DATABASE_URL: z.string(),
  DIRECT_URL: z.string().optional(),

  // JWT
  JWT_SECRET: z.string(),
  JWT_EXPIRY: z.string().default('3d'),
  COOKIE_SECRET: z.string(),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_S3_BUCKET: z.string().optional(),

  // Payment Mode
  PAYMENT_MODE: z.enum(['test', 'live']).default('test'),

  // Stripe - Test Mode
  STRIPE_TEST_SECRET_KEY: z.string().optional(),
  STRIPE_TEST_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_TEST_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_TEST_SOLO_PRICE_ID: z.string().optional(),
  STRIPE_TEST_SALON_PRICE_ID: z.string().optional(),

  // Stripe - Live Mode
  STRIPE_LIVE_SECRET_KEY: z.string().optional(),
  STRIPE_LIVE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_LIVE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_LIVE_SALON_PRICE_ID: z.string().optional(),
  STRIPE_LIVE_SOLO_PRICE_ID: z.string().optional(),

  // Stripe - Legacy (backward compatibility)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  STRIPE_SOLO_PRICE_ID: z.string().optional(),
  STRIPE_SALON_PRICE_ID: z.string().optional(),

  // Paystack - Test Mode
  PAYSTACK_TEST_SECRET_KEY: z.string().optional(),
  PAYSTACK_TEST_PUBLIC_KEY: z.string().optional(),

  // Paystack - Live Mode
  PAYSTACK_LIVE_SECRET_KEY: z.string().optional(),
  PAYSTACK_LIVE_PUBLIC_KEY: z.string().optional(),

  // Paystack - Legacy (backward compatibility)
  PAYSTACK_SECRET_KEY: z.string().optional(),
  PAYSTACK_WEBHOOK_SECRET: z.string().optional(),

  // Paystack Plans
  PAYSTACK_SOLO_GHS_PLAN: z.string().optional(),
  PAYSTACK_SALON_GHS_PLAN: z.string().optional(),
  PAYSTACK_SOLO_NGN_PLAN: z.string().optional(),
  PAYSTACK_SALON_NGN_PLAN: z.string().optional(),

  // SendGrid
  SENDGRID_API_KEY: z.string().optional(),
  SENDGRID_FROM_EMAIL: z.string().optional(),
  SENDGRID_FROM_NAME: z.string().default('Beauty N Brushes'),

  // Google Cloud AI (REQUIRED for all AI features)
  GOOGLE_CLOUD_PROJECT: z.string(),
  GOOGLE_CLOUD_LOCATION: z.string().default('us-central1'),
  GOOGLE_APPLICATION_CREDENTIALS: z.string(),

  // Instagram OAuth
  INSTAGRAM_APP_ID: z.string().optional(),
  INSTAGRAM_APP_SECRET: z.string().optional(),
  INSTAGRAM_REDIRECT_URI: z.string().optional(),

  // Redis
  REDIS_URL: z.string().optional(),
});

// Parse and export environment variables
export const env = envSchema.parse(process.env);

// Type-safe environment variables
export type Env = z.infer<typeof envSchema>;
