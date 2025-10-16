import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prismaDB';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const widgetId = searchParams.get('widgetId');
  const type = searchParams.get('type');

  // Add CORS headers for cross-origin requests
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  if (!widgetId) {
    return NextResponse.json(
      { error: 'Embed ID is required' },
      { status: 400, headers }
    );
  }

  // Fetch embed content from database
  const content = await getEmbedContent(widgetId, type);

  if (content.error) {
    return NextResponse.json(
      { error: content.error },
      { status: 404, headers }
    );
  }

  return NextResponse.json(content, { headers });
}

export async function OPTIONS() {
  // Handle preflight requests
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function getEmbedContent(embedId: string, type: string | null) {
  const embed = await prisma.embed.findUnique({
    where: { id: embedId },
    include: {
      designVersion: {
        select: {
          tokensJson: true,
        },
      },
    },
  });

  if (!embed || !embed.isActive) {
    return { error: 'Embed not found or inactive' };
  }

  const embedConfig = embed.config || {} as any;
  const contentType = type || embed.type;

  return {
    embedId,
    type: contentType,
    timestamp: new Date().toISOString(),
    name: embed.name,
    description: embed.description,
    features: embed.features,
    customHTML: embedConfig.customHTML || '',
    customCSS: embedConfig.customCSS || '',
    customJS: embedConfig.customJS || '',
    designTokens: embed.designVersion?.tokensJson || {},
    apiEndpoint: embedConfig.apiEndpoint || '/api/embed/content',
  };
}