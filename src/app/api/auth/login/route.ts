import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Verify password against process.env.ADMIN_PASSWORD
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin'; // fallback for dev if needed
    
    if (password !== adminPassword) {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(adminPassword);
    
    const token = await new SignJWT({ role: 'admin' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('24h')
      .sign(secret);

    const response = NextResponse.json({ success: true }, { status: 200 });
    
    response.cookies.set('admin_session', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 // 24 hours
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
