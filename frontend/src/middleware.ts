import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Since we're using HTTP-only cookies for authentication,
  // we can't access them in middleware. Let AuthGuard handle all auth logic.
  // This middleware only handles basic redirects for auth pages.

  const { pathname } = request.nextUrl;

  // Only redirect if accessing auth pages while potentially logged in
  // Let AuthGuard handle the actual authentication logic
  if (pathname.startsWith('/login') || pathname.startsWith('/register')) {
    // Allow access to auth pages - AuthGuard will handle redirects
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only run on auth pages to avoid conflicts with AuthGuard
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
  ],
};
