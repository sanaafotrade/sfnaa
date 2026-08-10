import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const documents = await prisma.letterDocument.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(documents);
  } catch (error) {
    console.error('Error fetching documents:', error);
    return NextResponse.json({ error: 'Failed to fetch documents' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const doc = await prisma.letterDocument.create({
      data: {
        language: body.language,
        letterNumber: body.letterNumber,
        dateGregorian: body.dateGregorian,
        dateHijri: body.dateHijri,
        showRecipient: body.showRecipient,
        recipientText: body.recipientText,
        showSubject: body.showSubject,
        subjectText: body.subjectText,
        showGreeting: body.showGreeting,
        blocks: body.blocks,
        showClosing: body.showClosing,
        closingText: body.closingText,
        signerName: body.signerName,
        signerTitle: body.signerTitle,
        signerX: body.signerX,
        signerY: body.signerY,
        signatureUrl: body.signatureUrl,
        signatureX: body.signatureX,
        signatureY: body.signatureY,
        signatureWidth: body.signatureWidth,
        signatureHeight: body.signatureHeight,
        signaturePage: body.signaturePage,
        stampUrl: body.stampUrl,
        stampX: body.stampX,
        stampY: body.stampY,
        stampWidth: body.stampWidth,
        stampHeight: body.stampHeight,
        stampPage: body.stampPage,
        overlays: body.overlays || [],
        status: body.status,
        createdBy: body.createdBy,
      },
    });
    return NextResponse.json(doc, { status: 201 });
  } catch (error) {
    console.error('Error creating document:', error);
    return NextResponse.json({ error: 'Failed to create document' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    
    const doc = await prisma.letterDocument.update({
      where: { id },
      data: {
        language: data.language,
        letterNumber: data.letterNumber,
        dateGregorian: data.dateGregorian,
        dateHijri: data.dateHijri,
        showRecipient: data.showRecipient,
        recipientText: data.recipientText,
        showSubject: data.showSubject,
        subjectText: data.subjectText,
        showGreeting: data.showGreeting,
        blocks: data.blocks,
        showClosing: data.showClosing,
        closingText: data.closingText,
        signerName: data.signerName,
        signerTitle: data.signerTitle,
        signerX: data.signerX,
        signerY: data.signerY,
        signatureUrl: data.signatureUrl,
        signatureX: data.signatureX,
        signatureY: data.signatureY,
        signatureWidth: data.signatureWidth,
        signatureHeight: data.signatureHeight,
        signaturePage: data.signaturePage,
        stampUrl: data.stampUrl,
        stampX: data.stampX,
        stampY: data.stampY,
        stampWidth: data.stampWidth,
        stampHeight: data.stampHeight,
        stampPage: data.stampPage,
        overlays: data.overlays || [],
        status: data.status,
        updatedBy: data.updatedBy,
      },
    });
    return NextResponse.json(doc);
  } catch (error) {
    console.error('Error updating document:', error);
    return NextResponse.json({ error: 'Failed to update document' }, { status: 500 });
  }
}
