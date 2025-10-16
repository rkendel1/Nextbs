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
    const { widgetId } = params;

    if (!widgetId) {
      return NextResponse.json({ error: 'Missing widgetId' }, { status: 400 });
    }

    const embed = await prisma.embed.findUnique({
      where: { id: widgetId },
      include: {
        designVersion: true,
        saasCreator: true,
      },
    });

    if (!embed || !embed.isActive) {
      return NextResponse.json({ error: 'Embed not found' }, { status: 404 });
    }

    // Default design tokens if no design version
    const defaultTokens = {
      primaryColor: '#0070f3',
      backgroundColor: '#ffffff',
      textColor: '#333333',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: '8px',
      padding: '1rem',
      maxWidth: '400px',
    };

    const designTokens = embed.designVersion?.tokensJson || defaultTokens;

    // Map to widget-compatible format
    const responseData = {
      id: embed.id,
      name: embed.name,
      title: embed.name,
      description: embed.description,
      features: embed.features,
      contentType: embed.type.toLowerCase(),
      designTokens,
      customHTML: embed.customHTML,
      customCSS: embed.customCSS,
      customJS: embed.customJS,
      config: embed.config,
      // For compatibility with existing widget logic
      isPublic: true,
      isActive: embed.isActive,
    };

    return NextResponse.json(responseData);
  } catch (error) {
    console.error('Content API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}