import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import Stripe from "stripe";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2023-10-16",
});

// POST - Initialize platform product and tiers
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== 'platform_owner') {
      return NextResponse.json(
        { error: "Forbidden - Platform Owner access required" },
        { status: 403 }
      );
    }

    // Create platform product if it doesn't exist
    let platformProduct = await prisma.product.findFirst({
      where: {
        name: "SaaSinaSnap Platform",
      },
    });

    if (!platformProduct) {
      // Create Stripe product
      const stripeProduct = await stripe.products.create({
        name: "SaaSinaSnap Platform",
        description: "Launch and scale your SaaS business with our all-in-one platform",
      });

      // Create platform product
      platformProduct = await prisma.product.create({
        data: {
          name: "SaaSinaSnap Platform",
          description: "Launch and scale your SaaS business with our all-in-one platform",
          isActive: true,
          stripeProductId: stripeProduct.id,
          saasCreatorId: user.id, // Platform owner is the creator
        },
      });
    }

    // Define tiers
    const tiers = [
      {
        name: "Starter",
        description: "Perfect for new SaaS businesses",
        priceAmount: 4900, // $49/month
        billingPeriod: "monthly",
        features: [
          "Up to 100 subscribers",
          "Basic analytics",
          "Email support",
          "Standard integrations",
          "Basic white-labeling"
        ],
        sortOrder: 0,
      },
      {
        name: "Pro",
        description: "For growing SaaS companies",
        priceAmount: 9900, // $99/month
        billingPeriod: "monthly",
        features: [
          "Up to 1,000 subscribers",
          "Advanced analytics",
          "Priority support",
          "All integrations",
          "Full white-labeling",
          "Custom domain",
          "API access"
        ],
        sortOrder: 1,
      },
      {
        name: "Enterprise",
        description: "For established SaaS businesses",
        priceAmount: 29900, // $299/month
        billingPeriod: "monthly",
        features: [
          "Unlimited subscribers",
          "Enterprise analytics",
          "24/7 priority support",
          "Custom integrations",
          "Full white-labeling",
          "Multiple custom domains",
          "Advanced API access",
          "Dedicated account manager",
          "Custom feature development"
        ],
        sortOrder: 2,
      }
    ];

    // Create tiers
    const createdTiers = await Promise.all(
      tiers.map(async (tierData) => {
        // Create Stripe price
        const stripePrice = await stripe.prices.create({
          product: platformProduct!.stripeProductId!,
          unit_amount: tierData.priceAmount,
          currency: 'usd',
          recurring: {
            interval: 'month',
          },
          metadata: {
            tierName: tierData.name,
          },
        });

        // Create tier
        return prisma.tier.create({
          data: {
            ...tierData,
            productId: platformProduct!.id,
            stripePriceId: stripePrice.id,
            isActive: true,
          },
        });
      })
    );

    return NextResponse.json({
      product: platformProduct,
      tiers: createdTiers,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Platform initialization error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initialize platform" },
      { status: 500 }
    );
  }
}