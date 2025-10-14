import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/utils/prismaDB";

export async function POST(request: NextRequest) {
  try {
    // Validate environment variables
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const siteUrl = process.env.SITE_URL;

    if (!stripeSecretKey || !siteUrl) {
      throw new Error("Missing required environment variables");
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2023-10-16",
    });

    const data = await request.json();
    const { priceId } = data;

    if (!priceId) {
      return NextResponse.json(
        { error: "Price ID is required" },
        { status: 400 }
      );
    }

    // Fetch product to get saasCreatorId
    const product = await prisma.product.findFirst({
      where: { stripePriceId: priceId },
      select: { id: true, saasCreatorId: true },
    });

    if (!product) {
      return NextResponse.json(
        { error: "Product not found for price ID" },
        { status: 404 }
      );
    }

    // Create checkout session with specific success and cancel URLs
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${siteUrl}/payment-success`,
      cancel_url: `${siteUrl}/#pricing`, // Return to pricing section
      allow_promotion_codes: true,
      billing_address_collection: "required",
      metadata: {
        saasCreatorId: product.saasCreatorId,
        productId: product.id,
        tierId: priceId,
      },
    });

    if (!session.url) {
      throw new Error("Failed to create checkout session");
    }

    return NextResponse.json({ url: session.url });

  } catch (error: any) {
    console.error("Payment session creation error:", error);
    return NextResponse.json(
      { 
        error: error.message || "Failed to create payment session"
      },
      { status: error.statusCode || 500 }
    );
  }
}