import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/utils/prismaDB";
import { authOptions } from "@/utils/auth";

// GET /api/saas/white-label - Get white-label configuration
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
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

// POST /api/saas/white-label - Create white-label configuration
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
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
      pageVisibility,
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
      where: { userId: user.id },
    });

    if (existingConfig) {
      return NextResponse.json(
        { message: "Configuration already exists. Use PUT to update." },
        { status: 400 }
      );
    }

    const config = await prisma.whiteLabelConfig.create({
      data: {
        userId: user.id,
        brandName: brandName || null,
        primaryColor: primaryColor || null,
        logoUrl: logoUrl || null,
        customDomain: customDomain || null,
        subdomain: subdomain || null,
        customCss: customCss || null,
        pageVisibility: pageVisibility || 'public',
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error) {
    console.error("Error creating white-label config:", error);
    return NextResponse.json(
      { message: "Failed to create configuration" },
      { status: 500 }
    );
  }
}

// PUT /api/saas/white-label - Update white-label configuration
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { brandName, primaryColor, logoUrl, customDomain, subdomain, customCss, pageVisibility } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const config = await prisma.whiteLabelConfig.upsert({
      where: { userId: user.id },
      update: {
        brandName: brandName || null,
        primaryColor: primaryColor || null,
        logoUrl: logoUrl || null,
        customDomain: customDomain || null,
        subdomain: subdomain || null,
        customCss: customCss || null,
        pageVisibility: pageVisibility || 'public',
      },
      create: {
        userId: user.id,
        brandName: brandName || null,
        primaryColor: primaryColor || null,
        logoUrl: logoUrl || null,
        customDomain: customDomain || null,
        subdomain: subdomain || null,
        customCss: customCss || null,
        pageVisibility: pageVisibility || 'public',
      },
    });

    return NextResponse.json({ config }, { status: 200 });
  } catch (error) {
    console.error("Error updating white-label config:", error);
    return NextResponse.json(
      { message: "Failed to update configuration" },
      { status: 500 }
    );
  }
}
