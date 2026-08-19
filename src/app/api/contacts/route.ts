import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { email, name, phone } = await req.json();

    if (!email || !name) {
      return NextResponse.json({ error: "البريد والاسم مطلوبان" }, { status: 400 });
    }

    const contact = await prisma.contact.upsert({
      where: { email },
      update: { name, phone },
      create: { email, name, phone }
    });

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Failed to save contact:", error);
    return NextResponse.json({ error: "Failed to save contact" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      orderBy: { createdAt: 'desc' }
    });
    return NextResponse.json(contacts);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch contacts" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const { id, name, email, phone } = await req.json();
    if (!id || !name || !email) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const updated = await prisma.contact.update({
      where: { id },
      data: { name, email, phone: phone || null }
    });
    
    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: "Failed to update contact" }, { status: 500 });
  }
}
