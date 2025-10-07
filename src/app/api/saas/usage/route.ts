import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prismaDB";

// POST track usage
export async function POST(request: NextRequest) {
  try {
    // Get API key from headers
    const apiKey = request.headers.get("x-api-key");
    
    if (!apiKey) {
      return NextResponse.json(
        { error: "API key required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { subscriptionId, userId, quantity, metadata } = body;

    if (!subscriptionId || !userId || quantity === undefined) {
      return NextResponse.json(
        { error: "Missing required fields: subscriptionId, userId, quantity" },
        { status: 400 }
      );
    }

    // Verify subscription exists
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        saasCreator: true,
        product: {
          include: {
            meteringConfig: true,
          },
        },
      },
    });

    if (!subscription) {
      return NextResponse.json(
        { error: "Subscription not found" },
        { status: 404 }
      );
    }

    // TODO: Verify API key belongs to the SaaS creator
    // For now, we'll create the usage record

    // Create usage record
    const usageRecord = await prisma.usageRecord.create({
      data: {
        subscriptionId,
        userId,
        quantity: parseFloat(quantity),
        metadata: metadata || {},
      },
    });

    // If there's a webhook URL, send usage data
    if (subscription.product.meteringConfig?.usageReportingUrl) {
      try {
        await fetch(subscription.product.meteringConfig.usageReportingUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            subscriptionId,
            userId,
            quantity,
            timestamp: usageRecord.timestamp,
            metadata,
          }),
        });
      } catch (webhookError) {
        console.error("Webhook error:", webhookError);
        // Don't fail the request if webhook fails
      }
    }

    return NextResponse.json({
      success: true,
      usageRecord: {
        id: usageRecord.id,
        quantity: usageRecord.quantity,
        timestamp: usageRecord.timestamp,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Track usage error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track usage" },
      { status: 500 }
    );
  }
}

// GET usage statistics
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const subscriptionId = searchParams.get("subscriptionId");
    const userId = searchParams.get("userId");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (!subscriptionId && !userId) {
      return NextResponse.json(
        { error: "subscriptionId or userId required" },
        { status: 400 }
      );
    }

    // Build where clause
    const where: any = {};
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    // Get usage records
    const usageRecords = await prisma.usageRecord.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 100,
      include: {
        subscription: {
          select: {
            id: true,
            product: {
              select: {
                name: true,
                meteringConfig: true,
              },
            },
          },
        },
      },
    });

    // Calculate total usage
    const totalUsage = usageRecords.reduce(
      (sum, record) => sum + record.quantity,
      0
    );

    return NextResponse.json({
      totalUsage,
      recordCount: usageRecords.length,
      records: usageRecords.map(record => ({
        id: record.id,
        quantity: record.quantity,
        timestamp: record.timestamp,
        metadata: record.metadata,
      })),
    });
  } catch (error: any) {
    console.error("Get usage error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch usage" },
      { status: 500 }
    );
  }
}
