import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const signatures = await prisma.savedSignature.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(signatures);
  } catch (error) {
    console.error('Error fetching signatures:', error);
    return NextResponse.json({ error: 'Failed to fetch signatures' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const sig = await prisma.savedSignature.create({
      data: {
        name: body.name,
        signatureDataUrl: body.signatureDataUrl,
        isDefault: body.isDefault || false,
      },
    });
    return NextResponse.json(sig, { status: 201 });
  } catch (error) {
    console.error('Error creating signature:', error);
    return NextResponse.json({ error: 'Failed to create signature' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    // If setting as default, unset others
    if (data.isDefault) {
      await prisma.savedSignature.updateMany({
        where: { id: { not: id } },
        data: { isDefault: false },
      });
    }

    const sig = await prisma.savedSignature.update({
      where: { id },
      data: {
        name: data.name,
        signatureDataUrl: data.signatureDataUrl,
        isDefault: data.isDefault,
      },
    });
    return NextResponse.json(sig);
  } catch (error) {
    console.error('Error updating signature:', error);
    return NextResponse.json({ error: 'Failed to update signature' }, { status: 500 });
  }
}
