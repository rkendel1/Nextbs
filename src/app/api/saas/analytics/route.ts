import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

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
