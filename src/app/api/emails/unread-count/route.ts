import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    const count = await prisma.emailRecord.count({
      where: {
        status: "inbox",
        isRead: false,
      },
    });
    
    return NextResponse.json({ count });
  } catch (error) {
    console.error("Failed to fetch unread count:", error);
    return NextResponse.json({ count: 0 }, { status: 500 });
  }
}
