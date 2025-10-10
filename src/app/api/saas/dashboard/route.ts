import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    let totalProducts, totalSubscribers, activeSubscriptions, monthlyRevenue, mrr, arr, totalRevenue, churnRate;

    if (user.role === 'platform_owner') {
      // Platform owner: Aggregate across all creators
      totalProducts = await prisma.product.count();

      const allActiveSubs = await prisma.subscription.findMany({
        where: { status: "active" },
        include: { tier: true },
      });

      activeSubscriptions = allActiveSubs.length;

      // Unique subscribers across all (external have null userId, so count all active)
      totalSubscribers = await prisma.subscription.count({
        where: { status: { in: ["active", "trialing"] } },
      });

      // MRR calculation
      mrr = allActiveSubs.reduce((sum, sub) => {
        const price = sub.tier?.priceAmount || 0;
        if (sub.tier?.billingPeriod === 'yearly') {
          return sum + (price / 12);
        }
        return sum + price;
      }, 0);

      arr = mrr * 12;

      // Total Revenue: Approximate sum of all historical active subs priceAmount (simple; for exact, integrate Stripe invoices)
      const allSubs = await prisma.subscription.findMany({
        where: { status: { not: "canceled" } },
        include: { tier: true },
      });
      totalRevenue = allSubs.reduce((sum, sub) => sum + (sub.tier?.priceAmount || 0), 0);

      // Churn: Canceled in last 30 days / total at start
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const canceledRecent = await prisma.subscription.count({
        where: { status: "canceled", updatedAt: { gte: thirtyDaysAgo } },
      });
      const totalAtStart = totalSubscribers + canceledRecent; // Approximate
      churnRate = totalAtStart > 0 ? ((canceledRecent / totalAtStart) * 100).toFixed(2) : 0;

      monthlyRevenue = mrr; // Use MRR as monthly
    } else {
      // Creator: Per saasCreator
      totalProducts = await prisma.product.count({
        where: { saasCreatorId: user.saasCreator.id },
      });

      const uniqueSubscribers = await prisma.subscription.findMany({
        where: { saasCreatorId: user.saasCreator.id },
        select: { userId: true },
        distinct: ['userId'] as any,
      });
      totalSubscribers = uniqueSubscribers.length;

      activeSubscriptions = await prisma.subscription.count({
        where: {
          saasCreatorId: user.saasCreator.id,
          status: "active",
        },
      });

      const activeSubs = await prisma.subscription.findMany({
        where: {
          saasCreatorId: user.saasCreator.id,
          status: "active",
        },
        include: {
          tier: true,
        },
      });

      // MRR
      mrr = activeSubs.reduce((sum, sub) => {
        const price = sub.tier?.priceAmount || 0;
        if (sub.tier?.billingPeriod === 'yearly') {
          return sum + (price / 12);
        }
        return sum + price;
      }, 0);

      arr = mrr * 12;

      // Total Revenue: Sum all non-canceled subs
      const allSubs = await prisma.subscription.findMany({
        where: { 
          saasCreatorId: user.saasCreator.id,
          status: { not: "canceled" } 
        },
        include: { tier: true },
      });
      totalRevenue = allSubs.reduce((sum, sub) => sum + (sub.tier?.priceAmount || 0), 0);

      // Churn
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      const canceledRecent = await prisma.subscription.count({
        where: { 
          saasCreatorId: user.saasCreator.id,
          status: "canceled",
          updatedAt: { gte: thirtyDaysAgo } 
        },
      });
      const totalAtStart = totalSubscribers + canceledRecent;
      churnRate = totalAtStart > 0 ? ((canceledRecent / totalAtStart) * 100).toFixed(2) : 0;

      monthlyRevenue = mrr;
    }

    return NextResponse.json({
      stats: {
        totalProducts,
        totalSubscribers,
        activeSubscriptions,
        monthlyRevenue,
        mrr,
        arr,
        totalRevenue,
        churnRate,
      },
    });
  } catch (error: any) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
