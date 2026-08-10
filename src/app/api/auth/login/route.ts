import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import prisma from '@/lib/prisma';
import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hashedBuffer = scryptSync(password, salt, 64);
  return `${salt}:${hashedBuffer.toString('hex')}`;
};

const verifyPassword = (password: string, hash: string) => {
  const [salt, key] = hash.split(':');
  const hashedBuffer = scryptSync(password, salt, 64);
  const keyBuffer = Buffer.from(key, 'hex');
  const match = timingSafeEqual(hashedBuffer, keyBuffer);
  return match;
};

export async function POST(request: Request) {
  try {
    const { loginId, password } = await request.json();
    
    if (!loginId || !password) {
      return NextResponse.json({ error: 'الرجاء إدخال البريد الإلكتروني (أو رقم الجوال) وكلمة المرور' }, { status: 400 });
    }

    // Default admin creation if no users exist
    const usersCount = await prisma.user.count();
    if (usersCount === 0) {
      const hashedPassword = hashPassword('admin123');
      await prisma.user.create({
        data: {
          email: 'Saadalfhaid@gmail.com',
          password: hashedPassword,
          name: 'سعد الفهيد',
          role: 'OWNER',
          permissions: ['email', 'settings', 'services', 'partners', 'users'],
        }
      });
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: loginId.toLowerCase() },
          { phone: loginId }
        ]
      }
    });

    if (!user || !user.isActive) {
      return NextResponse.json({ error: 'البيانات غير صحيحة أو الحساب موقوف' }, { status: 401 });
    }

    const isValidPassword = verifyPassword(password, user.password);
    if (!isValidPassword) {
      return NextResponse.json({ error: 'البيانات غير صحيحة' }, { status: 401 });
    }

    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'safana_najd_secret_key_2026');
    
    const token = await new SignJWT({ 
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      permissions: user.permissions
    })
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
    console.error("Login error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
