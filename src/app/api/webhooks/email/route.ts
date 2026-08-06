import { NextResponse } from "next/server";
import { validateAttachment, isSpam } from "@/lib/security";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Resend sends the email in a specific structure
    const emailData = payload.data || payload;

    const from = emailData.from || "unknown";
    const to = emailData.to?.[0] || "unknown";
    const subject = emailData.subject || "No Subject";
    const text = emailData.text || "";
    const html = emailData.html || "";
    const attachments = emailData.attachments || [];

    // 1. فحص السبام
    let status = "inbox";
    if (isSpam(subject, text, from)) {
      status = "spam";
    }

    // 2. فحص قائمة الحظر والموثوقية
    const settings = await prisma.emailSettings.findUnique({ where: { id: "default" } });
    
    if (settings) {
      if (settings.blockedEmails.some(blocked => from.includes(blocked))) {
        status = "spam";
      } else if (settings.trustedEmails.some(trusted => from.includes(trusted))) {
        status = "inbox"; // الموثوق دائماً بالإنبوكس
      }
    }

    // 3. فحص المرفقات أمنياً
    const processedAttachments = [];
    for (const att of attachments) {
      const isSafe = validateAttachment(att.filename, att.contentType);
      
      processedAttachments.push({
        filename: att.filename,
        contentType: att.contentType,
        url: att.url, // Resend provides a URL for the attachment
        isSafe: isSafe
      });
    }

    // 4. حفظ الرسالة في قاعدة البيانات
    const newEmail = await prisma.emailRecord.create({
      data: {
        from,
        to,
        subject,
        text,
        html,
        attachments: processedAttachments,
        status,
        isRead: false,
        isStarred: false,
      }
    });

    // 5. الرد التلقائي (إذا كان مفعلاً ولم تكن رسالة سبام)
    if (settings?.autoReplyEnabled && status === "inbox") {
      try {
        const { Resend } = require("resend");
        const resend = new Resend(process.env.RESEND_API_KEY);
        
        await resend.emails.send({
          from: `${settings.autoReplyTeamName} <send@sfnaa.com>`,
          to: [from],
          subject: settings.autoReplySubject,
          text: settings.autoReplyBody,
        });
      } catch (e) {
        console.error("Auto-reply error:", e);
      }
    }

    return NextResponse.json({ success: true, emailId: newEmail.id });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: "Failed to process webhook" }, { status: 500 });
  }
}
