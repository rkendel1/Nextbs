import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// GET - Fetch white-label configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user || !user.saasCreator) {
      return NextResponse.json(
        { error: "SaaS creator profile not found" },
        { status: 404 }
      );
    }

    const config = await prisma.whiteLabelConfig.findUnique({
      where: { saasCreatorId: user.saasCreator.id },
    });

    return NextResponse.json({ config });
  } catch (error: any) {
    console.error("Fetch white-label config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch white-label configuration" },
      { status: 500 }
    );
  }
}

// POST - Create or update white-label configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      brandName,
      primaryColor,
      secondaryColor,
      logoUrl,
      faviconUrl,
      customDomain,
      subdomain,
      customCss,
      isActive,
    } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user || !user.saasCreator) {
      return NextResponse.json(
        { error: "SaaS creator profile not found" },
        { status: 404 }
      );
    }

    // Check if config already exists
    const existingConfig = await prisma.whiteLabelConfig.findUnique({
      where: { saasCreatorId: user.saasCreator.id },
    });

    let config;
    if (existingConfig) {
      // Update existing configuration
      config = await prisma.whiteLabelConfig.update({
        where: { saasCreatorId: user.saasCreator.id },
        data: {
          brandName,
          primaryColor,
          secondaryColor,
          logoUrl,
          faviconUrl,
          customDomain,
          subdomain,
          customCss,
          isActive: isActive ?? true,
        },
      });
    } else {
      // Create new configuration
      config = await prisma.whiteLabelConfig.create({
        data: {
          saasCreatorId: user.saasCreator.id,
          brandName,
          primaryColor,
          secondaryColor,
          logoUrl,
          faviconUrl,
          customDomain,
          subdomain,
          customCss,
          isActive: isActive ?? true,
        },
      });
    }

    return NextResponse.json({ config }, { status: existingConfig ? 200 : 201 });
  } catch (error: any) {
    console.error("Update white-label config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update white-label configuration" },
      { status: 500 }
    );
  }
}
