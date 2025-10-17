'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Lock, ArrowLeft, AlertCircle, Sparkles, CheckCircle } from 'lucide-react';
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
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Must contain at least one uppercase letter')
      .regex(/[a-z]/, 'Must contain at least one lowercase letter')
      .regex(/[0-9]/, 'Must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Must contain at least one special character'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const { validateResetToken, resetPassword } = useAuth();

  const token = searchParams.get('token');

  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset token');
      setTokenValid(false);
      return;
    }

    // Validate token
    const validateToken = async () => {
      try {
        const isValid = await validateResetToken(token);
        setTokenValid(isValid);
        if (!isValid) {
          setError('Invalid or expired reset token');
        }
      } catch (err) {
        setError('Invalid or expired reset token');
        setTokenValid(false);
      }
    };

    validateToken();
  }, [token, validateResetToken]);

  async function onSubmit(values: ResetPasswordFormValues) {
    if (!token) return;

    try {
      setLoading(true);
      setError('');

      await resetPassword(token!, {
        password: values.password,
        confirmPassword: values.confirmPassword,
      });

      setSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (tokenValid === false) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-destructive/10 mb-4">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
            Invalid Reset Link
          </h1>
          <p className="text-muted-foreground text-sm">
            This password reset link is invalid or has expired.
          </p>
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-4">
          <Link href="/forgot-password">
            <Button variant="outline" className="w-full">
              Request New Reset Link
            </Button>
          </Link>

          <Link
            href="/login"
            className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
          >
            <ArrowLeft className="mr-1 w-4 h-4" />
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
            Password Reset Successfully
          </h1>
          <p className="text-muted-foreground text-sm">
            Your password has been updated. You can now sign in with your new password.
          </p>
        </div>

        <Link href="/login">
          <Button variant="dark" className="w-full">
            Sign In
          </Button>
        </Link>
      </div>
    );
  }

  if (tokenValid === null) {
    return (
      <div className="space-y-8">
        <div className="space-y-2 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <Sparkles className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
            Validating Reset Link
          </h1>
          <p className="text-muted-foreground text-sm">
            Please wait while we validate your reset link...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
          <Sparkles className="w-8 h-8 text-primary" />
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Reset Your Password
        </h1>
        <p className="text-muted-foreground text-sm">Enter your new password below</p>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Reset Password Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">New Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...field}
                      disabled={loading}
                    />
                  </div>
                </FormControl>
                <FormDescription className="text-xs text-muted-foreground">
                  Must be at least 8 characters with uppercase, lowercase, number, and special
                  character
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Confirm Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="password"
                      placeholder="••••••••"
                      className="pl-10"
                      {...field}
                      disabled={loading}
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" variant="dark" className="w-full h-11" disabled={loading}>
            {loading ? (
              <>
                <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-button-dark-foreground border-t-transparent" />
                Updating Password...
              </>
            ) : (
              'Update Password'
            )}
          </Button>
        </form>
      </Form>

      {/* Back to Login */}
      <div className="text-center">
        <Link
          href="/login"
          className="inline-flex items-center text-sm text-primary hover:text-primary/80 transition-colors"
        >
          <ArrowLeft className="mr-1 w-4 h-4" />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
