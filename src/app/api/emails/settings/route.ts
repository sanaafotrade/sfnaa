import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    let settings = await prisma.emailSettings.findUnique({
      where: { id: "default" }
    });

    if (!settings) {
      settings = await prisma.emailSettings.create({
        data: {
          id: "default",
          senderName: "سفانة نجد",
          signatureEnabled: true,
          signature: "هذه رسالة تلقائية من نظام سفانة نجد للتجارة.\nThis is an automated message from Safana Najd Trading."
        }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch settings:", error);
    return NextResponse.json({ error: "Failed to fetch settings" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const settings = await prisma.emailSettings.upsert({
      where: { id: "default" },
      update: {
        senderName: data.senderName,
        signatureEnabled: data.signatureEnabled,
        signature: data.signature,
        autoReplyEnabled: data.autoReplyEnabled,
        autoReplySubject: data.autoReplySubject,
        autoReplyBody: data.autoReplyBody,
        autoReplyTeamName: data.autoReplyTeamName,
      },
      create: {
        id: "default",
        senderName: data.senderName || "سفانة نجد",
        signatureEnabled: data.signatureEnabled ?? true,
        signature: data.signature || "",
        autoReplyEnabled: data.autoReplyEnabled ?? false,
        autoReplySubject: data.autoReplySubject || "",
        autoReplyBody: data.autoReplyBody || "",
        autoReplyTeamName: data.autoReplyTeamName || "",
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update settings:", error);
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 });
  }
}
