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
    } else {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to perform bulk action:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
