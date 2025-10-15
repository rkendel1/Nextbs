import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { EmbedConfig, Widget } from '@/types/embed';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;

    if (!code) {
      return NextResponse.json({ error: 'Missing code' }, { status: 400 });
    }

    const shortCode = await prisma.shortCode.findUnique({
      where: { code },
      include: {
        widget: true
      }
    });

    if (!shortCode || shortCode.expiresAt < new Date()) {
      return NextResponse.json({ error: 'Short code not found or expired' }, { status: 404 });
    }

    // Decode config
    let config: EmbedConfig;
    try {
      const decoded = JSON.parse(atob(shortCode.config));
      config = decoded;
    } catch (error) {
      return NextResponse.json({ error: 'Invalid config' }, { status: 400 });
    }

    // Validate config
    // Optional: validateEmbedConfig(config) – skip for performance, assume valid from creation

    const response = {
      shortCode,
      config,
      widget: shortCode.widget as Widget
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Resolve API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}