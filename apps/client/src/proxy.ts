import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { COOKIE_NAME } from '@rona/config/auth';
import { CLIENT_AUTH_SIGNIN_PAGE, CLIENT_DASHBOARD_PAGE } from '@rona/routes/auth';

export function middleware(request: NextRequest) {
  const token = request.cookies.get(COOKIE_NAME)?.value;
  const { pathname } = request.nextUrl;

  const isAuthPage = pathname.startsWith('/sign-in') || pathname.startsWith('/auth/');
  const isDashboardPage = pathname.startsWith('/dashboard');

  if (!token && isDashboardPage) {
    return NextResponse.redirect(new URL(CLIENT_AUTH_SIGNIN_PAGE, request.url));
  }

  if (token && isAuthPage && !pathname.includes('google/callback') && !pathname.includes('error')) {
    return NextResponse.redirect(new URL(CLIENT_DASHBOARD_PAGE, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
