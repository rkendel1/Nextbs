import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// PUT update tier
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
    const {
      name,
      description,
      priceAmount,
      billingPeriod,
      usageLimit,
      features,
      isActive,
      sortOrder,
    } = body;

    // Verify ownership
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    const tier = await prisma.tier.findUnique({
      where: { id: params.id },
      include: { product: true },
    });

    if (!tier) {
      return NextResponse.json(
        { error: "Tier not found" },
        { status: 404 }
      );
    }

    if (!user?.saasCreator || tier.product.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Update tier
    const updatedTier = await prisma.tier.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(priceAmount !== undefined && { priceAmount }),
        ...(billingPeriod && { billingPeriod }),
        ...(usageLimit !== undefined && { usageLimit }),
        ...(features && { features }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    return NextResponse.json({ tier: updatedTier });
  } catch (error: any) {
    console.error("Update tier error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update tier" },
      { status: 500 }
    );
  }
}

// DELETE tier
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

    const tier = await prisma.tier.findUnique({
      where: { id: params.id },
      include: {
        product: true,
        _count: {
          select: { subscriptions: true },
        },
      },
    });

    if (!tier) {
      return NextResponse.json(
        { error: "Tier not found" },
        { status: 404 }
      );
    }

    if (!user?.saasCreator || tier.product.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check if tier has active subscriptions
    if (tier._count.subscriptions > 0) {
      return NextResponse.json(
        { error: "Cannot delete tier with active subscriptions" },
        { status: 400 }
      );
    }

    // Delete tier
    await prisma.tier.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete tier error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete tier" },
      { status: 500 }
    );
  }
}
