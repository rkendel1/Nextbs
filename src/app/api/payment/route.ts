import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";

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

    // Create checkout session with specific success and cancel URLs
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${siteUrl}/subscription-success`,
      cancel_url: `${siteUrl}/#pricing`, // Return to pricing section
      allow_promotion_codes: true,
      billing_address_collection: "required",
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