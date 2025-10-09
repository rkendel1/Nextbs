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

    // Store Stripe account details using upsert to handle duplicate test accounts
    console.log("Upserting StripeAccount");
    await prisma.stripeAccount.upsert({
      where: { saasCreatorId: user.saasCreator.id },
      update: {
        stripeAccountId,
        accessToken,
        refreshToken,
        tokenType,
        scope,
        livemode,
        isActive: true,
      },
      create: {
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
    console.log("StripeAccount upsert completed");

    // Fetch Stripe account details to prefill creator profile
    console.log("Fetching Stripe account details");
    let stripeAccountDetails: any = null;
    try {
      stripeAccountDetails = await stripe.accounts.retrieve(stripeAccountId);
      console.log("Stripe account details retrieved:", JSON.stringify({
        business_name: stripeAccountDetails.business_profile?.name,
        has_business_profile: !!stripeAccountDetails.business_profile,
        has_settings: !!stripeAccountDetails.settings,
      }));
    } catch (error: any) {
      console.error("Failed to fetch Stripe account details:", error);
      // Continue even if fetch fails - we don't want to block the onboarding
    }

    // Prepare updates to SaasCreator with Stripe data
    const saasCreatorUpdates: any = {
      onboardingStep: 3, // Move to product setup step
    };

    // Only update fields if we have Stripe data and the field is not already set
    if (stripeAccountDetails) {
      // Business name from Stripe
      if (stripeAccountDetails.business_profile?.name && !user.saasCreator.businessName) {
        saasCreatorUpdates.businessName = stripeAccountDetails.business_profile.name;
      }

      // Company address from Stripe (support address or business address)
      if (!user.saasCreator.companyAddress) {
        const address = stripeAccountDetails.business_profile?.support_address || 
                       stripeAccountDetails.company?.address;
        if (address) {
          const addressParts = [
            address.line1,
            address.line2,
            address.city,
            address.state,
            address.postal_code,
            address.country
          ].filter(Boolean);
          if (addressParts.length > 0) {
            saasCreatorUpdates.companyAddress = addressParts.join(', ');
          }
        }
      }

      // Contact info from Stripe
      if (!user.saasCreator.contactInfo) {
        const contactInfo: any = {};
        
        if (stripeAccountDetails.business_profile?.support_email) {
          contactInfo.email = stripeAccountDetails.business_profile.support_email;
        } else if (stripeAccountDetails.email) {
          contactInfo.email = stripeAccountDetails.email;
        }
        
        if (stripeAccountDetails.business_profile?.support_phone) {
          contactInfo.phone = stripeAccountDetails.business_profile.support_phone;
        }

        if (stripeAccountDetails.business_profile?.support_url) {
          contactInfo.website = stripeAccountDetails.business_profile.support_url;
        }

        if (Object.keys(contactInfo).length > 0) {
          saasCreatorUpdates.contactInfo = JSON.stringify(contactInfo);
        }
      }

      // Business website URL if not set
      if (!user.saasCreator.website && stripeAccountDetails.business_profile?.url) {
        saasCreatorUpdates.website = stripeAccountDetails.business_profile.url;
      }
    }

    // Update onboarding step and Stripe-sourced data
    await prisma.saasCreator.update({
      where: { id: user.saasCreator.id },
      data: saasCreatorUpdates,
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
