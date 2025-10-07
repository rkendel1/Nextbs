import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// GET all products for the authenticated SaaS creator
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user and SaaS creator
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

    // Get all products with tier and subscription counts
    const products = await prisma.product.findMany({
      where: { saasCreatorId: user.saasCreator.id },
      include: {
        _count: {
          select: {
            tiers: true,
            subscriptions: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error("Get products error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch products" },
      { status: 500 }
    );
  }
}

// POST create a new product
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
    const { name, description, isActive } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Product name is required" },
        { status: 400 }
      );
    }

    // Find user and SaaS creator
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

    // Create product
    const product = await prisma.product.create({
      data: {
        saasCreatorId: user.saasCreator.id,
        name,
        description,
        isActive: isActive ?? true,
      },
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error: any) {
    console.error("Create product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create product" },
      { status: 500 }
    );
  }
}
