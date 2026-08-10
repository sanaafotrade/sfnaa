import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    let settings = await prisma.letterTemplateSettings.findUnique({
      where: { id: 'default' },
    });
    
    // If not exists, return default
    if (!settings) {
      settings = await prisma.letterTemplateSettings.create({
        data: { id: 'default' }
      });
    }
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching letter template settings:', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    const settings = await prisma.letterTemplateSettings.upsert({
      where: { id: 'default' },
      update: {
        companyNameAr: body.companyNameAr,
        companyNameEn: body.companyNameEn,
        companyLogoUrl: body.companyLogoUrl,
        crNumber: body.crNumber,
        vatNumber: body.vatNumber,
        phone: body.phone,
        email: body.email,
        website: body.website,
        footerAddressAr: body.footerAddressAr,
        footerAddressEn: body.footerAddressEn,
        defaultSignatureUrl: body.defaultSignatureUrl,
        defaultStampUrl: body.defaultStampUrl,
      },
      create: {
        id: 'default',
        companyNameAr: body.companyNameAr,
        companyNameEn: body.companyNameEn,
        companyLogoUrl: body.companyLogoUrl,
        crNumber: body.crNumber,
        vatNumber: body.vatNumber,
        phone: body.phone,
        email: body.email,
        website: body.website,
        footerAddressAr: body.footerAddressAr,
        footerAddressEn: body.footerAddressEn,
        defaultSignatureUrl: body.defaultSignatureUrl,
        defaultStampUrl: body.defaultStampUrl,
      },
    });
    
    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error saving letter template settings:', error);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }
}
