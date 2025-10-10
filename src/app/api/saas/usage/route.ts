import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prismaDB";
import { verifyApiKey, hasPermission } from "@/utils/middleware/apiKeyAuth";
import {
  checkUsageLimit,
  shouldTriggerWarning,
  createLimitEvent,
  sendUsageWarning,
} from "@/utils/usageLimits";
import { reportUsageToStripe } from "@/utils/stripeUsageReporting";

// POST track usage
export async function POST(request: NextRequest) {
  try {
    // Verify API key
    const apiKeyVerification = await verifyApiKey(request);
    
    if (!apiKeyVerification.valid) {
      return NextResponse.json(
        { error: apiKeyVerification.error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if API key has write permission
    if (!hasPermission(apiKeyVerification.permissions || [], 'usage:write')) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
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
        tier: true,
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

    // Verify API key belongs to the SaaS creator
    const user = await prisma.user.findUnique({
      where: { id: apiKeyVerification.userId },
      include: { saasCreator: true },
    });

    if (!user?.saasCreator || user.saasCreator.id !== subscription.saasCreatorId) {
      return NextResponse.json(
        { error: "Unauthorized - API key does not belong to this subscription's creator" },
        { status: 403 }
      );
    }

    // ========== NEW: CHECK USAGE LIMITS ==========
    const limitCheck = await checkUsageLimit(subscriptionId, parseFloat(quantity));

    // If blocked, return 429 Too Many Requests
    if (!limitCheck.allowed) {
      // Create exceeded event
      await createLimitEvent(
        subscriptionId,
        userId,
        "exceeded",
        limitCheck.currentUsage,
        limitCheck.limit!
      );

      // Send notification
      await sendUsageWarning(
        userId,
        "exceeded",
        limitCheck.currentUsage,
        limitCheck.limit!,
        limitCheck.percentage
      );

      return NextResponse.json(
        {
          error: limitCheck.reason || "Usage limit exceeded",
          limits: {
            limit: limitCheck.limit,
            currentUsage: limitCheck.currentUsage,
            requestedQuantity: parseFloat(quantity),
            percentage: limitCheck.percentage.toFixed(1),
          },
        },
        { status: 429 } // Too Many Requests
      );
    }

    // Check if we should send a warning
    if (limitCheck.limit && limitCheck.percentage >= 80) {
      const warningCheck = await shouldTriggerWarning(
        subscriptionId,
        limitCheck.percentage,
        subscription.tier
      );

      if (warningCheck.shouldTrigger) {
        const eventType = limitCheck.percentage >= 95 ? "critical" : "warning";
        
        // Create warning event
        await createLimitEvent(
          subscriptionId,
          userId,
          eventType,
          limitCheck.currentUsage,
          limitCheck.limit,
          warningCheck.threshold
        );

        // Send warning notification
        await sendUsageWarning(
          userId,
          eventType,
          limitCheck.currentUsage,
          limitCheck.limit,
          limitCheck.percentage
        );
      }
    }
    // ========== END LIMIT ENFORCEMENT ==========

    // Create usage record
    const usageRecord = await prisma.usageRecord.create({
      data: {
        subscriptionId,
        userId,
        quantity: parseFloat(quantity),
        metadata: metadata || {},
      },
    });

    // ========== NEW: REPORT TO STRIPE ==========
    let stripeReported = false;
    try {
      stripeReported = await reportUsageToStripe(
        subscriptionId,
        parseFloat(quantity),
        usageRecord.timestamp
      );
    } catch (stripeError) {
      console.error("Stripe reporting failed:", stripeError);
      // Continue even if Stripe fails - local tracking is primary
    }
    // ========== END STRIPE REPORTING ==========

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
        stripeReported, // NEW: indicate if reported to Stripe
      },
      limits: limitCheck.limit ? {
        limit: limitCheck.limit,
        currentUsage: limitCheck.currentUsage,
        newTotal: limitCheck.newTotal,
        percentage: limitCheck.percentage.toFixed(1),
        action: limitCheck.action,
        reason: limitCheck.reason,
      } : undefined,
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
    // Verify API key
    const apiKeyVerification = await verifyApiKey(request);
    
    if (!apiKeyVerification.valid) {
      return NextResponse.json(
        { error: apiKeyVerification.error || "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if API key has read permission
    if (!hasPermission(apiKeyVerification.permissions || [], 'usage:read')) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

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
            saasCreatorId: true,
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

    // Verify API key has access to these records
    if (usageRecords.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: apiKeyVerification.userId },
        include: { saasCreator: true },
      });

      const creatorId = usageRecords[0].subscription.saasCreatorId;
      if (!user?.saasCreator || user.saasCreator.id !== creatorId) {
        return NextResponse.json(
          { error: "Unauthorized - API key does not have access to these records" },
          { status: 403 }
        );
      }
    }

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
