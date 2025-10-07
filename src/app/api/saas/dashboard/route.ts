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

    // Get stats
    const totalProducts = await prisma.product.count({
      where: { saasCreatorId: user.saasCreator.id },
    });

    // Get unique subscriber count
    const uniqueSubscribers = await prisma.subscription.findMany({
      where: { saasCreatorId: user.saasCreator.id },
      select: { userId: true },
      distinct: ['userId'] as any,
    });
    const totalSubscribers = uniqueSubscribers.length;

    const activeSubscriptions = await prisma.subscription.count({
      where: {
        saasCreatorId: user.saasCreator.id,
        status: "active",
      },
    });

    // Calculate monthly revenue (sum of active subscription tier prices)
    const subscriptions = await prisma.subscription.findMany({
      where: {
        saasCreatorId: user.saasCreator.id,
        status: "active",
      },
      include: {
        tier: true,
      },
    });

    const monthlyRevenue = subscriptions.reduce(
      (sum, sub) => sum + (sub.tier?.priceAmount || 0),
      0
    );

    return NextResponse.json({
      stats: {
        totalProducts,
        totalSubscribers,
        activeSubscriptions,
        monthlyRevenue,
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
