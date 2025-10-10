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

    // Handle Stripe synchronization
    let newStripePriceId = tier.stripePriceId;

    // Check if price or billing period changed (need new Stripe price)
    const priceChanged = priceAmount !== undefined && priceAmount !== tier.priceAmount;
    const billingChanged = billingPeriod && billingPeriod !== tier.billingPeriod;

    if ((priceChanged || billingChanged) && tier.product.stripeProductId && priceAmount > 0) {
      try {
        // Archive old price if it exists
        if (tier.stripePriceId) {
          await stripe.prices.update(tier.stripePriceId, {
            active: false,
          });
        }

        // Create new Stripe price
        let stripePriceData: any = {
          product: tier.product.stripeProductId,
          unit_amount: priceAmount ?? tier.priceAmount,
          currency: 'usd',
          metadata: {
            tierName: name || tier.name,
            productId: tier.productId,
            saasCreatorId: user.saasCreator.id,
            platformOwner: user.role === 'platform_owner' ? 'true' : 'false',
          },
        };

        const finalBillingPeriod = billingPeriod || tier.billingPeriod;
        
        if (finalBillingPeriod === 'one-time') {
          // One-time payment - no recurring
          stripePriceData.type = 'one_time';
        } else {
          // Recurring payments
          let interval: 'month' | 'year' = 'month';
          let intervalCount = 1;

          if (finalBillingPeriod === 'yearly') {
            interval = 'year';
          } else if (finalBillingPeriod === 'quarterly') {
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
        newStripePriceId = stripePrice.id;
      } catch (stripeError: any) {
        console.error("Stripe price update error:", stripeError);
        return NextResponse.json(
          { error: "Failed to update price in Stripe: " + stripeError.message },
          { status: 500 }
        );
      }
    } else if (isActive !== undefined && tier.stripePriceId) {
      // Only isActive changed - archive/activate existing price
      try {
        await stripe.prices.update(tier.stripePriceId, {
          active: isActive,
        });
      } catch (stripeError: any) {
        console.error("Stripe price activation error:", stripeError);
        // Continue even if Stripe update fails
      }
    }

    // Update tier in database
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
        ...(newStripePriceId !== tier.stripePriceId && { stripePriceId: newStripePriceId }),
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
