import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { randomBytes } from 'crypto';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    
    if (!email) {
      return NextResponse.json({ error: 'الرجاء إدخال البريد الإلكتروني' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return NextResponse.json({ error: 'هذا البريد الإلكتروني غير مسجل في النظام' }, { status: 404 });
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'هذا الحساب موقوف' }, { status: 403 });
    }

    const resetToken = randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry
      }
    });

    const resetUrl = `https://sfnaa.com/reset-password?token=${resetToken}`;

    try {
      const htmlContent = `
          <div dir="rtl" style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
            <h2 style="color: #2563eb;">مرحباً ${user.name}،</h2>
            <p>لقد تلقينا طلباً لإعادة تعيين كلمة المرور الخاصة بحسابك في سفانة نجد.</p>
            <p>يمكنك تغيير كلمة المرور عبر الضغط على الرابط التالي:</p>
            <p style="margin: 20px 0;">
              <a href="${resetUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">
                إعادة تعيين كلمة المرور
              </a>
            </p>
            <p style="color: #ef4444; font-size: 14px;">ملاحظة: هذا الرابط صالح لمدة ساعة واحدة فقط.</p>
            <p>إذا لم تقم بطلب هذا، يرجى تجاهل هذه الرسالة.</p>
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
            <p style="font-size: 12px; color: #666;">رسالة آلية من نظام سفانة نجد.</p>
          </div>
        `;

      await resend.emails.send({
        from: 'Safana Najd <info@sfnaa.com>',
        to: user.email,
        subject: 'استعادة كلمة المرور - سفانة نجد',
        html: htmlContent
      });

      await prisma.emailRecord.create({
        data: {
          from: 'info@sfnaa.com',
          to: user.email,
          subject: 'استعادة كلمة المرور - سفانة نجد',
          html: htmlContent,
          text: 'طلب إعادة تعيين كلمة المرور...',
          status: 'sent',
          isRead: true
        }
      });
    } catch (emailError) {
      console.error('Failed to send reset email:', emailError);
      return NextResponse.json({ error: 'حدث خطأ أثناء إرسال البريد الإلكتروني' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
