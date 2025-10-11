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

    if (!accessToken) {
      console.error("No access token received from Stripe OAuth");
      // Continue without fetching details, but store what we have
      return NextResponse.json(
        { error: "OAuth token exchange incomplete" },
        { status: 500 }
      );
    }

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
      const connectedStripe = new Stripe(accessToken, {
        apiVersion: "2023-10-16",
      });
      stripeAccountDetails = await connectedStripe.accounts.retrieve();
      console.log("Stripe account details retrieved:", JSON.stringify({
        business_name: stripeAccountDetails.business_profile?.name,
        business_type: stripeAccountDetails.business_type,
        has_business_profile: !!stripeAccountDetails.business_profile,
        has_company: !!stripeAccountDetails.company,
        has_individual: !!stripeAccountDetails.individual,
        country: stripeAccountDetails.country,
        default_currency: stripeAccountDetails.default_currency,
        email: stripeAccountDetails.email,
        product_description: stripeAccountDetails.business_profile?.product_description,
        charges_enabled: stripeAccountDetails.charges_enabled,
        payouts_enabled: stripeAccountDetails.payouts_enabled,
      }));
    } catch (error: any) {
      console.error("Failed to fetch Stripe account details:", error);
      // Continue even if fetch fails - we don't want to block the onboarding
    }

    // Prepare updates to SaasCreator with Stripe data
    const saasCreatorUpdates: any = {
      onboardingStep: 3, // Move to product setup step
    };

    // Build comprehensive account profile from Stripe data
    if (stripeAccountDetails) {
      // Business name - prefer business_profile name, fall back to company name or individual name
      if (stripeAccountDetails.business_profile?.name) {
        saasCreatorUpdates.businessName = stripeAccountDetails.business_profile.name;
      } else if (stripeAccountDetails.company?.name) {
        saasCreatorUpdates.businessName = stripeAccountDetails.company.name;
      } else if (stripeAccountDetails.individual?.first_name || stripeAccountDetails.individual?.last_name) {
        const firstName = stripeAccountDetails.individual.first_name || '';
        const lastName = stripeAccountDetails.individual.last_name || '';
        saasCreatorUpdates.businessName = `${firstName} ${lastName}`.trim();
      }

      // Company address - try multiple sources for most complete address
      const address = stripeAccountDetails.business_profile?.support_address || 
                     stripeAccountDetails.company?.address ||
                     stripeAccountDetails.individual?.address;
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

      // Build comprehensive contact info JSON
      const contactInfo: any = {};
      
      // Email - try multiple sources
      if (stripeAccountDetails.business_profile?.support_email) {
        contactInfo.email = stripeAccountDetails.business_profile.support_email;
      } else if (stripeAccountDetails.email) {
        contactInfo.email = stripeAccountDetails.email;
      } else if (stripeAccountDetails.individual?.email) {
        contactInfo.email = stripeAccountDetails.individual.email;
      }
      
      // Phone - try multiple sources
      if (stripeAccountDetails.business_profile?.support_phone) {
        contactInfo.phone = stripeAccountDetails.business_profile.support_phone;
      } else if (stripeAccountDetails.company?.phone) {
        contactInfo.phone = stripeAccountDetails.company.phone;
      } else if (stripeAccountDetails.individual?.phone) {
        contactInfo.phone = stripeAccountDetails.individual.phone;
      }

      // Support/business website
      if (stripeAccountDetails.business_profile?.support_url) {
        contactInfo.supportUrl = stripeAccountDetails.business_profile.support_url;
      }

      // Country and currency
      if (stripeAccountDetails.country) {
        contactInfo.country = stripeAccountDetails.country;
      }

      if (stripeAccountDetails.default_currency) {
        contactInfo.currency = stripeAccountDetails.default_currency;
      }

      // Business type (individual, company, non_profit, government_entity)
      if (stripeAccountDetails.business_type) {
        contactInfo.businessType = stripeAccountDetails.business_type;
      }

      // MCC (Merchant Category Code) - indicates industry
      if (stripeAccountDetails.business_profile?.mcc) {
        contactInfo.mcc = stripeAccountDetails.business_profile.mcc;
      }

      // Account capabilities and verification status
      if (stripeAccountDetails.charges_enabled !== undefined) {
        contactInfo.chargesEnabled = stripeAccountDetails.charges_enabled;
      }

      if (stripeAccountDetails.payouts_enabled !== undefined) {
        contactInfo.payoutsEnabled = stripeAccountDetails.payouts_enabled;
      }

      // Tax ID information (if available)
      if (stripeAccountDetails.company?.tax_id) {
        contactInfo.taxId = stripeAccountDetails.company.tax_id;
      } else if (stripeAccountDetails.individual?.ssn_last_4) {
        contactInfo.ssnLast4 = stripeAccountDetails.individual.ssn_last_4;
      }

      // Legal entity name
      if (stripeAccountDetails.company?.name) {
        contactInfo.legalEntityName = stripeAccountDetails.company.name;
      }

      // Owner/representative information
      if (stripeAccountDetails.individual?.first_name || stripeAccountDetails.individual?.last_name) {
        contactInfo.ownerName = `${stripeAccountDetails.individual.first_name || ''} ${stripeAccountDetails.individual.last_name || ''}`.trim();
      }

      // Date of birth (if individual account)
      if (stripeAccountDetails.individual?.dob) {
        contactInfo.ownerDob = stripeAccountDetails.individual.dob;
      }

      // Payout settings
      if (stripeAccountDetails.settings?.payouts) {
        contactInfo.payoutSchedule = stripeAccountDetails.settings.payouts.schedule?.interval;
        contactInfo.payoutDelay = stripeAccountDetails.settings.payouts.schedule?.delay_days;
      }

      // External accounts (bank account info - limited for security)
      if (stripeAccountDetails.external_accounts?.data?.[0]) {
        const bankAccount = stripeAccountDetails.external_accounts.data[0];
        if (bankAccount.object === 'bank_account') {
          contactInfo.bankLast4 = bankAccount.last4;
          contactInfo.bankName = bankAccount.bank_name;
          contactInfo.bankAccountType = bankAccount.account_type;
        }
      }

      if (Object.keys(contactInfo).length > 0) {
        saasCreatorUpdates.contactInfo = JSON.stringify(contactInfo);
      }

      // Business website URL - prefer business_profile.url
      if (stripeAccountDetails.business_profile?.url) {
        saasCreatorUpdates.website = stripeAccountDetails.business_profile.url;
      }

      // Business description - what the company does
      if (stripeAccountDetails.business_profile?.product_description) {
        saasCreatorUpdates.businessDescription = stripeAccountDetails.business_profile.product_description;
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
