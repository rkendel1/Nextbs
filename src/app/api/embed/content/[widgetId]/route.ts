import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import { authOptions } from '@/utils/auth';
import { Widget } from '@/types/embed';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { widgetId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const { widgetId } = params;

    if (!widgetId) {
      return NextResponse.json({ error: 'Missing widgetId' }, { status: 400 });
    }

    const widget = await prisma.widget.findUnique({
      where: { widgetId },
      include: {
        shortCodes: {
          select: { code: true, clicks: true }
        }
      }
    });

    if (!widget) {
      return NextResponse.json({ error: 'Widget not found' }, { status: 404 });
    }

    // If private and not owner, deny
    if (!widget.isPublic && (!userId || widget.userId !== userId)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return typed response
    const response = widget as any;

    return NextResponse.json(response);
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}