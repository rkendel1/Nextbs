import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// GET single product
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        tiers: {
          orderBy: { sortOrder: "asc" },
        },
        meteringConfig: true,
        saasCreator: true,
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user?.saasCreator || product.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
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

// PUT update product
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { name, description, isActive } = body;

    // Verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    const product = await prisma.product.findUnique({
      where: { id: params.id },
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

    // Update product
    const updatedProduct = await prisma.product.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ product: updatedProduct });
  } catch (error: any) {
    console.error("Update product error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update product" },
      { status: 500 }
    );
  }
}

// DELETE product
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    const product = await prisma.product.findUnique({
      where: { id: params.id },
      include: {
        _count: {
          select: { subscriptions: true },
        },
      },
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

    // Check if product has active subscriptions
    if (product._count.subscriptions > 0) {
      return NextResponse.json(
        { error: "Cannot delete product with active subscriptions" },
        { status: 400 }
      );
    }

    // Delete product
    await prisma.product.delete({
      where: { id: params.id },
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
