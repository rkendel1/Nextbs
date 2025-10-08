import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// GET individual subscriber details
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

    // Get the subscription with full details
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
            description: true,
          },
        },
        tier: {
          select: {
            id: true,
            name: true,
            features: true,
          },
        },
        usageRecords: {
          orderBy: { timestamp: "desc" },
          take: 10,
        },
      },
    });

    if (!subscription) {
      return NextResponse.json({ error: "Subscriber not found" }, { status: 404 });
    }

    // Verify ownership - platform owners can see all, creators only their own
    if (user.role !== 'platform_owner' && subscription.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ subscription });
  } catch (error: any) {
    console.error("Get subscriber error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch subscriber" },
      { status: 500 }
    );
  }
}

// PUT update subscriber status
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
    const { status: subscriptionStatus, cancelAtPeriodEnd } = body;

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

    // Get the subscription to verify ownership
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingSubscription.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Update the subscription
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: subscriptionStatus ?? existingSubscription.status,
        cancelAtPeriodEnd: cancelAtPeriodEnd ?? existingSubscription.cancelAtPeriodEnd,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
        product: {
          select: {
            id: true,
            name: true,
          },
        },
        tier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error: any) {
    console.error("Update subscriber error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update subscriber" },
      { status: 500 }
    );
  }
}

// DELETE cancel subscription
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

    // Get the subscription to verify ownership
    const existingSubscription = await prisma.subscription.findUnique({
      where: { id },
    });

    if (!existingSubscription) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    // Verify ownership
    if (existingSubscription.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // Cancel the subscription (set to cancel at period end)
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        status: "canceled",
        cancelAtPeriodEnd: true,
      },
    });

    return NextResponse.json({ success: true, subscription: updatedSubscription });
  } catch (error: any) {
    console.error("Cancel subscription error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to cancel subscription" },
      { status: 500 }
    );
  }
}