import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// POST create a new tier
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
      name,
      description,
      priceAmount,
      billingPeriod,
      usageLimit,
      features,
      isActive,
      sortOrder,
    } = body;

    if (!productId || !name || priceAmount === undefined || !billingPeriod) {
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

    // Create tier
    const tier = await prisma.tier.create({
      data: {
        productId,
        name,
        description,
        priceAmount,
        billingPeriod,
        usageLimit,
        features: features || [],
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error: any) {
    console.error("Create tier error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create tier" },
      { status: 500 }
    );
  }
}
