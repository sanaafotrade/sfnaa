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
      const secret = new TextEncoder().encode(process.env.ADMIN_PASSWORD || 'admin');
      await jwtVerify(token, secret);
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
