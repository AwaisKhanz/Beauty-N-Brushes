'use client';

import { Check } from 'lucide-react';
import { GuestGuard } from '@/components/auth/GuestGuard';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <GuestGuard>
      <div className="min-h-screen grid lg:grid-cols-2">
        {/* Left Side - Auth Form */}
        <div className="flex items-center justify-center p-8 bg-background">
          <div className="w-full max-w-md">{children}</div>
        </div>

        {/* Right Side - Brand Visual */}
        <div className="hidden lg:flex flex-col justify-between p-12 relative overflow-hidden">
          {/* Clean gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-secondary to-accent"></div>

          {/* Subtle decorative elements */}
          <div className="absolute top-20 right-20 w-64 h-64 bg-primary-foreground/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 left-20 w-80 h-80 bg-primary-foreground/5 rounded-full blur-3xl"></div>

          <div className="relative z-10">
            <h1 className="mb-4 text-4xl font-bold text-primary-foreground">Beauty N Brushes</h1>
            <p className="text-primary-foreground/90 text-lg max-w-md leading-relaxed">
              AI-powered, visual-first beauty services marketplace connecting clients with beauty
              professionals
            </p>
          </div>

          <div className="relative z-10 space-y-8">
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-primary-foreground font-semibold text-lg">
                    Visual-First Booking
                  </h3>
                  <p className="text-primary-foreground/80">
                    See real work examples before you book
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-primary-foreground font-semibold text-lg">
                    AI-Powered Matching
                  </h3>
                  <p className="text-primary-foreground/80">
                    Upload inspiration photos and find your perfect match
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-full bg-primary-foreground/20 backdrop-blur flex items-center justify-center flex-shrink-0">
                  <Check className="w-6 h-6 text-primary-foreground" />
                </div>
                <div>
                  <h3 className="text-primary-foreground font-semibold text-lg">
                    Trusted Professionals
                  </h3>
                  <p className="text-primary-foreground/80">
                    Verified beauty experts with real reviews
                  </p>
                </div>
              </div>
            </div>

            <p className="text-primary-foreground/60 text-sm">
              © 2025 Beauty N Brushes. All rights reserved.
            </p>
          </div>
        </div>
      </div>
    </GuestGuard>
  );
}
