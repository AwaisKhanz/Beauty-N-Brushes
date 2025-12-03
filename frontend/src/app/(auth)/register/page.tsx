'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, User, Briefcase, Users, Sparkles, Check, ArrowRight, UserPlus } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { extractErrorMessage } from '@/lib/error-utils';
import { cn } from '@/lib/utils';

const registerSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
  firstName: z.string().min(2, 'First name must be at least 2 characters'),
  lastName: z.string().min(2, 'Last name must be at least 2 characters'),
  role: z.enum(['CLIENT', 'PROVIDER'] as const),
});

type RegisterFormValues = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();

  // Extract invitation context from URL
  const invitationId = searchParams.get('invitation');
  const invitedEmail = searchParams.get('email');
  const salonName = searchParams.get('salon');
  const invitedRole = searchParams.get('role');

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: invitedEmail || '',
      password: '',
      firstName: '',
      lastName: '',
      role: invitationId ? 'CLIENT' : 'CLIENT', // Team members start as CLIENT, will be upgraded to PROVIDER on acceptance
    },
  });

  const selectedRole = form.watch('role');

  async function onSubmit(values: RegisterFormValues) {
    try {
      setLoading(true);

      const user = await register({
        firstName: values.firstName,
        lastName: values.lastName,
        email: values.email,
        password: values.password,
        role: values.role,
      });

      // If from invitation, redirect to verify email with instruction to use invitation link for login
      if (invitationId) {
        router.push(
          `/verify-email?email=${encodeURIComponent(user.email)}&invitation=${invitationId}&salon=${encodeURIComponent(salonName || '')}`
        );
      } else {
        // Normal flow - redirect to verify email page
        router.push(`/verify-email?email=${encodeURIComponent(user.email)}`);
      }
    } catch (error: unknown) {
      toast.error('Registration failed', {
        description: extractErrorMessage(error) || 'Please try again',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Invitation Banner */}
      {invitationId && salonName && (
        <Alert className="border-primary bg-primary/5">
          <UserPlus className="h-5 w-5 text-primary" />
          <div>
            <AlertTitle className="text-primary">Team Invitation</AlertTitle>
            <AlertDescription>
              You've been invited to join <strong>{salonName}</strong>
              {invitedRole && ` as a ${invitedRole}`}. Complete your signup to accept the invitation.
            </AlertDescription>
          </div>
        </Alert>
      )}


      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Join Beauty N Brushes
        </h1>
        <p className="text-muted-foreground text-sm">Create your account and get started today</p>
      </div>

      {/* Registration Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          {/* Role Selection - Hide if from invitation */}
          {!invitationId && (
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                <FormLabel className="text-sm font-medium">I want to</FormLabel>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => field.onChange('CLIENT')}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        selectedRole === 'CLIENT'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      {selectedRole === 'CLIENT' && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <Users
                        className={cn(
                          'w-6 h-6',
                          selectedRole === 'CLIENT' ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <div className="text-center">
                        <p className="font-medium text-sm">Book Services</p>
                        <p className="text-xs text-muted-foreground">I'm a client</p>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => field.onChange('PROVIDER')}
                      className={cn(
                        'relative flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                        selectedRole === 'PROVIDER'
                          ? 'border-primary bg-primary/5'
                          : 'border-border bg-card hover:border-primary/50'
                      )}
                    >
                      {selectedRole === 'PROVIDER' && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                          <Check className="w-3 h-3 text-primary-foreground" />
                        </div>
                      )}
                      <Briefcase
                        className={cn(
                          'w-6 h-6',
                          selectedRole === 'PROVIDER' ? 'text-primary' : 'text-muted-foreground'
                        )}
                      />
                      <div className="text-center">
                        <p className="font-medium text-sm">Offer Services</p>
                        <p className="text-xs text-muted-foreground">I'm a provider</p>
                      </div>
                    </button>
                  </div>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

          {/* Name Fields */}
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">First Name</FormLabel>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <FormControl>
                      <Input placeholder="Jane" className="pl-10" {...field} disabled={loading} />
                    </FormControl>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">Last Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Doe" {...field} disabled={loading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Email */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="you@example.com"
                      className={cn('pl-10', invitedEmail && 'bg-muted')}
                      {...field}
                      disabled={loading || !!invitedEmail}
                    />
                  </FormControl>
                </div>
                {invitedEmail && (
                  <FormDescription className="text-xs">
                    This email is required for your team invitation
                  </FormDescription>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Password */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Password</FormLabel>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...field}
                      disabled={loading}
                    />
                  </FormControl>
                </div>
                <FormDescription className="text-xs">
                  8+ characters with uppercase, lowercase, number & special character
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" variant="dark" className="w-full h-11" disabled={loading}>
            {loading ? (
              <span className="flex items-center">
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-button-dark-foreground border-t-transparent" />
                Creating account...
              </span>
            ) : (
              'Create Account'
            )}
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">Already have an account?</span>
        </div>
      </div>

      {/* Login Link */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Sign in instead
          <ArrowRight className="ml-1 w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
