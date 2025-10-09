import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
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

    // Get all products with tiers and subscription counts
    const products = await prisma.product.findMany({
      where: { saasCreatorId: user.saasCreator.id },
      include: {
        tiers: {
          orderBy: { sortOrder: "asc" },
        },
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

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    if (!stripeSecretKey) {
      return NextResponse.json(
        { error: "Stripe secret key is not configured" },
        { status: 500 }
      );
    }

    // Find user and SaaS creator
    let user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Auto-create saasCreator for platform owners if missing
    if (!user.saasCreator) {
      if (user.role !== 'platform_owner') {
        return NextResponse.json(
          { error: "SaaS creator profile required" },
          { status: 404 }
        );
      }

      // Create saasCreator for platform owner
      user.saasCreator = await prisma.saasCreator.create({
        data: {
          userId: user.id,
          businessName: `${user.name}'s Platform`,
          businessDescription: 'Platform owner business',
          onboardingCompleted: true,
          onboardingStep: 4,
        },
      });
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    let stripeProduct;
    try {
      stripeProduct = await stripe.products.create({
        name,
        description: description || undefined,
        metadata: {
          saasCreatorId: user.saasCreator.id,
          platformOwner: user.role === 'platform_owner' ? 'true' : 'false',
        },
      });
    } catch (stripeError: any) {
      console.error("Stripe product creation error:", stripeError);
      return NextResponse.json(
        { error: "Failed to create product in Stripe: " + stripeError.message },
        { status: 500 }
      );
    }

    // Create product
    const product = await prisma.product.create({
      data: {
        saasCreatorId: user.saasCreator.id,
        name,
        description,
        isActive: isActive ?? true,
        stripeProductId: stripeProduct.id,
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
