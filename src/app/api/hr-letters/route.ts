import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

export async function GET() {
  try {
    const letters = await prisma.letter.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(letters);
  } catch (error) {
    console.error('Error fetching letters:', error);
    return NextResponse.json({ error: 'Failed to fetch letters' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const letter = await prisma.letter.create({
      data: {
        title: body.title,
        letterNumber: body.letterNumber,
        type: body.type,
        fileUrl: body.fileUrl,
        fileType: body.fileType,
        stampApplied: body.stampApplied || false,
        signatureApplied: body.signatureApplied || false,
        finalFileUrl: body.finalFileUrl,
        relatedEmployeeId: body.relatedEmployeeId,
        notes: body.notes,
        createdBy: body.createdBy,
        createdByName: body.createdByName,
      },
    });
    return NextResponse.json(letter, { status: 201 });
  } catch (error) {
    console.error('Error creating letter:', error);
    return NextResponse.json({ error: 'Failed to create letter' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const letter = await prisma.letter.update({
      where: { id },
      data: {
        title: data.title,
        letterNumber: data.letterNumber,
        type: data.type,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        stampApplied: data.stampApplied,
        signatureApplied: data.signatureApplied,
        finalFileUrl: data.finalFileUrl,
        relatedEmployeeId: data.relatedEmployeeId,
        notes: data.notes,
        updatedBy: data.updatedBy,
        updatedByName: data.updatedByName,
      },
    });
    return NextResponse.json(letter);
  } catch (error) {
    console.error('Error updating letter:', error);
    return NextResponse.json({ error: 'Failed to update letter' }, { status: 500 });
  }
}
