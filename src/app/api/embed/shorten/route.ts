import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { PrismaClient } from '@prisma/client';
import crypto from 'node:crypto';
import { validateEmbedConfig, mapContentType, EmbedConfig } from '@/types/embed';
import { authOptions } from '@/utils/auth';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await request.json();
    const { widgetId, config: base64Config } = body;

    if (!widgetId || !base64Config) {
      return NextResponse.json({ error: 'Missing widgetId or config' }, { status: 400 });
    }

    let embedConfig: EmbedConfig;
    try {
      const decoded = JSON.parse(atob(base64Config));
      embedConfig = decoded;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid config format' }, { status: 400 });
    }

    const validationErrors = validateEmbedConfig(embedConfig);
    if (validationErrors.length > 0) {
      return NextResponse.json({ error: validationErrors.join(', ') }, { status: 400 });
    }

    const contentType = mapContentType(embedConfig.contentType);

    // Upsert Widget
    const widget = await prisma.widget.upsert({
      where: { widgetId },
      create: {
        widgetId,
        name: widgetId,
        contentType,
        designTokens: embedConfig.designTokens as any,
        apiEndpoint: embedConfig.apiEndpoint,
        isActive: true,
        isPublic: false,
        userId,
      },
      update: {
        contentType,
        designTokens: embedConfig.designTokens as any,
        apiEndpoint: embedConfig.apiEndpoint,
      },
    });

    // Generate unique short code
    let shortCode: string;
    let existed = false;
    do {
      const bytes = crypto.randomBytes(6);
      shortCode = bytes.toString('base64url').slice(0, 12);
      const existing = await prisma.shortCode.findUnique({ where: { code: shortCode } });
      if (existing) {
        existed = true;
        // Reuse if linked to same widget/user, but for simplicity, regenerate
      }
    } while (await prisma.shortCode.findUnique({ where: { code: shortCode } }));

    // Create ShortCode
    await prisma.shortCode.create({
      data: {
        code: shortCode,
        config: base64Config,
        widgetId: widget.widgetId,
        userId,
      },
    });

    return NextResponse.json({ shortCode, existed });
  } catch (error) {
    console.error('Shorten API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}