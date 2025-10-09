import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/utils/prismaDB";
import Stripe from "stripe";
import { authOptions } from "@/utils/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// GET /api/saas/my-account - Get creator's platform subscription and usage
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          include: {
            product: true,
            tier: true,
            saasCreator: {
              include: { user: true }
            }
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Find platform subscription (subscription to platform owner's product)
    const platformSubscription = user.subscriptions.find(sub => 
      sub.saasCreator.user.role === 'platform_owner'
    );

    if (!platformSubscription) {
      return NextResponse.json(
        { error: "No platform subscription found" },
        { status: 404 }
      );
    }

    // Get usage records for this subscription
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        subscriptionId: platformSubscription.id,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: 100, // Last 100 records
    });

    // Calculate total usage
    const totalUsage = usageRecords.reduce((sum, record) => sum + record.quantity, 0);

    // Get Stripe subscription details if available
    let stripeSubscription = null;
    if (platformSubscription.stripeSubscriptionId) {
      try {
        stripeSubscription = await stripe.subscriptions.retrieve(
          platformSubscription.stripeSubscriptionId
        );
      } catch (error) {
        console.error("Error fetching Stripe subscription:", error);
      }
    }

    return NextResponse.json({
      subscription: {
        id: platformSubscription.id,
        productName: platformSubscription.product.name,
        tierName: platformSubscription.tier.name,
        tierDescription: platformSubscription.tier.description,
        priceAmount: platformSubscription.tier.priceAmount,
        billingPeriod: platformSubscription.tier.billingPeriod,
        features: platformSubscription.tier.features,
        status: platformSubscription.status,
        currentPeriodStart: platformSubscription.currentPeriodStart,
        currentPeriodEnd: platformSubscription.currentPeriodEnd,
        cancelAtPeriodEnd: platformSubscription.cancelAtPeriodEnd,
        stripeSubscriptionId: platformSubscription.stripeSubscriptionId,
        usageLimit: platformSubscription.tier.usageLimit,
      },
      usage: {
        total: totalUsage,
        limit: platformSubscription.tier.usageLimit,
        records: usageRecords.slice(0, 10), // Last 10 records for display
      },
      stripeDetails: stripeSubscription ? {
        currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        status: stripeSubscription.status,
      } : null,
    });
  } catch (error: any) {
    console.error("Error fetching account details:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch account details" },
      { status: 500 }
    );
  }
}