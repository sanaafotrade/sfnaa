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

    // Send the email via Resend
    const { data, error } = await resend.emails.send({
      from: "سفانة نجد <send@sfnaa.com>", // Using the verified sending domain
      to: [to],
      subject: subject,
      text: text,
      attachments: resendAttachments.length > 0 ? resendAttachments : undefined,
    });

    if (error) {
      console.error("Resend API Error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Save to Prisma (Sent folder)
    const savedEmail = await prisma.emailRecord.create({
      data: {
        from: "سفانة نجد <send@sfnaa.com>",
        to: to,
        subject: subject,
        text: text,
        html: `<p>${text.replace(/\\n/g, "<br>")}</p>`, // Simple text to HTML
        status: "sent",
        isRead: true, // Sent emails are naturally read by sender
        attachments: attachments || [],
      }
    });

    return NextResponse.json({ success: true, id: savedEmail.id, data });
  } catch (error) {
    console.error("Failed to send email:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
