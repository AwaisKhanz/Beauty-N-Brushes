# Beauty N Brushes - Agent Rules & AI Development Preferences

## Purpose
This document defines how AI coding assistants (Cursor AI, GitHub Copilot, etc.) should interact with the Beauty N Brushes codebase to maintain consistency, quality, and best practices.

---

## Core Behavior Guidelines

### 1. Code Generation Philosophy

**ALWAYS:**
- Generate complete, production-ready code (not pseudo-code)
- Include proper TypeScript types for everything
- Add comprehensive error handling
- Follow the established patterns in the codebase
- Provide context and explanations for complex logic
- Consider edge cases and error scenarios
- Write self-documenting code with clear variable names

**NEVER:**
- Use `any` type unless absolutely necessary (use `unknown` instead)
- Generate code without proper validation
- Skip error handling
- Create security vulnerabilities
- Ignore accessibility requirements
- Write TODO comments for critical functionality
- Generate code that violates the established architecture

### 2. Response Style

When asked to implement a feature:

1. **First**: Clarify requirements if ambiguous
2. **Then**: Provide a brief implementation plan
3. **Finally**: Generate complete code with:
   - File path comments
   - Proper imports
   - Full implementation
   - Error handling
   - Types/interfaces
   - Comments for complex logic

**Example Response Format:**
```
I'll implement the booking creation feature with the following approach:

1. Create API endpoint with validation
2. Handle payment processing
3. Send confirmation notifications
4. Update provider availability

Here's the complete implementation:

// File: app/api/bookings/create/route.ts
[complete code]

// File: lib/booking/create-booking.ts
[complete code]

This implementation:
- Validates all inputs with Zod
- Uses database transactions for consistency
- Handles payment failures gracefully
- Sends email confirmations via SendGrid
```

### 3. File Organization

When creating new files:

**For Components:**
```typescript
// components/client/BookingForm.tsx

import { /* imports */ } from 'react';
import { /* UI components */ } from '@/components/ui';
import { /* types */ } from '@/types';

interface BookingFormProps {
  // prop types
}

export function BookingForm({ /* props */ }: BookingFormProps) {
  // implementation
}
```

**For API Routes:**
```typescript
// app/api/bookings/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { /* utilities */ } from '@/lib';

// Schema definitions
const BookingSchema = z.object({
  // schema
});

// Type inference
type BookingInput = z.infer<typeof BookingSchema>;

// Response type
type BookingResponse = {
  success: boolean;
  data?: Booking;
  error?: ApiError;
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<BookingResponse>> {
  // implementation
}
```

**For Utilities:**
```typescript
// lib/utils/format-price.ts

/**
 * Formats a price value for display
 * @param amount - The price amount
 * @param currency - Currency code (default: USD)
 * @returns Formatted price string (e.g., "$150.00")
 */
export function formatPrice(
  amount: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}
```

---

## Specific Implementation Patterns

### Pattern 1: Server Components (Default)

When creating page components:

```typescript
// app/(client)/services/[slug]/page.tsx

import { notFound } from 'next/navigation';
import { db } from '@/lib/db';
import { ServiceDetail } from '@/components/client/ServiceDetail';
import { BookingButton } from '@/components/client/BookingButton';

interface PageProps {
  params: { slug: string };
  searchParams: { [key: string]: string | string[] | undefined };
}

export async function generateMetadata({ params }: PageProps) {
  const service = await db.service.findUnique({
    where: { slug: params.slug },
  });
  
  if (!service) return {};
  
  return {
    title: `${service.title} - Beauty N Brushes`,
    description: service.description,
  };
}

export default async function ServicePage({ params }: PageProps) {
  const service = await db.service.findUnique({
    where: { slug: params.slug },
    include: {
      provider: true,
      media: true,
      reviews: {
        take: 5,
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  
  if (!service) {
    notFound();
  }
  
  return (
    <div className="page-container">
      <ServiceDetail service={service} />
      <BookingButton serviceId={service.id} />
    </div>
  );
}
```

### Pattern 2: Client Components (When Needed)

```typescript
// components/client/BookingCalendar.tsx

'use client';

import { useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { useAvailability } from '@/hooks/useAvailability';

interface BookingCalendarProps {
  providerId: string;
  serviceId: string;
  onDateSelect: (date: Date) => void;
}

export function BookingCalendar({
  providerId,
  serviceId,
  onDateSelect,
}: BookingCalendarProps) {
  const [selectedDate, setSelectedDate] = useState<Date>();
  
  const { data: availability, isLoading } = useAvailability({
    providerId,
    serviceId,
  });
  
  if (isLoading) {
    return <CalendarSkeleton />;
  }
  
  const handleSelect = (date: Date | undefined) => {
    if (date) {
      setSelectedDate(date);
      onDateSelect(date);
    }
  };
  
  return (
    <Calendar
      mode="single"
      selected={selectedDate}
      onSelect={handleSelect}
      disabled={(date) => !isDateAvailable(date, availability)}
      className="rounded-md border"
    />
  );
}

// Helper function
function isDateAvailable(
  date: Date,
  availability: Availability[]
): boolean {
  // implementation
  return true;
}
```

### Pattern 3: API Routes with Full Error Handling

```typescript
// app/api/services/create/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { db } from '@/lib/db';
import { AppError, ValidationError, UnauthorizedError } from '@/lib/errors';

// Schema
const CreateServiceSchema = z.object({
  title: z.string().min(3).max(255),
  description: z.string().min(20),
  priceMin: z.number().positive(),
  priceMax: z.number().positive().optional(),
  durationMinutes: z.number().min(15),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional(),
});

type CreateServiceInput = z.infer<typeof CreateServiceSchema>;

type ServiceResponse = {
  success: boolean;
  data?: Service;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<ServiceResponse>> {
  try {
    // 1. Authenticate
    const session = await auth(request);
    if (!session || session.user.role !== 'PROVIDER') {
      throw new UnauthorizedError('Provider access required');
    }
    
    // 2. Get provider profile
    const provider = await db.providerProfile.findUnique({
      where: { userId: session.user.id },
    });
    
    if (!provider) {
      throw new AppError(
        'PROVIDER_NOT_FOUND',
        'Provider profile not found',
        404
      );
    }
    
    // 3. Validate request body
    const body = await request.json();
    const serviceData = CreateServiceSchema.parse(body);
    
    // 4. Validate category exists
    const category = await db.serviceCategory.findUnique({
      where: { id: serviceData.categoryId },
    });
    
    if (!category) {
      throw new ValidationError('Invalid category ID');
    }
    
    // 5. Create service
    const service = await db.service.create({
      data: {
        ...serviceData,
        providerId: provider.id,
        slug: generateSlug(serviceData.title),
      },
      include: {
        category: true,
        subcategory: true,
      },
    });
    
    // 6. Log action
    await db.auditLog.create({
      data: {
        userId: session.user.id,
        action: 'service.created',
        entityType: 'service',
        entityId: service.id,
        newValues: service,
      },
    });
    
    return NextResponse.json(
      {
        success: true,
        data: service,
      },
      { status: 201 }
    );
  } catch (error) {
    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.errors,
          },
        },
        { status: 400 }
      );
    }
    
    // Handle custom app errors
    if (error instanceof AppError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: error.statusCode }
      );
    }
    
    // Handle unexpected errors
    console.error('Unexpected error in create service:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    );
  }
}

// Helper function
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
```

### Pattern 4: Custom Hooks

```typescript
// hooks/useBooking.ts

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { Booking, CreateBookingInput } from '@/types';

export function useBooking(bookingId: string) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => fetchBooking(bookingId),
    enabled: !!bookingId,
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: CreateBookingInput) => createBooking(data),
    onSuccess: (booking) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ 
        queryKey: ['provider-availability', booking.providerId] 
      });
      
      toast.success('Booking created successfully!');
    },
    onError: (error) => {
      if (error instanceof ApiError) {
        toast.error(error.message);
      } else {
        toast.error('Failed to create booking');
      }
      console.error('Booking creation error:', error);
    },
  });
}

// API functions
async function fetchBooking(id: string): Promise<Booking> {
  const response = await fetch(`/api/bookings/${id}`);
  if (!response.ok) {
    throw new ApiError('Failed to fetch booking');
  }
  const data = await response.json();
  return data.data;
}

async function createBooking(input: CreateBookingInput): Promise<Booking> {
  const response = await fetch('/api/bookings/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(data.error.message, data.error.code);
  }
  
  return data.data;
}
```

### Pattern 5: Form Components with React Hook Form

```typescript
// components/provider/ServiceForm.tsx

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Schema
const serviceFormSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  priceMin: z.coerce.number().positive('Price must be positive'),
  priceMax: z.coerce.number().positive().optional(),
  durationMinutes: z.coerce.number().min(15, 'Minimum duration is 15 minutes'),
  categoryId: z.string().uuid('Please select a category'),
}).refine(
  (data) => !data.priceMax || data.priceMax >= data.priceMin,
  {
    message: 'Maximum price must be greater than or equal to minimum price',
    path: ['priceMax'],
  }
);

type ServiceFormValues = z.infer<typeof serviceFormSchema>;

interface ServiceFormProps {
  initialData?: Partial<ServiceFormValues>;
  categories: Category[];
  onSubmit: (data: ServiceFormValues) => Promise<void>;
}

export function ServiceForm({
  initialData,
  categories,
  onSubmit,
}: ServiceFormProps) {
  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: {
      title: initialData?.title ?? '',
      description: initialData?.description ?? '',
      priceMin: initialData?.priceMin ?? 0,
      priceMax: initialData?.priceMax,
      durationMinutes: initialData?.durationMinutes ?? 60,
      categoryId: initialData?.categoryId ?? '',
    },
  });
  
  const handleSubmit = async (data: ServiceFormValues) => {
    try {
      await onSubmit(data);
      form.reset();
    } catch (error) {
      // Error is handled in the onSubmit function
      console.error('Form submission error:', error);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Service Title</FormLabel>
              <FormControl>
                <Input placeholder="e.g., Box Braids" {...field} />
              </FormControl>
              <FormDescription>
                A clear, descriptive name for your service
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Describe your service in detail..."
                  className="min-h-[100px]"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="priceMin"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Price ($)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="priceMax"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Price ($ optional)</FormLabel>
                <FormControl>
                  <Input type="number" step="0.01" {...field} />
                </FormControl>
                <FormDescription>
                  Leave blank for fixed pricing
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="durationMinutes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Duration (minutes)</FormLabel>
              <FormControl>
                <Input type="number" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="categoryId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a category" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button
          type="submit"
          className="w-full"
          disabled={form.formState.isSubmitting}
        >
          {form.formState.isSubmitting ? 'Saving...' : 'Save Service'}
        </Button>
      </form>
    </Form>
  );
}
```

---

## AI-Specific Instructions

### When Asked to "Add a Feature"

1. **Analyze**: Review existing code structure
2. **Plan**: Outline the implementation approach
3. **Implement**: Create all necessary files
4. **Integrate**: Show how to connect the feature
5. **Test**: Provide test examples

**Example Workflow:**
```
User: "Add ability to reschedule bookings"

Agent Response:
I'll implement the booking reschedule feature. Here's the plan:

1. Add reschedule API endpoint
2. Create client-side reschedule form
3. Update booking status logic
4. Send notification emails
5. Add audit logging

[Then provide complete implementation for each part]
```

### When Asked to "Fix a Bug"

1. **Understand**: Ask for error details if not provided
2. **Locate**: Identify the problematic code
3. **Explain**: Describe what's causing the issue
4. **Fix**: Provide the corrected code
5. **Prevent**: Suggest how to avoid similar issues

### When Asked to "Refactor Code"

1. **Analyze**: Identify code smells or issues
2. **Explain**: Describe why refactoring is beneficial
3. **Show**: Provide before/after comparison
4. **Preserve**: Maintain existing behavior
5. **Test**: Ensure tests still pass

### When Asked to "Optimize Performance"

1. **Profile**: Identify bottlenecks
2. **Prioritize**: Focus on high-impact optimizations
3. **Implement**: Apply optimization techniques
4. **Measure**: Explain expected improvements
5. **Document**: Add comments about optimization choices

---

## Code Quality Checklist

Before generating any code, ensure:

- [ ] TypeScript types are complete and strict
- [ ] Zod schemas validate all inputs
- [ ] Error handling covers all failure cases
- [ ] Component follows Server/Client pattern correctly
- [ ] Database queries are optimized (no N+1)
- [ ] Transactions used for related operations
- [ ] Authentication/authorization checked
- [ ] Loading and error states handled
- [ ] Accessibility attributes included
- [ ] Performance optimized (memoization, lazy loading)
- [ ] Security best practices followed
- [ ] Tests can be written for the code
- [ ] Code is self-documenting with clear names
- [ ] Comments explain WHY, not WHAT
- [ ] Follows established patterns in codebase

---

## Common Pitfalls to Avoid

### ❌ DON'T:
```typescript
// Don't use any
function process(data: any) {
  return data.value;
}

// Don't skip validation
export async function POST(req: Request) {
  const body = await req.json();
  // No validation - BAD!
  return createUser(body);
}

// Don't ignore errors
async function fetchData() {
  const data = await fetch('/api/data');
  return data.json(); // What if this fails?
}

// Don't create N+1 queries
const services = await db.service.findMany();
for (const service of services) {
  service.provider = await db.provider.findUnique({
    where: { id: service.providerId }
  });
}
```

### ✅ DO:
```typescript
// Use proper types
function process(data: { value: string }): string {
  return data.value;
}

// Always validate
const BodySchema = z.object({
  email: z.string().email(),
  name: z.string(),
});

export async function POST(req: Request) {
  const body = await req.json();
  const validated = BodySchema.parse(body);
  return createUser(validated);
}

// Handle errors properly
async function fetchData(): Promise<Data> {
  try {
    const response = await fetch('/api/data');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Failed to fetch data:', error);
    throw error;
  }
}

// Use includes to prevent N+1
const services = await db.service.findMany({
  include: {
    provider: {
      select: {
        id: true,
        businessName: true,
        slug: true,
      },
    },
  },
});
```

---

## Context-Aware Suggestions

### When Working with Forms:
- Always use React Hook Form + Zod
- Include proper validation messages
- Handle loading states
- Show success/error feedback
- Reset form after successful submission

### When Working with APIs:
- Validate input with Zod
- Check authentication/authorization
- Use proper HTTP status codes
- Return consistent response format
- Log errors appropriately
- Add rate limiting considerations

### When Working with Database:
- Use Prisma's type-safe queries
- Include relevant relations
- Add proper indexes
- Use transactions for related operations
- Consider query performance

### When Working with UI:
- Use Server Components by default
- Only use Client Components when needed
- Implement loading and error states
- Ensure accessibility
- Optimize images with Next.js Image
- Use Shadcn components without modification

---

## Final Reminders

1. **Always generate production-ready code** - No placeholders or TODOs for critical functionality
2. **Follow the patterns in the codebase** - Consistency is key
3. **Explain your decisions** - Help developers understand the "why"
4. **Consider the full picture** - Think about error cases, edge cases, and user experience
5. **Prioritize security and performance** - These are non-negotiable
6. **Write maintainable code** - Future developers (including the AI) will thank you

---

**Document Version**: 1.0  
**Last Updated**: October 6, 2025  
**For**: Beauty N Brushes Development Team