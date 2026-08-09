import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('admin_session')?.value;
  const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard');

  if (isDashboardPath) {
    if (!token) {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    try {
      const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'safana_najd_secret_key_2026');
      const { payload } = await jwtVerify(token, secret);
      
      const role = payload.role as string;
      const permissions = (payload.permissions as string[]) || [];
      const path = request.nextUrl.pathname;
      
      // Enforce route restrictions
      if (role === 'EMPLOYEE') {
        if (path.startsWith('/dashboard/users')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (path.startsWith('/dashboard/inbox') && !permissions.includes('email')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (path.startsWith('/dashboard/settings') && !permissions.includes('settings')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (path.startsWith('/dashboard/services') && !permissions.includes('services')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
        if (path.startsWith('/dashboard/partners') && !permissions.includes('partners')) {
          return NextResponse.redirect(new URL('/dashboard', request.url));
        }
      }

      return NextResponse.next();
    } catch (error) {
      // Invalid token
      const response = NextResponse.redirect(new URL('/login', request.url));
      response.cookies.delete('admin_session');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
