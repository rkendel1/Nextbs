import { prisma } from "@/utils/prismaDB";
import { Tier } from "@prisma/client";

/**
 * Calculate total usage for a subscription in the current billing period
 */
export async function getCurrentPeriodUsage(
  subscriptionId: string,
  periodStart: Date
): Promise<number> {
  const result = await prisma.usageRecord.aggregate({
    where: {
      subscriptionId,
      timestamp: {
        gte: periodStart,
      },
    },
    _sum: {
      quantity: true,
    },
  });

  return result._sum.quantity || 0;
}

/**
 * Check if usage would exceed limits
 */
export async function checkUsageLimit(
  subscriptionId: string,
  requestedQuantity: number
): Promise<{
  allowed: boolean;
  currentUsage: number;
  limit: number | null;
  newTotal: number;
  percentage: number;
  action: "allow" | "warn" | "block";
  reason?: string;
}> {
  // Get subscription with tier
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      tier: true,
    },
  });

  if (!subscription) {
    throw new Error("Subscription not found");
  }

  // If no limit, always allow
  if (!subscription.tier.usageLimit) {
    return {
      allowed: true,
      currentUsage: 0,
      limit: null,
      newTotal: requestedQuantity,
      percentage: 0,
      action: "allow",
    };
  }

  // Calculate current usage
  const periodStart = subscription.currentPeriodStart || new Date();
  const currentUsage = await getCurrentPeriodUsage(subscriptionId, periodStart);
  const newTotal = currentUsage + requestedQuantity;
  const limit = subscription.tier.usageLimit;
  const percentage = (newTotal / limit) * 100;

  // Determine action based on tier settings
  const limitAction = subscription.tier.limitAction || "warn";

  if (newTotal > limit) {
    // Over limit
    if (limitAction === "block") {
      return {
        allowed: false,
        currentUsage,
        limit,
        newTotal,
        percentage,
        action: "block",
        reason: "Usage limit exceeded",
      };
    } else if (limitAction === "overage" && subscription.tier.overageAllowed) {
      return {
        allowed: true,
        currentUsage,
        limit,
        newTotal,
        percentage,
        action: "warn",
        reason: "Overage charges will apply",
      };
    } else {
      // Default: warn but allow
      return {
        allowed: true,
        currentUsage,
        limit,
        newTotal,
        percentage,
        action: "warn",
        reason: "Usage limit exceeded",
      };
    }
  }

  // Under limit
  return {
    allowed: true,
    currentUsage,
    limit,
    newTotal,
    percentage,
    action: percentage >= 80 ? "warn" : "allow",
  };
}

/**
 * Check if we should trigger a warning notification
 */
export async function shouldTriggerWarning(
  subscriptionId: string,
  percentage: number,
  tier: Tier
): Promise<{ shouldTrigger: boolean; threshold: number }> {
  // Get default thresholds or custom ones
  const thresholds = tier.warningThresholds
    ? (tier.warningThresholds as number[])
    : [80, 90, 95];

  // Find which threshold we've crossed
  let triggeredThreshold: number | null = null;
  for (const threshold of thresholds.sort((a, b) => b - a)) {
    if (percentage >= threshold) {
      triggeredThreshold = threshold;
      break;
    }
  }

  if (!triggeredThreshold) {
    return { shouldTrigger: false, threshold: 0 };
  }

  // Check if we've already sent a notification for this threshold in this period
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
  });

  if (!subscription?.currentPeriodStart) {
    return { shouldTrigger: true, threshold: triggeredThreshold };
  }

  const existingEvent = await prisma.usageLimitEvent.findFirst({
    where: {
      subscriptionId,
      threshold: triggeredThreshold / 100, // Store as decimal
      timestamp: {
        gte: subscription.currentPeriodStart,
      },
      notificationSent: true,
    },
  });

  return {
    shouldTrigger: !existingEvent,
    threshold: triggeredThreshold,
  };
}

/**
 * Create a usage limit event
 */
export async function createLimitEvent(
  subscriptionId: string,
  userId: string,
  eventType: "warning" | "critical" | "exceeded" | "reset",
  currentUsage: number,
  usageLimit: number,
  threshold?: number
) {
  const percentage = (currentUsage / usageLimit) * 100;

  return await prisma.usageLimitEvent.create({
    data: {
      subscriptionId,
      userId,
      eventType,
      threshold: threshold ? threshold / 100 : 1.0,
      currentUsage,
      usageLimit,
      percentage,
      notificationSent: false,
    },
  });
}

/**
 * Send usage warning notification
 */
export async function sendUsageWarning(
  userId: string,
  eventType: "warning" | "critical" | "exceeded",
  currentUsage: number,
  limit: number,
  percentage: number
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user?.email) {
    console.error("User not found or no email:", userId);
    return;
  }

  const subject = getWarningSubject(eventType, percentage);
  const body = getWarningBody(eventType, currentUsage, limit, percentage);

  await prisma.emailNotification.create({
    data: {
      userId,
      type: `usage_${eventType}`,
      subject,
      body,
      recipient: user.email,
      status: "pending",
      metadata: {
        currentUsage,
        limit,
        percentage: percentage.toFixed(1),
      },
    },
  });
}

function getWarningSubject(eventType: string, percentage: number): string {
  switch (eventType) {
    case "exceeded":
      return "⚠️ Usage Limit Exceeded";
    case "critical":
      return `⚠️ Critical: ${percentage.toFixed(0)}% of Usage Limit Reached`;
    case "warning":
      return `⚡ Notice: ${percentage.toFixed(0)}% of Usage Limit Reached`;
    default:
      return "Usage Notification";
  }
}

function getWarningBody(
  eventType: string,
  currentUsage: number,
  limit: number,
  percentage: number
): string {
  const remaining = limit - currentUsage;

  if (eventType === "exceeded") {
    return `
Your usage has exceeded the allocated limit.

Current Usage: ${currentUsage.toLocaleString()} units
Limit: ${limit.toLocaleString()} units
Over by: ${Math.abs(remaining).toLocaleString()} units

${remaining < 0 ? "Overage charges may apply. " : ""}Please consider upgrading your plan to avoid service interruptions.
    `.trim();
  }

  return `
You have used ${percentage.toFixed(1)}% of your allocated usage.

Current Usage: ${currentUsage.toLocaleString()} units
Limit: ${limit.toLocaleString()} units
Remaining: ${remaining.toLocaleString()} units

${percentage >= 90 ? "⚠️ You're approaching your limit. Consider upgrading to avoid interruptions." : ""}
  `.trim();
}
