import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { Resend } from "resend";

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const resend = new Resend(process.env.RESEND_API_KEY || "missing");

    // Resend webhook payload structure
    if (payload.type === "email.received" && payload.data) {
      const emailData = payload.data;
      
      const toField = Array.isArray(emailData.to) ? emailData.to.join(", ") : (emailData.to || "");
      
      // The webhook payload only contains metadata. We must fetch the actual content.
      let textContent = "";
      let htmlContent = "";
      
      if (emailData.email_id && process.env.RESEND_API_KEY) {
        try {
          // Use standard fetch to ensure we hit the correct /emails/receiving endpoint
          // as some SDK versions might not fully support inbound emails yet.
          const res = await fetch(`https://api.resend.com/emails/receiving/${emailData.email_id}`, {
            headers: {
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
              "Content-Type": "application/json",
            }
          });
          
          if (res.ok) {
            const fetchedEmail = await res.json();
            textContent = fetchedEmail.text || "";
            htmlContent = fetchedEmail.html || "";
          } else {
            console.error("Failed to fetch inbound email, status:", res.status);
          }
        } catch (fetchError) {
          console.error("Failed to fetch email content:", fetchError);
        }
      }
      
      // Save incoming email to Inbox
      await prisma.emailRecord.create({
        data: {
          from: emailData.from || "unknown@sender.com",
          to: toField,
          subject: emailData.subject || "No Subject",
          text: textContent,
          html: htmlContent,
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
