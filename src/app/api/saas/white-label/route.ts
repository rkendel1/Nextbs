import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prismadb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const config = await prisma.whiteLabelConfig.findUnique({
      where: { userId: user.id },
    });

    return NextResponse.json({ config }, { status: 200 });
  } catch (error) {
    console.error("Error fetching white-label config:", error);
    return NextResponse.json(
      { message: "Failed to fetch configuration" },
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
    const { brandName, primaryColor, logoUrl, customDomain, subdomain, customCss } = body;

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
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
    const { brandName, primaryColor, logoUrl, customDomain, subdomain, customCss } = body;

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
      },
      create: {
        userId: user.id,
        brandName: brandName || null,
        primaryColor: primaryColor || null,
        logoUrl: logoUrl || null,
        customDomain: customDomain || null,
        subdomain: subdomain || null,
        customCss: customCss || null,
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
