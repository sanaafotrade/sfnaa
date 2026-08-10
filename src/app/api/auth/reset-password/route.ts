import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes, scryptSync } from 'crypto';

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hashedBuffer = scryptSync(password, salt, 64);
  return `${salt}:${hashedBuffer.toString('hex')}`;
};

export async function POST(request: Request) {
  try {
    const { token, newPassword } = await request.json();
    
    if (!token || !newPassword) {
      return NextResponse.json({ error: 'بيانات غير مكتملة' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { resetToken: token }
    });

    if (!user) {
      return NextResponse.json({ error: 'الرابط غير صالح أو غير موجود' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'هذا الحساب موقوف' }, { status: 403 });
    }

    if (!user.resetTokenExpiry || user.resetTokenExpiry < new Date()) {
      return NextResponse.json({ error: 'انتهت صلاحية الرابط' }, { status: 400 });
    }

    const hashedPassword = hashPassword(newPassword);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null
      }
    });

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
