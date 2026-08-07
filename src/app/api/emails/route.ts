import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const tab = searchParams.get("tab") || "inbox";
    const search = searchParams.get("search") || "";

    let whereClause: any = {};
    if (tab === "inbox") whereClause = { status: "inbox" };
    else if (tab === "sent") whereClause = { status: "sent" };
    else if (tab === "starred") whereClause = { isStarred: true };
    else if (tab === "spam") whereClause = { status: "spam" };
    else if (tab === "trash") whereClause = { status: "trash" };

    if (search) {
      whereClause.OR = [
        { subject: { contains: search, mode: "insensitive" } },
        { from: { contains: search, mode: "insensitive" } },
        { to: { contains: search, mode: "insensitive" } },
      ];
    }

    const emails = await prisma.emailRecord.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(emails);
  } catch (error) {
    console.error("Failed to fetch emails:", error);
    return NextResponse.json([], { status: 500 });
  }
}
