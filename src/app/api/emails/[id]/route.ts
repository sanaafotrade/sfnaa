import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();

    if (typeof body.isRead !== "boolean") {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const updatedEmail = await prisma.emailRecord.update({
      where: { id },
      data: { isRead: body.isRead },
    });

    return NextResponse.json({ success: true, email: updatedEmail });
  } catch (error) {
    console.error("Failed to update email:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
