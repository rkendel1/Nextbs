import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// POST create metering configuration
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
      productId,
      meteringType,
      meteringUnit,
      aggregationType,
      usageReportingUrl,
    } = body;

    if (!productId || !meteringType || !meteringUnit || !aggregationType) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verify product ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (!user?.saasCreator || product.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Create metering config
    const config = await prisma.meteringConfig.create({
      data: {
        productId,
        meteringType,
        meteringUnit,
        aggregationType,
        usageReportingUrl,
      },
    });

    return NextResponse.json({ config }, { status: 201 });
  } catch (error: any) {
    console.error("Create metering config error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create metering configuration" },
      { status: 500 }
    );
  }
}
