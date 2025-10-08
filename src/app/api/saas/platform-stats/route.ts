import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prismadb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/saas/platform-stats - Get platform-wide statistics
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // In a real app, you'd check if the user is a platform admin
    // For now, we'll allow all authenticated users to view platform stats

    // Get aggregated stats
    const [totalCreators, totalSubscribers, totalProducts] = await Promise.all([
      prisma.saasCreator.count(),
      prisma.subscription.count(),
      prisma.product.count({ where: { isActive: true } }),
    ]);

    // Get all subscriptions with tiers for revenue calculation
    const subscriptions = await prisma.subscription.findMany({
      where: { status: "active" },
      include: { tier: true },
    });

    const platformRevenue = subscriptions.reduce(
      (sum, sub) => sum + sub.tier.priceAmount,
      0
    );

    // Get top creators
    const creatorsWithStats = await prisma.saasCreator.findMany({
      include: {
        _count: {
          select: {
            products: true,
            subscribers: true,
          },
        },
      },
      take: 20,
      orderBy: {
        createdAt: "desc",
      },
    });

    // Calculate revenue per creator (simplified)
    const creators = await Promise.all(
      creatorsWithStats.map(async (creator) => {
        const creatorSubs = await prisma.subscription.findMany({
          where: {
            saasCreatorId: creator.id,
            status: "active",
          },
          include: { tier: true },
        });

        const revenue = creatorSubs.reduce(
          (sum, sub) => sum + sub.tier.priceAmount,
          0
        );

        return {
          id: creator.id,
          businessName: creator.businessName,
          subscriberCount: creator._count.subscribers,
          productsCount: creator._count.products,
          revenue,
          createdAt: creator.createdAt.toISOString(),
        };
      })
    );

    // Sort by revenue
    creators.sort((a, b) => b.revenue - a.revenue);

    // Generate mock growth data for the last 30 days
    const growthData = generateMockGrowthData();

    const stats = {
      totalCreators,
      totalSubscribers,
      platformRevenue,
      activeProducts: totalProducts,
    };

    return NextResponse.json(
      {
        stats,
        creators: creators.slice(0, 10),
        growth: growthData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching platform stats:", error);
    return NextResponse.json(
      { message: "Failed to fetch platform stats" },
      { status: 500 }
    );
  }
}

// Helper function to generate mock growth data
function generateMockGrowthData() {
  const days = 30;
  const data = [];
  const now = new Date();
  let creators = 10;
  let subscribers = 50;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    creators += Math.floor(Math.random() * 3);
    subscribers += Math.floor(Math.random() * 10);

    data.push({
      date: dateStr,
      creators,
      subscribers,
    });
  }

  return data;
}
