'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { Logo } from '@/components/shared/Logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { getDashboardRoute } from '@/constants';
import { extractErrorMessage } from '@/lib/error-utils';

const loginSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  async function onSubmit(values: LoginFormValues) {
    try {
      setLoading(true);

      const user = await login({ email: values.email, password: values.password });

      // Check if there's a redirect URL stored (from failed API calls)
      const redirectUrl = localStorage.getItem('redirectAfterLogin');

      if (redirectUrl) {
        localStorage.removeItem('redirectAfterLogin');
        router.push(redirectUrl);
      } else {
        // Default: redirect based on role
        router.push(getDashboardRoute(user.role));
      }
    } catch (error: unknown) {
      toast.error('Login failed', {
        description: extractErrorMessage(error) || 'Invalid email or password',
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-heading font-bold text-foreground tracking-tight">
          Welcome Back
        </h1>
        <p className="text-muted-foreground text-sm">Sign in to continue to</p>
        <p className="flex justify-center items-center ">
          <Logo size="md" showText />
        </p>
      </div>

      {/* Login Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Email Address</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="email"
                      placeholder="you@example.com"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium">Password</FormLabel>
                  <Link
                    href="/forgot-password"
                    className="text-xs text-primary hover:text-primary/80 transition-colors"
                  >
                    Forgot password?
                  </Link>
                </div>
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
                Signing in...
              </>
            ) : (
              'Sign In'
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
          <span className="bg-background px-2 text-muted-foreground">New to Beauty N Brushes?</span>
        </div>
      </div>

      {/* Register Link */}
      <div className="text-center">
        <Link
          href="/register"
          className="inline-flex items-center justify-center text-sm font-medium text-primary hover:text-primary/80 transition-colors"
        >
          Create an account
          <ArrowRight className="ml-1 w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
