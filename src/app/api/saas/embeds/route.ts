import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/utils/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
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

  const embeds = await prisma.embed.findMany({
    where: { saasCreatorId: saasCreator.id },
    include: { designVersion: true },
  });

  return NextResponse.json(embeds);
}

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
  const { name, type, description, features, config, designVersionId, customHTML, customCSS, customJS } = body;

  if (!name || !type) {
    return NextResponse.json({ error: 'Name and type required' }, { status: 400 });
  }

  const embed = await prisma.embed.create({
    data: {
      saasCreatorId: saasCreator.id,
      name,
      type,
      description,
      features,
      config,
      customHTML,
      customCSS,
      customJS,
      designVersionId: designVersionId || null,
    },
  });

  return NextResponse.json(embed, { status: 201 });
}