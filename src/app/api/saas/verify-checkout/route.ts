import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/utils/prismaDB";
import Stripe from "stripe";
import { authOptions } from "@/utils/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// POST /api/saas/verify-checkout - Verify Stripe Checkout session and create subscription
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Missing sessionId" },
        { status: 400 }
      );
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    const metadata = checkoutSession.metadata;
    if (!metadata || !metadata.userId || !metadata.tierId || !metadata.onboarding) {
      return NextResponse.json(
        { error: "Invalid checkout session metadata" },
        { status: 400 }
      );
    }

    const { userId, tierId, productId, saasCreatorId } = metadata;
    const stripeSubscriptionId = checkoutSession.subscription as string;

    // Verify this is the correct user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized - user mismatch" },
        { status: 403 }
      );
    }

    // Check if subscription already exists
    let subscription = await prisma.subscription.findFirst({
      where: {
        userId: userId,
        tierId: tierId,
      },
      include: {
        product: true,
        tier: true,
      },
    });

    if (!subscription) {
      // Create the subscription
      subscription = await prisma.subscription.create({
        data: {
          userId: userId,
          saasCreatorId: saasCreatorId,
          productId: productId,
          tierId: tierId,
          stripeSubscriptionId: stripeSubscriptionId,
          status: 'active',
          cancelAtPeriodEnd: false,
        },
        include: {
          product: true,
          tier: true,
        },
      });

      // Update user subscription status
      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'PAID' },
      });
    } else if (!subscription.stripeSubscriptionId && stripeSubscriptionId) {
      // Update existing subscription with Stripe ID
      subscription = await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          stripeSubscriptionId: stripeSubscriptionId,
          status: 'active',
        },
        include: {
          product: true,
          tier: true,
        },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { subscriptionStatus: 'PAID' },
      });
    }

    return NextResponse.json({
      success: true,
      subscription: {
        id: subscription.id,
        productName: subscription.product.name,
        tierName: subscription.tier.name,
        status: subscription.status,
      },
    });
  } catch (error: any) {
    console.error("Error verifying checkout:", error);
    return NextResponse.json(
      { error: error.message || "Failed to verify checkout" },
      { status: 500 }
    );
  }
}