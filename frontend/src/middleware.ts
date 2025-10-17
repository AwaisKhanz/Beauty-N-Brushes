import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Public routes that don't require authentication
  const publicRoutes = [
    '/',
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/verify-email',
    '/search',
    '/about',
    '/for-providers',
  ];
  const isPublicRoute = publicRoutes.some((route) => pathname.startsWith(route));

  // Auth routes that should redirect if already logged in
  const authRoutes = ['/login', '/register', '/forgot-password', '/reset-password'];
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // If trying to access protected route without token, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access auth pages, redirect to appropriate dashboard
  if (token && isAuthRoute) {
    // Check if it's a verify-email page with token (allow this)
    if (pathname.startsWith('/verify-email/') && pathname.includes('/')) {
      return NextResponse.next();
    }

    // For other auth routes, redirect to dashboard
    return NextResponse.redirect(new URL('/client/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
