import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate a state parameter for CSRF protection
    const state = Buffer.from(
      JSON.stringify({
        email: session.user.email,
        timestamp: Date.now(),
      })
    ).toString("base64");

    // Stripe OAuth authorization URL
    const clientId = process.env.STRIPE_CLIENT_ID;
    const redirectUri = process.env.STRIPE_OAUTH_REDIRECT_URI || `${process.env.NEXT_PUBLIC_SITE_URL}/api/saas/stripe-connect/callback`;

    if (!clientId) {
      return NextResponse.json(
        { error: "Stripe OAuth not configured" },
        { status: 500 }
      );
    }

    const authUrl = `https://connect.stripe.com/oauth/authorize?response_type=code&client_id=${clientId}&scope=read_write&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}`;

    return NextResponse.json({ authUrl });
  } catch (error: any) {
    console.error("Stripe authorize error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to initiate Stripe connection" },
      { status: 500 }
    );
  }
}
