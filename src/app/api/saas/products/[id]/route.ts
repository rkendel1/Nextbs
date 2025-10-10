import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error("STRIPE_SECRET_KEY is not configured");
}

const stripe = new Stripe(stripeSecretKey, {
  apiVersion: "2023-10-16",
});

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get the product with tiers and metering config
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        saasCreator: true,
        tiers: {
          orderBy: { sortOrder: "asc" },
        },
        meteringConfig: true,
        _count: {
          select: {
            subscriptions: true,
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify ownership
    if (product.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ product });
  } catch (error: any) {
    console.error("Get product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch product" },
      { status: 500 }
    );
  }
}

// PUT update a product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { name, description, isActive, imageUrl } = body;

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

    // Get the product to verify ownership
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingProduct.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Sync with Stripe if name or description changed
    if (existingProduct.stripeProductId && (name || description !== undefined)) {
      try {
        await stripe.products.update(existingProduct.stripeProductId, {
          ...(name && { name }),
          ...(description !== undefined && { description: description || undefined }),
          active: isActive ?? existingProduct.isActive,
        });
      } catch (stripeError: any) {
        console.error("Stripe product update error:", stripeError);
        // Continue even if Stripe update fails
      }
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: name ?? existingProduct.name,
        description: description ?? existingProduct.description,
        isActive: isActive ?? existingProduct.isActive,
        imageUrl: imageUrl ?? existingProduct.imageUrl,
      },
    });

    // If making product live, ensure all tiers are active
    if (isActive === true) {
      await prisma.tier.updateMany({
        where: { productId: id },
        data: { isActive: true },
      });
    }

    return NextResponse.json({ product: updatedProduct });
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE a product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const { id } = params;
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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

    // Get the product to verify ownership
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingProduct.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Delete the product (this will cascade delete related tiers and subscriptions)
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete product" },
      { status: 500 }
    );
  }
}