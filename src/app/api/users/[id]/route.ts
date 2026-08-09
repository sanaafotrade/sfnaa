import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import prisma from '@/lib/prisma';
import { cookies } from 'next/headers';

async function getAuthRole() {
  const cookieStore = await cookies();
  const token = cookieStore.get('admin_session')?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(process.env.JWT_SECRET || 'safana_najd_secret_key_2026');
    const { payload } = await jwtVerify(token, secret);
    return payload.role as string;
  } catch {
    return null;
  }
}

export async function PUT(request: Request, context: { params: { id: string } }) {
  const role = await getAuthRole();
  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { name, role: newRole, permissions, isActive } = data;
    
    // We await params in Next.js 15+ or App Router async contexts if needed, but here params is usually synchronous, though awaiting it is safer in 15.
    const { id } = await context.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'OWNER' && role !== 'OWNER') {
      return NextResponse.json({ error: 'لا تملك صلاحية تعديل بيانات المدير العام' }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(newRole && { role: newRole }),
        ...(permissions && { permissions }),
        ...(isActive !== undefined && { isActive }),
      }
    });

    const { password: _, ...userWithoutPassword } = updatedUser;
    return NextResponse.json(userWithoutPassword);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function DELETE(request: Request, context: { params: { id: string } }) {
  const role = await getAuthRole();
  if (role !== 'OWNER' && role !== 'MANAGER') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await context.params;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.role === 'OWNER') {
      return NextResponse.json({ error: 'لا يمكن حذف المدير العام' }, { status: 403 });
    }

    await prisma.user.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
