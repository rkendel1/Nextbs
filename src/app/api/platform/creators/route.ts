import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// GET - List all SaaS creators (Platform Owner only)
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
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Check if user is platform owner
    if ((user as any).role !== 'platform_owner') {
      return NextResponse.json(
        { error: "Forbidden - Platform Owner access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get all SaaS creators with their stats
    const creators = await prisma.saasCreator.findMany({
      skip,
      take: limit,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        products: {
          select: {
            id: true,
            name: true,
            isActive: true,
          },
        },
        subscribers: {
          where: {
            status: 'active',
          },
          select: {
            id: true,
          },
        },
        stripeAccount: {
          select: {
            isActive: true,
            stripeAccountId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = await prisma.saasCreator.count();

    // Transform data to include stats
    const creatorsWithStats = await Promise.all(
      creators.map(async (creator) => {
        const activeSubscriptions = await prisma.subscription.count({
          where: {
            saasCreatorId: creator.id,
            status: 'active',
          },
        });

        const monthlyRevenue = await prisma.subscription.findMany({
          where: {
            saasCreatorId: creator.id,
            status: 'active',
          },
          include: {
            tier: true,
          },
        });

        const revenue = monthlyRevenue.reduce(
          (sum, sub) => sum + (sub.tier?.priceAmount || 0),
          0
        );

        return {
          id: creator.id,
          businessName: creator.businessName,
          businessDescription: creator.businessDescription,
          website: creator.website,
          onboardingCompleted: creator.onboardingCompleted,
          createdAt: creator.createdAt,
          user: creator.user,
          stats: {
            totalProducts: creator.products.length,
            activeProducts: creator.products.filter(p => p.isActive).length,
            activeSubscriptions,
            monthlyRevenue: revenue,
          },
          hasStripeAccount: !!creator.stripeAccount?.isActive,
        };
      })
    );

    return NextResponse.json({
      creators: creatorsWithStats,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("List creators error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list creators" },
      { status: 500 }
    );
  }
}
