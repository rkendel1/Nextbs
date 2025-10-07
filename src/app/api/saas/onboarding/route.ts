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
      productName,
      productDescription,
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
          onboardingCompleted: currentStep === 4,
        },
      });
    } else if (saasCreator) {
      // Update existing profile
      saasCreator = await prisma.saasCreator.update({
        where: { id: saasCreator.id },
        data: {
          ...(businessName && { businessName }),
          ...(businessDescription !== undefined && { businessDescription }),
          ...(website !== undefined && { website }),
          onboardingStep: currentStep || saasCreator.onboardingStep,
          onboardingCompleted: currentStep === 4,
        },
      });
    }

    // Handle Stripe account connection
    if (stripeAccountId && saasCreator) {
      const existingStripeAccount = await prisma.stripeAccount.findUnique({
        where: { saasCreatorId: saasCreator.id },
      });

      if (!existingStripeAccount) {
        await prisma.stripeAccount.create({
          data: {
            saasCreatorId: saasCreator.id,
            stripeAccountId,
            isActive: true,
          },
        });
      }
    }

    // Handle product creation
    if (productName && !skipForNow && saasCreator) {
      await prisma.product.create({
        data: {
          saasCreatorId: saasCreator.id,
          name: productName,
          description: productDescription,
          isActive: true,
        },
      });
    }

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

    return NextResponse.json({
      saasCreator: user.saasCreator,
      onboardingCompleted: user.saasCreator?.onboardingCompleted || false,
      currentStep: user.saasCreator?.onboardingStep || 1,
    });
  } catch (error: any) {
    console.error("Get onboarding status error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to get onboarding status" },
      { status: 500 }
    );
  }
}
