import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const stamps = await prisma.orgStamp.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(stamps);
  } catch (error) {
    console.error('Error fetching stamps:', error);
    return NextResponse.json({ error: 'Failed to fetch stamps' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const stamp = await prisma.orgStamp.create({
      data: {
        name: body.name,
        imageDataUrl: body.imageDataUrl,
        isDefault: body.isDefault || false,
      },
    });
    return NextResponse.json(stamp, { status: 201 });
  } catch (error) {
    console.error('Error creating stamp:', error);
    return NextResponse.json({ error: 'Failed to create stamp' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    // If setting as default, unset others (handled by client or here)
    if (data.isDefault) {
      await prisma.orgStamp.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    const stamp = await prisma.orgStamp.update({
      where: { id },
      data: {
        name: data.name,
        imageDataUrl: data.imageDataUrl,
        isDefault: data.isDefault,
      },
    });
    return NextResponse.json(stamp);
  } catch (error) {
    console.error('Error updating stamp:', error);
    return NextResponse.json({ error: 'Failed to update stamp' }, { status: 500 });
  }
}
