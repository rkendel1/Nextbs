import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/utils/auth';
import { FormSubmission } from '@/types/embed';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    const body = await request.json();
    const { widgetId, formData, name, email, phone } = body as FormSubmission & { widgetId: string };

    if (!widgetId || !formData) {
      return NextResponse.json({ error: 'Missing widgetId or formData' }, { status: 400 });
    }

    // Validate widget exists
    const widget = await prisma.widget.findUnique({ where: { widgetId } });
    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // Extract metadata from request
    const referrer = request.headers.get('referer') || '';
    const userAgent = request.headers.get('user-agent') || '';

    // Create submission
    const submission = await prisma.formSubmission.create({
      data: {
        widgetId,
        formData: formData as any, // JSON
        name,
        email,
        phone,
        status: 'NEW',
        referrer,
        userAgent,
      },
    });

    return NextResponse.json({ success: true, id: submission.id });
  } catch (error) {
    console.error('Submit API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}