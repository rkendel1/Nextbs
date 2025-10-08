import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import Stripe from "stripe";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');

    if (!code || !state) {
      return NextResponse.json(
        { error: "Missing authorization code or state parameter" },
        { status: 400 }
      );
    }

    // Verify state parameter
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString("utf-8"));
      if (stateData.email !== session.user.email) {
        return NextResponse.json(
          { error: "Invalid state parameter" },
          { status: 400 }
        );
      }
    } catch (e) {
      return NextResponse.json(
        { error: "Invalid state parameter" },
        { status: 400 }
      );
    }

    // Exchange code for access token
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: "2023-10-16",
    });

    console.log("Initiating token exchange");
    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    console.log("Token response received:", JSON.stringify(response, null, 2));

    const stripeAccountId = response.stripe_user_id;
    const livemode = response.livemode || false;
    
    if (!stripeAccountId) {
      return NextResponse.json(
        { error: "Failed to get Stripe account ID" },
        { status: 500 }
      );
    }
    
    const accessToken = response.access_token;
    const refreshToken = response.refresh_token;
    const tokenType = response.token_type;
    const scope = response.scope;

    // Find user and SaaS creator
    console.log("Fetching user and saasCreator");
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    console.log("User and saasCreator found:", user ? { id: user.id, hasSaasCreator: !!user.saasCreator } : null);

    if (!user || !user.saasCreator) {
      return NextResponse.json(
        { error: "SaaS creator profile not found" },
        { status: 404 }
      );
    }

    // Store Stripe account details
    const existingStripeAccount = await prisma.stripeAccount.findUnique({
      where: { saasCreatorId: user.saasCreator.id },
    });

    console.log("StripeAccount upsert completed");
    if (existingStripeAccount) {
      // Update existing
      await prisma.stripeAccount.update({
        where: { id: existingStripeAccount.id },
        data: {
          stripeAccountId,
          accessToken,
          refreshToken,
          tokenType,
          scope,
          livemode,
          isActive: true,
        },
      });
    } else {
      // Create new
      await prisma.stripeAccount.create({
        data: {
          saasCreatorId: user.saasCreator.id,
          stripeAccountId,
          accessToken,
          refreshToken,
          tokenType,
          scope,
          livemode,
          isActive: true,
        },
      });
    }

    // Update onboarding step
    await prisma.saasCreator.update({
      where: { id: user.saasCreator.id },
      data: {
        onboardingStep: 3, // Move to product setup step
      },
    });

    // Redirect back to onboarding with success params
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectUrl = new URL("/saas/onboarding", baseUrl);
    redirectUrl.searchParams.set("stripeConnected", "true");
    redirectUrl.searchParams.set("stripeAccountId", stripeAccountId);
    
    return NextResponse.redirect(redirectUrl);
  } catch (error: any) {
    console.error("Stripe callback error:", error);
    // Redirect back to onboarding with error params
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
    const redirectUrl = new URL("/saas/onboarding", baseUrl);
    redirectUrl.searchParams.set("stripeError", error.message || "Failed to connect Stripe account");
    
    return NextResponse.redirect(redirectUrl);
  }
}
