# Limit Enforcement Implementation Guide

**Companion to**: METERING_USAGE_EVALUATION.md  
**Date**: 2025-10-10  
**Purpose**: Practical implementation guide for adding limit enforcement capabilities

---

## Quick Start: Implementing Basic Limit Enforcement

This guide provides code examples and step-by-step instructions for implementing the **Priority 1** recommendations from the evaluation document.

---

## Step 1: Database Schema Updates

### Add new fields to existing models

```prisma
// prisma/schema.prisma

model Tier {
  id                  String   @id @default(cuid())
  // ... existing fields ...
  
  // NEW FIELDS FOR LIMIT ENFORCEMENT
  usageLimit          Int?           // Existing field
  softLimitPercent    Float?         @default(0.8)  // Warning at 80%
  limitAction         String         @default("warn")  // "block", "warn", "overage"
  overageAllowed      Boolean        @default(false)
  overageRate         Int?           // Cost per unit over limit (cents)
  warningThresholds   Json?          // Custom thresholds [0.7, 0.85, 0.95]
}

// NEW MODEL: Track limit events
model UsageLimitEvent {
  id                String       @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  userId            String
  user              User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  eventType         String       // "warning", "critical", "exceeded", "reset"
  threshold         Float        // 0.8, 0.9, 1.0
  currentUsage      Float
  usageLimit        Int
  percentage        Float
  timestamp         DateTime     @default(now())
  notificationSent  Boolean      @default(false)
  notifiedAt        DateTime?
  metadata          Json?
  
  @@index([subscriptionId, timestamp])
  @@index([userId, timestamp])
  @@index([eventType])
}

// Add relations to existing models
model Subscription {
  // ... existing fields ...
  usageLimitEvents  UsageLimitEvent[]
}

model User {
  // ... existing fields ...
  usageLimitEvents  UsageLimitEvent[]
}
```

### Run migration

```bash
npx prisma migrate dev --name add_limit_enforcement
npx prisma generate
```

---

## Step 2: Create Utility Functions

### Create: `src/utils/usageLimits.ts`

```typescript
import { prisma } from "@/utils/prismaDB";
import { Subscription, Tier } from "@prisma/client";

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
```

---

## Step 3: Update Usage Tracking API

### Modify: `src/app/api/saas/usage/route.ts`

```typescript
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prismaDB";
import { verifyApiKey, hasPermission } from "@/utils/middleware/apiKeyAuth";
import {
  checkUsageLimit,
  shouldTriggerWarning,
  createLimitEvent,
  sendUsageWarning,
} from "@/utils/usageLimits";

// POST track usage - ENHANCED WITH LIMIT CHECKING
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

        // Send notification (async, don't wait)
        sendUsageWarning(
          userId,
          eventType,
          limitCheck.newTotal,
          limitCheck.limit,
          limitCheck.percentage
        ).catch(err => console.error("Failed to send warning:", err));
      }
    }
    // ========== END NEW CODE ==========

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

    // ========== NEW: RETURN LIMIT INFO ==========
    return NextResponse.json({
      success: true,
      usageRecord: {
        id: usageRecord.id,
        quantity: usageRecord.quantity,
        timestamp: usageRecord.timestamp,
      },
      limits: limitCheck.limit ? {
        limit: limitCheck.limit,
        currentUsage: limitCheck.newTotal,
        remaining: limitCheck.limit - limitCheck.newTotal,
        percentage: limitCheck.percentage.toFixed(1),
        action: limitCheck.action,
        reason: limitCheck.reason,
      } : null,
    }, { status: 201 });
    // ========== END NEW CODE ==========
  } catch (error: any) {
    console.error("Track usage error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to track usage" },
      { status: 500 }
    );
  }
}

// GET usage statistics - KEEP EXISTING, ADD LIMIT INFO
export async function GET(request: NextRequest) {
  try {
    // ... existing authentication code ...
    const apiKeyVerification = await verifyApiKey(request);
    
    if (!apiKeyVerification.valid) {
      return NextResponse.json(
        { error: apiKeyVerification.error || "Unauthorized" },
        { status: 401 }
      );
    }

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

    // ... existing query code ...
    const where: any = {};
    if (subscriptionId) where.subscriptionId = subscriptionId;
    if (userId) where.userId = userId;
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const usageRecords = await prisma.usageRecord.findMany({
      where,
      orderBy: { timestamp: "desc" },
      take: 100,
      include: {
        subscription: {
          select: {
            id: true,
            saasCreatorId: true,
            currentPeriodStart: true,
            currentPeriodEnd: true,
            tier: {
              select: {
                usageLimit: true,
              },
            },
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

    // ... existing authorization code ...
    if (usageRecords.length > 0) {
      const user = await prisma.user.findUnique({
        where: { id: apiKeyVerification.userId },
        include: { saasCreator: true },
      });

      const creatorId = usageRecords[0].subscription.saasCreatorId;
      if (!user?.saasCreator || user.saasCreator.id !== creatorId) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    const totalUsage = usageRecords.reduce(
      (sum, record) => sum + record.quantity,
      0
    );

    // ========== NEW: ADD LIMIT INFO ==========
    let limitInfo = null;
    if (subscriptionId && usageRecords.length > 0) {
      const subscription = usageRecords[0].subscription;
      const limit = subscription.tier.usageLimit;
      
      if (limit) {
        const percentage = (totalUsage / limit) * 100;
        limitInfo = {
          limit,
          currentUsage: totalUsage,
          remaining: limit - totalUsage,
          percentage: percentage.toFixed(1),
          status: percentage >= 95 ? "critical" : percentage >= 80 ? "warning" : "ok",
        };
      }
    }
    // ========== END NEW CODE ==========

    return NextResponse.json({
      totalUsage,
      recordCount: usageRecords.length,
      limits: limitInfo, // NEW
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
```

---

## Step 4: Update Tier Management API

### Modify: `src/app/api/saas/tiers/route.ts`

Add validation and defaults for new limit fields:

```typescript
// In POST handler, add:
const {
  productId,
  name,
  description,
  priceAmount,
  billingPeriod,
  features,
  usageLimit,
  // NEW FIELDS
  limitAction,
  softLimitPercent,
  overageAllowed,
  overageRate,
  warningThresholds,
} = body;

// When creating tier:
const tier = await prisma.tier.create({
  data: {
    productId,
    name,
    description,
    priceAmount: parseInt(priceAmount),
    billingPeriod,
    features: features || [],
    usageLimit: usageLimit ? parseInt(usageLimit) : null,
    stripePriceId,
    // NEW FIELDS WITH DEFAULTS
    limitAction: limitAction || "warn",
    softLimitPercent: softLimitPercent || 0.8,
    overageAllowed: overageAllowed || false,
    overageRate: overageRate ? parseInt(overageRate) : null,
    warningThresholds: warningThresholds || [80, 90, 95],
  },
});
```

---

## Step 5: Update UI Components

### Update: `src/components/ProductManagement/TierModal.tsx`

Add limit configuration fields:

```tsx
// Add to formData state
const [formData, setFormData] = useState({
  // ... existing fields ...
  usageLimit: tier?.usageLimit || "",
  limitAction: tier?.limitAction || "warn",
  overageAllowed: tier?.overageAllowed || false,
  overageRate: tier?.overageRate || "",
});

// Add to form JSX
{formData.usageLimit && (
  <div className="mt-4">
    <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
      Limit Action
    </label>
    <select
      value={formData.limitAction}
      onChange={(e) => setFormData({ ...formData, limitAction: e.target.value })}
      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white"
    >
      <option value="warn">Warn Only (Allow Overage)</option>
      <option value="block">Block Requests (Hard Limit)</option>
      <option value="overage">Allow Overage with Charges</option>
    </select>
    <p className="mt-1 text-sm text-body-color dark:text-dark-6">
      {formData.limitAction === "warn" && "Users can exceed limit but will receive warnings"}
      {formData.limitAction === "block" && "Requests will be blocked when limit is reached"}
      {formData.limitAction === "overage" && "Users can exceed limit and will be charged for overage"}
    </p>
  </div>
)}

{formData.limitAction === "overage" && (
  <div className="mt-4">
    <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
      Overage Rate (cents per unit)
    </label>
    <input
      type="number"
      min="0"
      step="0.01"
      placeholder="e.g., 5 = $0.05 per unit"
      value={formData.overageRate}
      onChange={(e) => setFormData({ ...formData, overageRate: e.target.value })}
      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition dark:border-dark-3 dark:text-white"
    />
  </div>
)}
```

### Update: `src/app/whitelabel/[domain]/account/page.tsx`

Enhance usage display with limit status:

```tsx
// Add after usage display
{usage?.limit && (
  <div className="mt-4">
    {usagePercentage >= 95 && (
      <div className="rounded-md bg-red-50 dark:bg-red-900/20 p-3">
        <p className="text-sm font-medium text-red-800 dark:text-red-200">
          ⚠️ Critical: You've used {usagePercentage.toFixed(0)}% of your limit
        </p>
        <p className="text-xs text-red-600 dark:text-red-300 mt-1">
          Consider upgrading your plan to avoid service interruptions
        </p>
      </div>
    )}
    {usagePercentage >= 80 && usagePercentage < 95 && (
      <div className="rounded-md bg-yellow-50 dark:bg-yellow-900/20 p-3">
        <p className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
          ⚡ Notice: You've used {usagePercentage.toFixed(0)}% of your limit
        </p>
        <p className="text-xs text-yellow-600 dark:text-yellow-300 mt-1">
          {usage.limit - usage.total} units remaining this period
        </p>
      </div>
    )}
  </div>
)}
```

---

## Step 6: Testing

### Test Scenarios

1. **Normal Usage (Under Limit)**
```bash
# Should succeed and return limit info
curl -X POST http://localhost:3000/api/saas/usage \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_xxx",
    "userId": "user_xxx",
    "quantity": 100
  }'

# Expected response:
# {
#   "success": true,
#   "limits": {
#     "limit": 10000,
#     "currentUsage": 5100,
#     "remaining": 4900,
#     "percentage": "51.0",
#     "action": "allow"
#   }
# }
```

2. **Warning Threshold (80%)**
```bash
# Should succeed but trigger warning notification
curl -X POST http://localhost:3000/api/saas/usage \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_xxx",
    "userId": "user_xxx",
    "quantity": 1000
  }'

# Expected:
# - Request succeeds
# - Email notification sent
# - UsageLimitEvent created with type="warning"
```

3. **Hard Limit Exceeded**
```bash
# Should fail with 429 if limitAction="block"
curl -X POST http://localhost:3000/api/saas/usage \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_xxx",
    "userId": "user_xxx",
    "quantity": 5000
  }'

# Expected response (if over limit):
# Status: 429 Too Many Requests
# {
#   "error": "Usage limit exceeded",
#   "limits": {
#     "limit": 10000,
#     "currentUsage": 10100,
#     "requestedQuantity": 5000,
#     "percentage": "151.0"
#   }
# }
```

4. **Get Usage with Limits**
```bash
curl -X GET "http://localhost:3000/api/saas/usage?subscriptionId=sub_xxx" \
  -H "x-api-key: YOUR_API_KEY"

# Expected response:
# {
#   "totalUsage": 8500,
#   "recordCount": 45,
#   "limits": {
#     "limit": 10000,
#     "currentUsage": 8500,
#     "remaining": 1500,
#     "percentage": "85.0",
#     "status": "warning"
#   },
#   "records": [...]
# }
```

---

## Step 7: Email Notification Setup

### Option 1: Use Existing EmailNotification System

The code above uses the existing `EmailNotification` model. You need to set up a cron job or webhook to process pending notifications.

### Option 2: Send Emails Immediately (Simple)

Create: `src/utils/emailService.ts`

```typescript
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || "587"),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string
) {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM || "noreply@yourplatform.com",
      to,
      subject,
      html,
    });
    return true;
  } catch (error) {
    console.error("Email send error:", error);
    return false;
  }
}
```

Then modify `sendUsageWarning` in `usageLimits.ts`:

```typescript
import { sendEmail } from "@/utils/emailService";

export async function sendUsageWarning(...) {
  // ... existing code ...
  
  // Send email immediately
  const html = `
    <h2>${subject}</h2>
    <p>${body}</p>
    <p>
      <a href="${process.env.NEXT_PUBLIC_URL}/account">
        View your account
      </a>
    </p>
  `;
  
  const sent = await sendEmail(user.email, subject, html);
  
  // Update notification status
  await prisma.emailNotification.updateMany({
    where: {
      userId,
      type: `usage_${eventType}`,
      status: "pending",
    },
    data: {
      status: sent ? "sent" : "failed",
      sentAt: sent ? new Date() : null,
    },
  });
}
```

---

## Step 8: Configuration UI for Creators

### Create: `src/components/Dashboard/LimitSettingsModal.tsx`

```tsx
"use client";
import { useState } from "react";
import toast from "react-hot-toast";

interface LimitSettingsProps {
  tier: any;
  onUpdate: () => void;
}

export default function LimitSettings({ tier, onUpdate }: LimitSettingsProps) {
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState({
    limitAction: tier.limitAction || "warn",
    softLimitPercent: tier.softLimitPercent || 80,
    overageAllowed: tier.overageAllowed || false,
    overageRate: tier.overageRate || 0,
    warningThresholds: tier.warningThresholds || [80, 90, 95],
  });

  const handleSave = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/saas/tiers/${tier.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });

      if (!response.ok) throw new Error("Failed to update");

      toast.success("Limit settings updated");
      onUpdate();
    } catch (error) {
      toast.error("Failed to update settings");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Usage Limit Enforcement</h3>
      
      <div>
        <label className="block text-sm font-medium mb-2">
          Enforcement Action
        </label>
        <select
          value={config.limitAction}
          onChange={(e) => setConfig({ ...config, limitAction: e.target.value })}
          className="w-full rounded-md border px-3 py-2"
        >
          <option value="warn">Warn Only (Soft Limit)</option>
          <option value="block">Block Requests (Hard Limit)</option>
          <option value="overage">Allow with Overage Charges</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">
          Warning Thresholds (%)
        </label>
        <input
          type="text"
          placeholder="e.g., 80, 90, 95"
          value={config.warningThresholds.join(", ")}
          onChange={(e) => setConfig({
            ...config,
            warningThresholds: e.target.value.split(",").map(n => parseInt(n.trim()))
          })}
          className="w-full rounded-md border px-3 py-2"
        />
      </div>

      {config.limitAction === "overage" && (
        <div>
          <label className="block text-sm font-medium mb-2">
            Overage Rate (cents per unit)
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={config.overageRate}
            onChange={(e) => setConfig({ ...config, overageRate: parseFloat(e.target.value) })}
            className="w-full rounded-md border px-3 py-2"
          />
        </div>
      )}

      <button
        onClick={handleSave}
        disabled={loading}
        className="w-full bg-primary text-white rounded-md py-2 hover:bg-primary/90 disabled:opacity-50"
      >
        {loading ? "Saving..." : "Save Settings"}
      </button>
    </div>
  );
}
```

---

## Summary

This implementation provides:

✅ **Hard Limits**: Blocks requests when limit exceeded (if configured)  
✅ **Soft Limits**: Warns users at configurable thresholds (80%, 90%, 95%)  
✅ **Notifications**: Email alerts for warnings and limit violations  
✅ **Event Tracking**: All limit events logged in database  
✅ **Flexible Configuration**: Per-tier limit settings  
✅ **API Response**: Clear limit status in every usage response  
✅ **UI Updates**: Warning banners in customer portal  

### Next Steps

1. Run database migration
2. Deploy utility functions
3. Update API routes
4. Update UI components
5. Configure email service
6. Test all scenarios
7. Monitor limit events

### Estimated Implementation Time

- Database changes: 1 hour
- Utility functions: 2-3 hours
- API updates: 2-3 hours
- UI updates: 2-3 hours
- Email setup: 1-2 hours
- Testing: 2-3 hours

**Total: 10-15 hours** for basic limit enforcement

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Companion to**: METERING_USAGE_EVALUATION.md
