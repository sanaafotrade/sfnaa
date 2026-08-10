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

    // Generate a random impossible password and a setup token
    const impossiblePassword = randomBytes(32).toString('hex');
    const hashedPassword = hashPassword(impossiblePassword);
    
    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    const newUser = await prisma.user.create({
      data: {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: newUserRole || 'EMPLOYEE',
        permissions: permissions || [],
        resetToken,
        resetTokenExpiry,
      }
    });

    // Send Welcome Email
    try {
      const setupUrl = `https://sfnaa.com/reset-password?token=${resetToken}`;
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      background-color: #f4f4f5;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0,0,0,0.05);
      border: 1px solid #e4e4e7;
    }
    .header {
      background-color: #09090b;
      padding: 24px;
      text-align: center;
      border-bottom: 3px solid #3b82f6;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 24px;
      font-weight: 600;
      letter-spacing: -0.5px;
    }
    .content {
      padding: 32px 24px;
      color: #3f3f46;
      font-size: 16px;
      line-height: 1.6;
    }
    .btn {
      background-color: #2563eb;
      color: #ffffff !important;
      padding: 12px 24px;
      text-decoration: none;
      border-radius: 8px;
      display: inline-block;
      font-weight: bold;
      margin: 20px 0;
    }
    .info-box {
      background: #f8fafc;
      padding: 15px;
      border-radius: 8px;
      margin-top: 20px;
      border: 1px solid #e2e8f0;
    }
    .divider {
      border: none;
      border-top: 1px solid #e4e4e7;
      margin: 32px 0;
    }
    .en-section {
      direction: ltr;
      text-align: left;
    }
    .ar-section {
      direction: rtl;
      text-align: right;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>سفانة نجد | Safana Najd</h1>
    </div>
    <div class="content">
      <!-- Arabic Section -->
      <div class="ar-section">
        <h2 style="color: #2563eb; margin-top: 0;">مرحباً ${name}،</h2>
        <p>لقد تم إنشاء حساب لك في نظام <strong>سفانة نجد للتجارة</strong>.</p>
        <p><strong>يرجى النقر على الرابط أدناه لإعداد كلمة المرور الخاصة بك وتفعيل الحساب:</strong></p>
        <div style="text-align: center;">
          <a href="${setupUrl}" class="btn">إعداد كلمة المرور والدخول للنظام</a>
        </div>
        <div class="info-box">
          <p style="margin: 0;"><strong>البريد الإلكتروني:</strong> ${email.toLowerCase()}</p>
        </div>
        <p style="color: #ef4444; font-size: 14px; margin-bottom: 0;">ملاحظة: هذا الرابط صالح لمدة 7 أيام فقط.</p>
      </div>
      
      <hr class="divider" />
      
      <!-- English Section -->
      <div class="en-section">
        <h2 style="color: #2563eb; margin-top: 0;">Hello ${name},</h2>
        <p>An account has been created for you in the <strong>Safana Najd</strong> system.</p>
        <p><strong>Please click the link below to set up your password and activate your account:</strong></p>
        <div style="text-align: center;">
          <a href="${setupUrl}" class="btn">Set Password & Login</a>
        </div>
        <div class="info-box">
          <p style="margin: 0;"><strong>Email:</strong> ${email.toLowerCase()}</p>
        </div>
        <p style="color: #ef4444; font-size: 14px; margin-bottom: 0;">Note: This link is valid for 7 days only.</p>
      </div>
    </div>
  </div>
</body>
</html>
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
