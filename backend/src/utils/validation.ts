import { z } from 'zod';

// ================================
// User Validation Schemas
// ================================

export const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
  firstName: z.string().min(2, 'First name must be at least 2 characters').max(100),
  lastName: z.string().min(2, 'Last name must be at least 2 characters').max(100),
  role: z.enum(['CLIENT', 'PROVIDER']),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .max(128, 'Password must not exceed 128 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// ================================
// Provider Validation Schemas
// ================================

export const providerOnboardingSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters').max(255),
  businessType: z.string().optional(),
  description: z.string().min(20, 'Description must be at least 20 characters').optional(),
  city: z.string().min(2),
  state: z.string().min(2),
  zipCode: z.string().min(5),
  country: z.string().default('US'),
  phone: z.string().optional(),
  subscriptionTier: z.enum(['SOLO', 'SALON']),
  regionCode: z.enum(['NA', 'EU', 'GH', 'NG']),
});

// ================================
// Service Validation Schemas
// ================================

export const serviceCreateSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(20).max(5000),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
  priceType: z.enum(['fixed', 'range', 'starting_at']),
  priceMin: z.number().positive().max(10000),
  priceMax: z.number().positive().max(10000).optional(),
  durationMinutes: z.number().min(15).max(1440),
  depositRequired: z.boolean().default(true),
  depositType: z.enum(['fixed', 'percentage']).optional(),
  depositAmount: z.number().positive().optional(),
});

// ================================
// Booking Validation Schemas
// ================================

export const bookingCreateSchema = z.object({
  serviceId: z.string().uuid(),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/, 'Invalid time format (HH:mm)'),
  specialRequests: z.string().max(1000).optional(),
});

// ================================
// Validation Helper
// ================================

export function validate<T>(schema: z.ZodSchema<T>, data: unknown): T {
  return schema.parse(data);
}
