import { NextResponse } from "next/server";

export async function GET(req: Request, { params }: { params: Promise<{ emailId: string, attachmentId: string }> }) {
  try {
    const { emailId, attachmentId } = await params;
    
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    // Call Resend API to get the attachment details
    // We try the standard get attachment endpoint
    const res = await fetch(`https://api.resend.com/emails/${emailId}/attachments/${attachmentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`
      }
    });

    if (res.ok) {
      const data = await res.json();
      // If it returns a download URL, redirect to it
      if (data.download_url) {
        return NextResponse.redirect(data.download_url);
      }
      
      // If it returns base64 content, decode and return it
      if (data.content) {
        const buffer = Buffer.from(data.content, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": data.content_type || "application/octet-stream",
            "Content-Disposition": `inline; filename="${data.filename || 'attachment'}"`
          }
        });
      }
    }

    // Fallback if the standard endpoint fails, try the receiving namespace if it exists
    const receivingRes = await fetch(`https://api.resend.com/emails/receiving/${emailId}/attachments/${attachmentId}`, {
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`
      }
    });

    if (receivingRes.ok) {
      const data = await receivingRes.json();
      if (data.download_url) return NextResponse.redirect(data.download_url);
      if (data.content) {
        const buffer = Buffer.from(data.content, "base64");
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": data.content_type || "application/octet-stream",
            "Content-Disposition": `inline; filename="${data.filename || 'attachment'}"`
          }
        });
      }
    }

    return NextResponse.json({ error: "Attachment not found or expired" }, { status: 404 });
  } catch (error) {
    console.error("Failed to fetch attachment:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
