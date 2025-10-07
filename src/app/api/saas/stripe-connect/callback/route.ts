import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import Stripe from "stripe";

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
    const { code, state } = body;

    if (!code) {
      return NextResponse.json(
        { error: "Missing authorization code" },
        { status: 400 }
      );
    }

    // Verify state parameter
    try {
      const stateData = JSON.parse(Buffer.from(state, "base64").toString());
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

    const response = await stripe.oauth.token({
      grant_type: "authorization_code",
      code,
    });

    const stripeAccountId = response.stripe_user_id;
    
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
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

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
          isActive: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      stripeAccountId,
      message: "Stripe account connected successfully",
    });
  } catch (error: any) {
    console.error("Stripe callback error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to connect Stripe account" },
      { status: 500 }
    );
  }
}
