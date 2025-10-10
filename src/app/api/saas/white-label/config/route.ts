import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/utils/auth';
import { prisma } from '@/utils/prismaDB';

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const body = await request.json();
    const { successRedirect, subdomain, customDomain } = body;

    const updateData: any = {};

    if (successRedirect !== undefined) {
      if (successRedirect === '') {
        updateData.successRedirect = null;
      } else if (typeof successRedirect !== 'string' || !successRedirect.startsWith('/') || successRedirect.length > 100) {
        return NextResponse.json({ error: 'Invalid successRedirect path (must start with / and be under 100 chars)' }, { status: 400 });
      } else {
        updateData.successRedirect = successRedirect;
      }
    }

    if (subdomain !== undefined) {
      if (subdomain === '') {
        updateData.subdomain = null;
      } else if (typeof subdomain !== 'string' || !/^[a-z0-9]([a-z0-9-]{1,61}[a-z0-9])?$/.test(subdomain) || subdomain.length < 3 || subdomain.length > 63) {
        return NextResponse.json({ error: 'Invalid subdomain (3-63 chars, lowercase letters, numbers, hyphens)' }, { status: 400 });
      } else {
        updateData.subdomain = subdomain.toLowerCase();
      }
    }

    if (customDomain !== undefined) {
      if (customDomain === '') {
        updateData.customDomain = null;
      } else if (typeof customDomain !== 'string' || !/^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9]\.[a-zA-Z]{2,}$/.test(customDomain)) {
        return NextResponse.json({ error: 'Invalid custom domain (must be valid domain format)' }, { status: 400 });
      } else {
        updateData.customDomain = customDomain.toLowerCase();
      }
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { saasCreator: { include: { whiteLabelConfig: true } } }
    });

    if (!user?.saasCreator?.whiteLabelConfig) {
      return NextResponse.json({ error: 'No white label configuration found' }, { status: 404 });
    }

    const updatedConfig = await prisma.whiteLabelConfig.update({
      where: { id: user.saasCreator.whiteLabelConfig.id },
      data: updateData,
      select: { successRedirect: true, subdomain: true, customDomain: true, brandName: true, primaryColor: true }
    });

    return NextResponse.json({ success: true, config: updatedConfig });
  } catch (error) {
    console.error('Error updating white label config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { saasCreator: { include: { whiteLabelConfig: true } } }
    });

    if (!user?.saasCreator?.whiteLabelConfig) {
      return NextResponse.json({ error: 'No white label configuration found' }, { status: 404 });
    }

    const config = user.saasCreator.whiteLabelConfig;
    return NextResponse.json({ 
      successRedirect: config.successRedirect,
      subdomain: config.subdomain,
      customDomain: config.customDomain
    });
  } catch (error) {
    console.error('Error fetching white label config:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}