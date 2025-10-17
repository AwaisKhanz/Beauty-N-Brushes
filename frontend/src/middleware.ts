import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { PUBLIC_ROUTES, AUTH_ROUTES } from '@/constants/routes';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  // Check if route is public or auth route
  const isPublicRoute = PUBLIC_ROUTES.some((route) => pathname.startsWith(route));
  const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

  // If trying to access protected route without token, redirect to login
  if (!token && !isPublicRoute) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If logged in and trying to access auth pages, redirect to home
  // Let client-side routing handle role-specific redirects
  if (token && isAuthRoute) {
    // Check if it's a verify-email page with token (allow this)
    if (pathname.startsWith('/verify-email/') && pathname.includes('/')) {
      return NextResponse.next();
    }

    // For other auth routes, redirect to home
    // The login page will redirect to role-specific dashboard
    return NextResponse.redirect(new URL('/', request.url));
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
