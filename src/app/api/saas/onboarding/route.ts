import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

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
    const {
      businessName,
      businessDescription,
      website,
      stripeAccountId,
      companyAddress,
      contactEmail,
      contactPhone,
      primaryColor,
      secondaryColor,
      logoUrl,
      faviconUrl,
      fonts,
      voiceAndTone,
      currentStep,
      skipForNow,
    } = body;

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle platform owners - auto-complete onboarding
    if (user.role === 'platform_owner') {
      let saasCreator = await prisma.saasCreator.findUnique({
        where: { userId: user.id },
      });

      if (!saasCreator) {
        saasCreator = await prisma.saasCreator.create({
          data: {
            userId: user.id,
            businessName: businessName || `${user.name || 'Platform'} Owner`,
            businessDescription: businessDescription || 'Platform administration',
            website: website || '',
            onboardingCompleted: true,
            onboardingStep: 5,
          },
        });
      }

      return NextResponse.json({
        success: true,
        saasCreator,
        message: "Platform owner onboarding auto-completed",
      });
    }

    // Check if SaaS creator profile exists
    let saasCreator = await prisma.saasCreator.findUnique({
      where: { userId: user.id },
    });

    if (!saasCreator && businessName) {
      // Create new SaaS creator profile
      saasCreator = await prisma.saasCreator.create({
        data: {
          userId: user.id,
          businessName,
          businessDescription,
          website,
          onboardingStep: currentStep || 1,
          onboardingCompleted: false, // Never mark as completed here
        },
      });
    } else if (saasCreator) {
      // Update existing profile - mark as completed when reaching step 5 (COMPLETE)
      const isCompleted = currentStep >= 5;
      saasCreator = await prisma.saasCreator.update({
        where: { id: saasCreator.id },
        data: {
          ...(businessName && { businessName }),
          ...(businessDescription !== undefined && { businessDescription }),
          ...(website !== undefined && { website }),
          ...(companyAddress !== undefined && { companyAddress }),
          ...(primaryColor !== undefined && { primaryColor }),
          ...(secondaryColor !== undefined && { secondaryColor }),
          ...(logoUrl !== undefined && { logoUrl }),
          ...(faviconUrl !== undefined && { faviconUrl }),
          ...(fonts !== undefined && { fonts }),
          ...(voiceAndTone !== undefined && { voiceAndTone }),
          onboardingStep: currentStep || saasCreator.onboardingStep,
          onboardingCompleted: isCompleted,
        },
      });

      // Auto-create white-label config when onboarding is completed
      if (isCompleted) {
        const existingWhiteLabel = await prisma.whiteLabelConfig.findUnique({
          where: { saasCreatorId: saasCreator.id },
        });

        if (!existingWhiteLabel) {
          // Generate a subdomain from website URL (preferred) or business name as fallback
          let subdomain: string;
          if (website) {
            // Extract domain from URL (e.g., vibe-fix.com -> vibe-fix)
            try {
              const urlObj = new URL(website.startsWith('http') ? website : `https://${website}`);
              const hostname = urlObj.hostname;
              const cleanHostname = hostname.replace(/^www\./, '');
              const parts = cleanHostname.split('.');
              const domain = parts.length > 1 ? parts[0] : cleanHostname;
              subdomain = domain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').substring(0, 30);
            } catch (error) {
              console.error('Error parsing website URL:', error);
              subdomain = businessName 
                ? businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)
                : `creator-${saasCreator.id.substring(0, 8)}`;
            }
          } else {
            subdomain = businessName 
              ? businessName.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30)
              : `creator-${saasCreator.id.substring(0, 8)}`;
          }

          await prisma.whiteLabelConfig.create({
            data: {
              saasCreatorId: saasCreator.id,
              brandName: businessName || saasCreator.businessName,
              primaryColor: primaryColor || saasCreator.primaryColor || '#667eea',
              secondaryColor: secondaryColor || saasCreator.secondaryColor || '#764ba2',
              logoUrl: logoUrl || saasCreator.logoUrl,
              faviconUrl: faviconUrl || saasCreator.faviconUrl,
              subdomain: subdomain,
              isActive: true,
            },
          });
        }
      }
    }

    // Handle Stripe account connection
    if (stripeAccountId && saasCreator) {
      // Use upsert to handle duplicate Stripe account IDs in development
      await prisma.stripeAccount.upsert({
        where: { saasCreatorId: saasCreator.id },
        update: {
          stripeAccountId,
          isActive: true,
        },
        create: {
          saasCreatorId: saasCreator.id,
          stripeAccountId,
          isActive: true,
        },
      });
    }

    // Handle product creation
    // Note: Product creation is no longer part of onboarding
    // Users will create products from the dashboard after completing onboarding

    return NextResponse.json({
      success: true,
      saasCreator,
      message: "Onboarding progress saved",
    });
  } catch (error: any) {
    console.error("Onboarding error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to save onboarding progress" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        saasCreator: {
          include: {
            stripeAccount: true,
            products: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Handle platform owners - auto-complete onboarding
    if (user.role === 'platform_owner') {
      if (!user.saasCreator) {
        const saasCreator = await prisma.saasCreator.create({
          data: {
            userId: user.id,
            businessName: `${user.name || 'Platform'} Owner`,
            businessDescription: 'Platform administration',
            onboardingCompleted: true,
            onboardingStep: 5,
          },
        });
        
        return NextResponse.json({
          saasCreator,
          onboardingCompleted: true,
          currentStep: 5,
        });
      }
      
      return NextResponse.json({
        saasCreator: user.saasCreator,
        onboardingCompleted: true,
        currentStep: user.saasCreator?.onboardingStep || 5,
      });
    }

    // For regular users, ensure SaasCreator exists
    let saasCreator = user.saasCreator;
    
    if (!saasCreator) {
      // Auto-create SaasCreator for new users
      const newCreator = await prisma.saasCreator.create({
        data: {
          userId: user.id,
          businessName: user.name || 'My Business',
          onboardingCompleted: false,
          onboardingStep: 1,
        },
      });
      
      // Fetch with includes to match expected type
      saasCreator = await prisma.saasCreator.findUnique({
        where: { id: newCreator.id },
        include: {
          stripeAccount: true,
          products: true,
        },
      });
    }

    const onboardingCompleted = saasCreator?.onboardingCompleted || false;
    const currentStep = saasCreator?.onboardingStep || 1;

    return NextResponse.json({
      saasCreator,
      onboardingCompleted,
      currentStep,
    });
  } catch (error: any) {
    console.error("Get onboarding status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get onboarding status" },
      { status: 500 }
    );
  }
}