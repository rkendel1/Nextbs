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
    const usageRecords = await prisma.usageRecord.findMany({
      where: {
        timestamp: {
          gte: startOfMonth,
        },
      },
      include: {
        subscription: {
          where: whereClause,
        },
      },
    });

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
}
