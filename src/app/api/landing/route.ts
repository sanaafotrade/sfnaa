import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const [services, partners, settingsResult, generalSettingsResult] = await Promise.all([
      prisma.service.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.partner.findMany({ where: { isActive: true }, orderBy: { order: 'asc' } }),
      prisma.siteSettings.findUnique({ where: { id: 'default' } }),
      prisma.letterTemplateSettings.findUnique({ where: { id: 'default' } }),
    ]);

    let settings = settingsResult;
    if (!settings) {
      settings = await prisma.siteSettings.create({
        data: { id: 'default' },
      });
    }

    return NextResponse.json({
      services,
      partners,
      settings,
      generalSettings: generalSettingsResult,
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch landing data' }, { status: 500 });
  }
}
