import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';
import { randomBytes, scryptSync } from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const hashPassword = (password: string) => {
  const salt = randomBytes(16).toString('hex');
  const hashedBuffer = scryptSync(password, salt, 64);
  return `${salt}:${hashedBuffer.toString('hex')}`;
};

async function getAuthRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'safana_najd_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    return payload.role as string;
  } catch {
    return null;
  }
}

export async function GET() {
  const role = await getAuthRole();
  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        permissions: true,
        isActive: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(users);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const role = await getAuthRole();
  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, email, role: newUserRole, permissions } = data;

    if (!name || !email) {
      return NextResponse.json({ error: 'الاسم والبريد الإلكتروني مطلوبان' }, { status: 400 });
    }

    // Generate a random temporary password
    const temporaryPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = hashPassword(temporaryPassword);

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: newUserRole || 'EMPLOYEE',
        permissions: permissions || [],
      }
    });

    // Send Welcome Email
    try {
      const htmlContent = `
          <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2563eb;">مرحباً ${name}،</h2>
            <p>لقد تم إنشاء حساب لك في نظام <strong>سفانة نجد للتجارة</strong>.</p>
            <p><strong>معلومات الدخول الخاصة بك:</strong></p>
            <ul style="background: #f8fafc; padding: 15px 35px; border-radius: 8px;">
              <li>البريد الإلكتروني: <strong>${email.toLowerCase()}</strong></li>
              <li>كلمة المرور المؤقتة: <strong style="color: #eab308; background: #fefce8; padding: 2px 6px; border-radius: 4px;">${temporaryPassword}</strong></li>
            </ul>
            <p style="color: #ef4444; font-weight: bold; font-size: 14px;">ملاحظة: يرجى تغيير كلمة المرور فور دخولك للنظام لأول مرة.</p>
            <p style="margin: 20px 0;">
              <a href="https://sfnaa.com/login" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                تسجيل الدخول للنظام
              </a>
            </p>
          </div>
        `;

      await resend.emails.send({
        from: 'Safana Najd <info@sfnaa.com>',
        to: email,
        subject: 'مرحباً بك في منصة سفانة نجد للتجارة',
        html: htmlContent
      });

      // Save to DB so it appears in Inbox/Sent
      await prisma.emailRecord.create({
        data: {
          from: 'info@sfnaa.com',
          to: email,
          subject: 'مرحباً بك في منصة سفانة نجد للتجارة',
          html: htmlContent,
          text: 'لقد تم إنشاء حساب لك في نظام سفانة نجد للتجارة...',
          status: 'sent',
          isRead: true
        }
      });
    } catch (emailError) {
      console.error('Failed to send email:', emailError);
      // We don't fail the user creation if email fails, but we might want to log it
    }

    const { password: _, ...userWithoutPassword } = newUser;
    return NextResponse.json(userWithoutPassword, { status: 201 });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'البريد الإلكتروني مسجل مسبقاً' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
