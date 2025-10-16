import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const saasCreator = await prisma.saasCreator.findUnique({
    where: { userId: session.user.id },
  });

  if (!saasCreator) {
    return NextResponse.json({ error: 'SaaSCreator not found' }, { status: 404 });
  }

  const body = await req.json();
  const { prompt, designVersionId } = body;

  if (!prompt) {
    return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
  }

  // Fetch latest active design version if not specified
  let designVersion = null;
  if (!designVersionId) {
    designVersion = await prisma.designVersion.findFirst({
      where: {
        saasCreatorId: saasCreator.id,
        isActive: true,
      },
      orderBy: { version: 'desc' },
    });
  } else {
    designVersion = await prisma.designVersion.findUnique({
      where: { id: designVersionId },
    });
  }

  // Use default tokens if no design version is found
  let tokens = {};
  
  if (designVersion) {
    tokens = designVersion.tokensJson || {};
  } else {
    // Default design tokens
    tokens = {
      primaryColor: '#0070f3',
      secondaryColor: '#f5f5f5',
      fontFamily: 'system-ui, -apple-system, sans-serif',
      borderRadius: '8px',
      spacing: {
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem'
      },
      typography: {
        heading: 'system-ui, -apple-system, sans-serif',
        body: 'system-ui, -apple-system, sans-serif'
      }
    };
  }

  const systemPrompt = `You are an expert embed generator AI. Given a user description and design tokens, generate a complete embed configuration as JSON.

Design tokens: ${JSON.stringify(tokens)}

User prompt: ${prompt}

Output ONLY valid JSON:
{
  "name": "Embed Name",
  "type": "PAGE" | "COLLECTION" | "COMPONENT" | "WIDGET",
  "description": "Brief description",
  "features": ["feature1", "feature2"],
  "customHTML": "Full HTML structure for the embed, using semantic elements",
  "customCSS": "CSS styles applying the design tokens (e.g., --primary-color: tokens.primaryColor), inline or classes",
  "customJS": "JavaScript for interactivity, if needed (e.g., fetch products)"
}

Make it functional, responsive, and styled exactly with the tokens. For products, assume fetch from /api/saas/products. No explanations, just JSON.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const generated = JSON.parse(completion.choices[0].message.content || '{}');

    // Validate required fields
    if (!generated.name || !generated.type || !generated.customHTML) {
      return NextResponse.json({ error: 'Invalid generation response' }, { status: 500 });
    }

    // Apply tokens to CSS if not already
    generated.customCSS = generated.customCSS || '';
    Object.entries(tokens).forEach(([key, value]) => {
      generated.customCSS = generated.customCSS.replace(new RegExp(`\\$\\{${key}\\}`, 'g'), value as string);
    });

    // Create response object
    const responseData = {
      ...generated,
      saasCreatorId: saasCreator.id,
    };
    
    // Add designVersionId only if designVersion exists
    if (designVersion) {
      responseData.designVersionId = designVersion.id;
    }
    
    return NextResponse.json(responseData);
  } catch (error) {
    console.error('AI generation error:', error);
    return NextResponse.json({ error: 'Failed to generate embed' }, { status: 500 });
  }
}