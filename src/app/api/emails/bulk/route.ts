import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, ids } = body;

    if (!action || !ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.emailRecord.updateMany({
        where: { id: { in: ids } },
        data: { status: "trash" }
      });
    } else if (action === "hardDelete") {
      await prisma.emailRecord.deleteMany({
        where: { id: { in: ids } },
      });
    } else if (action === "markRead") {
      await prisma.emailRecord.updateMany({
        where: { id: { in: ids } },
        data: { isRead: true },
      });
    } else if (action === "markUnread") {
      await prisma.emailRecord.updateMany({
        where: { id: { in: ids } },
        data: { isRead: false },
      });
    } else if (action === "toggleStar") {
      // We need to fetch the current state first
      const email = await prisma.emailRecord.findUnique({ where: { id: ids[0] } });
      if (email) {
        await prisma.emailRecord.update({
          where: { id: ids[0] },
          data: { isStarred: !email.isStarred },
        });
      }
    } else if (action === "blockSender") {
      const email = await prisma.emailRecord.findUnique({ where: { id: ids[0] } });
      if (email) {
        // Extract plain email from "Name <email@domain.com>"
        const emailMatch = email.from.match(/<([^>]+)>/);
        const plainEmail = emailMatch ? emailMatch[1] : email.from;
        
        const settings = await prisma.emailSettings.findUnique({ where: { id: "default" } });
        if (settings && !settings.blockedEmails.includes(plainEmail)) {
          await prisma.emailSettings.update({
            where: { id: "default" },
            data: {
              blockedEmails: {
                push: plainEmail
              }
            }
          });
        }
        
        // Move all existing emails from this sender to spam folder
        await prisma.emailRecord.updateMany({
          where: { from: { contains: plainEmail } },
          data: { status: "spam" }
        });
      }
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to perform bulk action:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
