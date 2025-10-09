import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { prisma } from "@/utils/prismaDB";
import Stripe from "stripe";
import { authOptions } from "@/utils/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// GET /api/saas/my-subscriptions - Get user's subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
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
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const subscriptions = user.subscriptions.map((sub) => ({
      id: sub.id,
      productName: sub.product.name,
      tierName: sub.tier.name,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() || "",
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || "",
      priceAmount: sub.tier.priceAmount,
      billingPeriod: sub.tier.billingPeriod,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    }));

    return NextResponse.json({ subscriptions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { message: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}

// POST /api/saas/my-subscriptions - Create platform subscription for creator
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
    const { tierId } = body;

    if (!tierId) {
      return NextResponse.json(
        { error: "Missing tierId" },
        { status: 400 }
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
          }
        }
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if already subscribed to platform
    const existingPlatformSub = user.subscriptions.find(sub => 
      sub.saasCreator.user.role === 'platform_owner'
    );

    if (existingPlatformSub) {
      return NextResponse.json(
        { error: "Already subscribed to platform plan" },
        { status: 400 }
      );
    }

    // Fetch tier with product and saasCreator
    const tier = await prisma.tier.findUnique({
      where: { id: tierId },
      include: {
        product: {
          include: {
            saasCreator: {
              include: { user: true }
            }
          }
        }
      },
    });

    console.log("Fetched tier for sub:", {
      tierId,
      saasCreatorId: tier?.product?.saasCreatorId,
      role: tier?.product?.saasCreator?.user?.role,
      productName: tier?.product?.name,
      priceAmount: tier?.priceAmount
    });

    if (!tier || !tier.product || !tier.product.saasCreator || tier.product.saasCreator.user.role !== 'platform_owner') {
      console.log("Validation failed: Invalid platform tier");
      return NextResponse.json(
        { error: "Invalid platform tier" },
        { status: 400 }
      );
    }

    const platformSaasCreatorId = tier.product.saasCreator.id;
    const productId = tier.product.id;
    const priceAmount = tier.priceAmount;

    if (priceAmount > 0) {
      // Paid plan: Create Stripe Checkout session
      if (!tier.stripePriceId) {
        return NextResponse.json(
          { error: "Stripe price ID not configured for this tier" },
          { status: 400 }
        );
      }

      try {
        const siteUrl = process.env.SITE_URL || 'http://localhost:3000';
        
        const checkoutSession = await stripe.checkout.sessions.create({
          customer_email: user.email!,
          line_items: [
            {
              price: tier.stripePriceId,
              quantity: 1,
            },
          ],
          mode: 'subscription',
          success_url: `${siteUrl}/saas/onboarding?session_id={CHECKOUT_SESSION_ID}&step=2`,
          cancel_url: `${siteUrl}/saas/onboarding?step=1`,
          metadata: {
            userId: user.id,
            tierId: tier.id,
            productId: productId,
            saasCreatorId: platformSaasCreatorId,
            onboarding: 'true',
          },
          subscription_data: {
            metadata: {
              userId: user.id,
              tierId: tier.id,
              productId: productId,
              saasCreatorId: platformSaasCreatorId,
            },
          },
        });

        return NextResponse.json(
          { 
            requiresPayment: true,
            checkoutUrl: checkoutSession.url,
            sessionId: checkoutSession.id,
          },
          { status: 200 }
        );
      } catch (error: any) {
        console.error("Stripe checkout session error:", error);
        return NextResponse.json(
          { error: "Failed to create checkout session: " + error.message },
          { status: 500 }
        );
      }
    } else {
      // Free plan: Create subscription directly
      const subscription = await prisma.subscription.create({
        data: {
          userId: user.id,
          saasCreatorId: platformSaasCreatorId,
          productId,
          tierId,
          stripeSubscriptionId: null,
          status: 'active',
          cancelAtPeriodEnd: false,
        },
      });

      // Update user subscription status
      await prisma.user.update({
        where: { id: user.id },
        data: { subscriptionStatus: 'FREE' },
      });

      return NextResponse.json(
        { 
          success: true,
          requiresPayment: false,
          subscription: {
            id: subscription.id,
            tierName: tier.name,
            status: 'active',
            subscriptionStatus: 'FREE',
          } 
        },
        { status: 201 }
      );
    }
  } catch (error: any) {
    console.error("Error creating subscription:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create subscription" },
      { status: 500 }
    );
  }
}
