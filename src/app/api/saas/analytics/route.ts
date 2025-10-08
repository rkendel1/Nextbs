import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

// GET - Fetch analytics data
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
      include: { saasCreator: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'monthly';
    const creatorId = searchParams.get('creatorId');

    // Platform owners can view all creators' analytics
    const isPlatformOwner = (user as any).role === 'platform_owner';
    
    let targetCreatorId: string | undefined;
    if (creatorId && isPlatformOwner) {
      targetCreatorId = creatorId;
    } else if (user.saasCreator) {
      targetCreatorId = user.saasCreator.id;
    }

    // Calculate date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get current month data
    const whereClause = targetCreatorId ? { saasCreatorId: targetCreatorId } : {};
    
    const currentMonthSubscriptions = await prisma.subscription.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfMonth,
        },
      },
      include: { tier: true },
    });

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        ...whereClause,
        status: 'active',
      },
    });

    const totalSubscribers = await prisma.subscription.findMany({
      where: whereClause,
      select: { userId: true },
      distinct: ['userId'] as any,
    });

    // Calculate revenue
    const allActiveSubscriptions = await prisma.subscription.findMany({
      where: {
        ...whereClause,
        status: 'active',
      },
      include: { tier: true },
    });

    const monthlyRevenue = allActiveSubscriptions.reduce(
      (sum, sub) => sum + (sub.tier?.priceAmount || 0),
      0
    );

    // Get last month's data for growth calculations
    const lastMonthSubscriptions = await prisma.subscription.findMany({
      where: {
        ...whereClause,
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth,
        },
      },
    });

    const lastMonthActive = await prisma.subscription.count({
      where: {
        ...whereClause,
        status: 'active',
        createdAt: {
          lte: endOfLastMonth,
        },
      },
    });

    // Calculate growth rates
    const subscriberGrowth = lastMonthActive > 0
      ? ((activeSubscriptions - lastMonthActive) / lastMonthActive) * 100
      : 0;

    // Get monthly breakdown for the last 6 months
    const monthlyBreakdown = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      const monthSubs = await prisma.subscription.findMany({
        where: {
          ...whereClause,
          status: 'active',
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
        include: { tier: true },
      });

      const revenue = monthSubs.reduce((sum, sub) => sum + (sub.tier?.priceAmount || 0), 0);

      monthlyBreakdown.push({
        month: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' }),
        amount: revenue,
        subscribers: monthSubs.length,
      });
    }

    // Get usage data
    let usageRecords;
    if (targetCreatorId) {
      usageRecords = await prisma.usageRecord.findMany({
        where: {
          timestamp: {
            gte: startOfMonth,
          },
          subscription: {
            saasCreatorId: targetCreatorId,
          },
        },
      });
    } else {
      usageRecords = await prisma.usageRecord.findMany({
        where: {
          timestamp: {
            gte: startOfMonth,
          },
        },
      });
    }

    const totalUsage = usageRecords.reduce((sum, record) => sum + record.quantity, 0);

    // Get churned subscribers (cancelled this month)
    const churnedSubscribers = await prisma.subscription.count({
      where: {
        ...whereClause,
        status: 'canceled',
        updatedAt: {
          gte: startOfMonth,
        },
      },
    });

    const analytics = {
      revenue: {
        total: monthlyRevenue,
        growth: 0, // Can be calculated with historical data
        monthlyBreakdown,
      },
      subscribers: {
        total: totalSubscribers.length,
        active: activeSubscriptions,
        churned: churnedSubscribers,
        growth: subscriberGrowth,
        new: currentMonthSubscriptions.length,
      },
      usage: {
        total: totalUsage,
        trend: [], // Can be populated with daily/weekly breakdowns
      },
    };

    return NextResponse.json({ analytics });
  } catch (error: any) {
    console.error("Fetch analytics error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch analytics" },
      { status: 500 }
    );
  }

// GET /api/saas/analytics - Get analytics data
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    // Generate mock data for the last 30 days
    const mockData = generateMockAnalytics();

    return NextResponse.json(mockData, { status: 200 });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { message: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}

// Helper function to generate mock analytics data
function generateMockAnalytics() {
  const days = 30;
  const revenueData = [];
  const usageData = [];
  const subscribersData = [];

  const now = new Date();
  let baseRevenue = 8000;
  let baseUsage = 1000;
  let totalSubscribers = 100;

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dateStr = date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    // Revenue with growth trend
    const dailyRevenue = Math.floor(
      baseRevenue + Math.random() * 1000 + (days - i) * 20
    );
    const subscriptions = Math.floor(dailyRevenue / 100);

    revenueData.push({
      date: dateStr,
      revenue: dailyRevenue,
      subscriptions,
    });

    // Usage with fluctuations
    const dailyUsage = Math.floor(
      baseUsage + Math.random() * 500 + Math.sin(i / 7) * 200
    );
    usageData.push({
      date: dateStr,
      usage: dailyUsage,
    });

    // Subscriber growth
    const newSubs = Math.floor(Math.random() * 5 + 2);
    const churned = Math.floor(Math.random() * 2);
    totalSubscribers += newSubs - churned;

    subscribersData.push({
      date: dateStr,
      total: totalSubscribers,
      new: newSubs,
      churned,
    });

    baseRevenue = dailyRevenue;
    baseUsage = dailyUsage;
  }

  return {
    revenue: revenueData,
    usage: usageData,
    subscribers: subscribersData,
  };
}
