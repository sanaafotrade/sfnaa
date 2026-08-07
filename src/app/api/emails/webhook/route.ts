import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const payload = await req.json();

    // Resend webhook payload structure
    if (payload.type === "email.received" && payload.data) {
      const emailData = payload.data;
      
      const toField = Array.isArray(emailData.to) ? emailData.to.join(", ") : (emailData.to || "");
      
      // Save incoming email to Inbox
      await prisma.emailRecord.create({
        data: {
          from: emailData.from || "unknown@sender.com",
          to: toField,
          subject: emailData.subject || "No Subject",
          text: emailData.text || "",
          html: emailData.html || "",
          status: "inbox",
          isRead: false,
          attachments: emailData.attachments || [],
        }
      });

      return NextResponse.json({ success: true, message: "Email received and saved." }, { status: 200 });
    }

    return NextResponse.json({ success: false, message: "Invalid payload type." }, { status: 400 });
  } catch (error) {
    console.error("Webhook Error:", error);
    return NextResponse.json({ success: false, error: "Internal Server Error" }, { status: 500 });
  }
}
