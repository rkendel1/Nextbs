import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

interface RouteParams {
  params: Promise<{
    id: string;
  }>;
}

// POST - Upgrade or downgrade subscription
export async function POST(
  request: NextRequest,
  context: RouteParams
) {
  try {
    const { id } = await context.params;
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { newTierId } = body;

    if (!newTierId) {
      return NextResponse.json(
        { error: "New tier ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get the subscription
    const subscription = await prisma.subscription.findUnique({
      where: { id },
      include: {
        user: true,
        tier: true,
        product: true,
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // Verify ownership
    if (subscription.userId !== user.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 403 }
      );
    }

    // Get the new tier
    const newTier = await prisma.tier.findUnique({
      where: { id: newTierId },
    });

    if (!newTier) {
      return NextResponse.json(
        { error: "New tier not found" },
        { status: 404 }
      );
    }

    // Verify the new tier belongs to the same product
    if (newTier.productId !== subscription.productId) {
      return NextResponse.json(
        { error: "New tier must belong to the same product" },
        { status: 400 }
      );
    }

    // If subscription has Stripe subscription ID, update it in Stripe
    if (subscription.stripeSubscriptionId && newTier.stripePriceId) {
      try {
        const stripeSubscription = await stripe.subscriptions.retrieve(
          subscription.stripeSubscriptionId
        );

        // Update the subscription in Stripe
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          items: [
            {
              id: stripeSubscription.items.data[0].id,
              price: newTier.stripePriceId,
            },
          ],
          proration_behavior: 'create_prorations', // Prorate the cost
        });
      } catch (error: any) {
        console.error("Stripe update error:", error);
        return NextResponse.json(
          { error: "Failed to update subscription in Stripe" },
          { status: 500 }
        );
      }
    }

    // Update the subscription in our database
    const updatedSubscription = await prisma.subscription.update({
      where: { id },
      data: {
        tierId: newTierId,
      },
      include: {
        user: true,
        product: true,
        tier: true,
      },
    });

    // Send email notification
    await prisma.emailNotification.create({
      data: {
        userId: user.id,
        type: 'subscription_updated',
        subject: 'Subscription Updated',
        body: `Your subscription to ${subscription.product.name} has been updated to ${newTier.name}.`,
        recipient: user.email!,
        status: 'pending',
        metadata: {
          subscriptionId: subscription.id,
          oldTierId: subscription.tierId,
          newTierId,
        } as any,
      },
    });

    return NextResponse.json({ subscription: updatedSubscription });
  } catch (error: any) {
    console.error("Change subscription tier error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to change subscription tier" },
      { status: 500 }
    );
  }
}
