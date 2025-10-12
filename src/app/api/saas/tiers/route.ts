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

type Prices = Record<string, { amount: number; stripePriceId: string }> | null;

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
                where: { isActive: true },
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
      hasYearly,
      discount,
    } = body;

    console.log("Validation fields - name:", name, "priceAmount:", priceAmount, "productId:", productId, "hasYearly:", hasYearly, "discount:", discount);
    if (!name || !productId || priceAmount === undefined || priceAmount < 0) {
      console.log("Validation failed: Invalid fields");
      return NextResponse.json(
        { error: "Missing or invalid required fields: name, non-negative priceAmount, productId" },
        { status: 400 }
      );
    }

    // Validate billingPeriod is required and valid
    const validBillingPeriods = ['monthly', 'yearly', 'quarterly', 'one-time'];
    if (!billingPeriod) {
      return NextResponse.json(
        { error: "billingPeriod is required" },
        { status: 400 }
      );
    }
    if (!validBillingPeriods.includes(billingPeriod)) {
      return NextResponse.json(
        { error: `Invalid billingPeriod. Must be one of: ${validBillingPeriods.join(', ')}` },
        { status: 400 }
      );
    }

    // Validate yearly option
    if (hasYearly) {
      if (billingPeriod !== 'monthly') {
        return NextResponse.json(
          { error: "Yearly option requires monthly billing as base" },
          { status: 400 }
        );
      }
      const disc = discount || 17;
      if (disc < 0 || disc > 50) {
        return NextResponse.json(
          { error: "Discount must be between 0 and 50%" },
          { status: 400 }
        );
      }
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

    // Enforce single tier per product
    const existingTiersCount = await prisma.tier.count({
      where: { productId },
    });

    if (existingTiersCount > 0) {
      return NextResponse.json(
        { error: "This product already has a pricing tier. Each product supports only one tier for cleaner pricing cards." },
        { status: 400 }
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

    // Handle pricing for paid tiers (priceAmount > 0)
    let prices: Prices = null;
    if (priceAmount > 0) {
      try {
        const metadata = {
          tierName: name,
          productId: productId,
          saasCreatorId: user.saasCreator.id,
          platformOwner: user.role === 'platform_owner' ? 'true' : 'false',
        };

        if (hasYearly && billingPeriod === 'monthly') {
          const disc = discount || 17;
          const yrAmount = Math.round(priceAmount * 12 * (1 - disc / 100));

          // Create monthly price
          const moPriceData = {
            product: product.stripeProductId!,
            unit_amount: priceAmount,
            currency: 'usd',
            recurring: { interval: 'month' as const },
            metadata,
          };
          const moPrice = await stripe.prices.create(moPriceData);

          // Create yearly price
          const yrPriceData = {
            product: product.stripeProductId!,
            unit_amount: yrAmount,
            currency: 'usd',
            recurring: { interval: 'year' as const },
            metadata: { ...metadata, discountPercent: disc.toString() },
          };
          const yrPrice = await stripe.prices.create(yrPriceData);

          prices = {
            monthly: { amount: priceAmount, stripePriceId: moPrice.id },
            yearly: { amount: yrAmount, stripePriceId: yrPrice.id },
          };
        } else {
          // Single price for other cases (one-time, yearly, quarterly, or no yearly)
          let stripePriceData: any = {
            product: product.stripeProductId!,
            unit_amount: priceAmount,
            currency: 'usd',
            metadata,
          };

          if (billingPeriod === 'one-time') {
            // One-time payment - no recurring
            stripePriceData.type = 'one_time';
          } else {
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
          const periodKey = billingPeriod === 'one-time' ? 'one-time' : billingPeriod;
          prices = {
            [periodKey]: { amount: priceAmount, stripePriceId: stripePrice.id },
          };
        }
      } catch (stripeError: any) {
        console.error("Stripe price creation error:", stripeError);
        console.error("Price data attempted:", { priceAmount, billingPeriod, hasYearly, discount });
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
        priceAmount, // Base amount in cents (monthly or single)
        billingPeriod,
        features: features || [],
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        stripePriceId: prices ? prices['monthly']?.stripePriceId || prices[billingPeriod as string]?.stripePriceId || null : null,
        prices: prices || undefined,
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