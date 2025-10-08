import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import prisma from "@/lib/prismadb";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// GET /api/saas/my-subscriptions - Get user's subscriptions
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: {
        subscriptions: {
          include: {
            product: true,
            tier: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "User not found" },
        { status: 404 }
      );
    }

    const subscriptions = user.subscriptions.map((sub) => ({
      id: sub.id,
      productName: sub.product.name,
      tierName: sub.tier.name,
      status: sub.status,
      currentPeriodStart: sub.currentPeriodStart?.toISOString() || "",
      currentPeriodEnd: sub.currentPeriodEnd?.toISOString() || "",
      priceAmount: sub.tier.priceAmount,
      billingPeriod: sub.tier.billingPeriod,
      cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
    }));

    return NextResponse.json({ subscriptions }, { status: 200 });
  } catch (error) {
    console.error("Error fetching subscriptions:", error);
    return NextResponse.json(
      { message: "Failed to fetch subscriptions" },
      { status: 500 }
    );
  }
}
