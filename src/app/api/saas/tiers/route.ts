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

// GET fetch active tiers from platform owner's products
export async function GET() {
  try {
    // Find platform owner and their products with tiers
    const platformOwner = await prisma.user.findFirst({
      where: { role: 'platform_owner' },
      include: {
        saasCreator: {
          include: {
            products: {
              where: { isActive: true },
              include: {
              tiers: {
                orderBy: { sortOrder: 'asc' }
              }
              }
            }
          }
        }
      }
    });

    // If no platform owner exists, return empty tiers array instead of 404
    if (!platformOwner) {
      return NextResponse.json({ tiers: [] });
    }

    // If platform owner exists but hasn't completed onboarding, return empty tiers
    if (!platformOwner.saasCreator) {
      return NextResponse.json({ tiers: [] });
    }

    // Flatten and transform products and tiers
    const allTiers = platformOwner.saasCreator.products.flatMap(product => 
      product.tiers.map(tier => ({
        id: tier.id,
        nickname: tier.name,
        unit_amount: tier.priceAmount,
        offers: tier.features,
        product: {
          name: product.name,
          description: product.description || tier.description,
        },
        isActive: tier.isActive,
        stripePriceId: tier.stripePriceId
      }))
    );

    return NextResponse.json({ tiers: allTiers });
  } catch (error: any) {
    console.error("Fetch tiers error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch tiers" },
      { status: 500 }
    );
  }
}

// POST create a new tier
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
    console.log("Tiers POST body:", body);
    const {
      name,
      description,
      priceAmount, // Already in cents from frontend
      billingPeriod,
      features,
      usageLimit,
      productId,
      isActive,
      sortOrder,
    } = body;

    console.log("Validation fields - name:", name, "priceAmount:", priceAmount, "productId:", productId);
    if (!name || !productId || priceAmount === undefined || priceAmount < 0) {
      console.log("Validation failed: Invalid fields");
      return NextResponse.json(
        { error: "Missing or invalid required fields: name, non-negative priceAmount, productId" },
        { status: 400 }
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

    // Verify product ownership
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: { saasCreator: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found" },
        { status: 404 }
      );
    }

    if (product.saasCreatorId !== user.saasCreator.id) {
      return NextResponse.json(
        { error: "Unauthorized - Product does not belong to you" },
        { status: 403 }
      );
    }

    // Ensure product has Stripe product ID
    if (!product.stripeProductId) {
      let stripeProduct;
      try {
        stripeProduct = await stripe.products.create({
          name: product.name,
          description: product.description || undefined,
          metadata: {
            saasCreatorId: user.saasCreator.id,
            productId: product.id,
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

      // Update product with Stripe product ID
      await prisma.product.update({
        where: { id: productId },
        data: { stripeProductId: stripeProduct.id },
      });
    }

    // Handle free tiers (priceAmount = 0) differently from paid tiers
    let stripePriceId = null;
    
    if (priceAmount > 0) {
      // Create Stripe Price for paid tiers only
      try {
        let stripePriceData: any = {
          product: product.stripeProductId!,
          unit_amount: priceAmount, // Already in cents
          currency: 'usd',
          metadata: {
            tierName: name,
            productId: productId,
            saasCreatorId: user.saasCreator.id,
            platformOwner: user.role === 'platform_owner' ? 'true' : 'false',
          },
        };

        // Handle different billing periods
        if (billingPeriod === 'one-time') {
          // One-time payment - no recurring
          // Stripe doesn't need recurring field for one-time payments
        } else {
          // Recurring payments
          let interval: 'month' | 'year' = 'month';
          let intervalCount = 1;

          if (billingPeriod === 'yearly') {
            interval = 'year';
          } else if (billingPeriod === 'quarterly') {
            interval = 'month';
            intervalCount = 3;
          } else {
            interval = 'month';
          }

          stripePriceData.recurring = {
            interval,
            interval_count: intervalCount,
          };
        }

        const stripePrice = await stripe.prices.create(stripePriceData);
        stripePriceId = stripePrice.id;
      } catch (stripeError: any) {
        console.error("Stripe price creation error:", stripeError);
        return NextResponse.json(
          { error: "Failed to create price in Stripe: " + stripeError.message },
          { status: 500 }
        );
      }
    }

    // Create tier in database
    const tier = await prisma.tier.create({
      data: {
        productId,
        name,
        description,
        priceAmount, // Already in cents
        billingPeriod,
        features: features || [],
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        stripePriceId: stripePriceId,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      },
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error: any) {
    console.error("Create tier error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create tier" },
      { status: 500 }
    );
  }
}