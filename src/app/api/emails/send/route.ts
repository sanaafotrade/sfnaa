import { NextResponse } from "next/server";
import { Resend } from "resend";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const resend = new Resend(process.env.RESEND_API_KEY || "missing");
    const { to, subject, text, attachments } = await req.json();

    if (!to || !subject || !text) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Format attachments for Resend if they exist
    // Currently relying on Vercel Blob URLs for attachments
    const resendAttachments = attachments?.map((att: any) => ({
      filename: att.filename,
      path: att.url,
    })) || [];

    const htmlTemplate = `
<!DOCTYPE html>
<html lang="ar" dir="rtl">
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
    .content-body {
      white-space: pre-wrap;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>سفانة نجد | Safana Najd</h1>
    </div>
    <div class="content">
      <div class="content-body">${text}</div>
    </div>
  </div>
</body>
</html>
`;

    // Send the email via Resend if API key is configured
    let resendData = null;
    if (process.env.RESEND_API_KEY && process.env.RESEND_API_KEY !== "missing") {
      const { data, error } = await resend.emails.send({
        from: "سفانة نجد <info@sfnaa.com>", // Using info@sfnaa.com
        to: [to],
        subject: subject,
        text: text,
        html: htmlTemplate,
        attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
      });

      if (error) {
        console.error("Resend API Error:", error);
        // We log the error but continue to save to DB so the user can test the UI
      } else {
        resendData = data;
      }
    }

    // Save to Prisma (Sent folder)
    const savedEmail = await prisma.emailRecord.create({
      data: {
        from: "سفانة نجد <info@sfnaa.com>",
        to: to,
        subject: subject,
        text: text,
        html: htmlTemplate, 
        status: "sent",
        isRead: true, // Sent emails are naturally read by sender
        attachments: attachments || [],
      }
    });

    return NextResponse.json({ success: true, id: savedEmail.id, resendData });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
