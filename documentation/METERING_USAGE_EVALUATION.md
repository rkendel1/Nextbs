# Metering and Usage Capabilities Evaluation

**Date**: 2025-10-10  
**Platform**: SaaS-for-SaaS (Nextbs)  
**Purpose**: Comprehensive evaluation of metering, usage tracking, billing integration, and limit enforcement

---

## Executive Summary

This document evaluates the current metering and usage capabilities in the platform, focusing on:
1. **Tracking and aggregating user/resource usage**
2. **Stripe API integration for payment processing and reporting**
3. **Billing and subscription management logic**
4. **Limit enforcement capabilities** (soft limits, hard limits, warning thresholds)

### Overall Status: **Partially Implemented** ⚠️

The platform has a solid foundation for basic usage tracking and metering, with Stripe integration for billing. However, **limit enforcement capabilities are not implemented** - there is no system to enforce usage limits or trigger warnings when limits are approached.

---

## 1. Tracking and Aggregating User/Resource Usage

### Current Implementation: ✅ **IMPLEMENTED**

#### Database Schema
The platform uses a comprehensive Prisma schema with dedicated models for usage tracking:

```typescript
// UsageRecord - Tracks individual usage events
model UsageRecord {
  id             String       @id @default(cuid())
  subscriptionId String       // Links to subscription
  subscription   Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  userId         String
  user           User         @relation(fields: [userId], references: [id], onDelete: Cascade)
  quantity       Float        // Actual usage amount
  timestamp      DateTime     @default(now())
  metadata       Json?        // Additional context (endpoint, method, etc.)
  reportedAt     DateTime     @default(now())
  
  @@index([subscriptionId, timestamp])
  @@index([userId, timestamp])
}

// Tier - Includes usage limits
model Tier {
  usageLimit    Int?  // Optional usage limit per billing period
  // ... other fields
}
```

#### Usage Tracking API (`/api/saas/usage`)

**POST /api/saas/usage** - Track usage events
- ✅ API key authentication with permission checks
- ✅ Validates subscription existence
- ✅ Records usage with quantity and metadata
- ✅ Supports webhook notifications
- ✅ Returns usage record confirmation

```typescript
// Example request
{
  "subscriptionId": "sub_xxx",
  "userId": "user_xxx",
  "quantity": 100,
  "metadata": {
    "endpoint": "/api/users",
    "method": "GET"
  }
}
```

**GET /api/saas/usage** - Retrieve usage statistics
- ✅ Filtered by subscriptionId or userId
- ✅ Date range filtering (startDate, endDate)
- ✅ Returns total usage aggregation
- ✅ Returns individual usage records
- ✅ Limited to 100 most recent records

```typescript
// Example response
{
  "totalUsage": 15000,
  "recordCount": 45,
  "records": [...]
}
```

#### Metering Configuration (`/api/saas/metering`)

```typescript
model MeteringConfig {
  id                String   @id
  productId         String   @unique
  meteringType      String   // requests, users, storage, compute, etc.
  meteringUnit      String   // count, GB, hours, etc.
  aggregationType   String   // sum, max, last_during_period
  usageReportingUrl String?  // Webhook URL for usage reporting
}
```

**Supported Metering Types**:
- Requests/API calls
- User count
- Storage (GB/MB)
- Time-based (hours/minutes/seconds)
- Custom metrics

**Aggregation Types**:
- Sum (total usage)
- Max (peak usage)
- Last during period

### Capabilities:
✅ **Real-time usage tracking** via API  
✅ **Historical usage records** with timestamps  
✅ **Flexible metadata** for context (endpoint, method, etc.)  
✅ **Aggregation** with sum, max, last_during_period  
✅ **Multiple metering types** (requests, storage, time, etc.)  
✅ **Date range queries** for analytics  
✅ **Indexed queries** for performance  

### Limitations:
⚠️ Limited to 100 records per query (pagination needed for large datasets)  
⚠️ No built-in rate limiting on the usage tracking endpoint itself  
⚠️ No automatic aggregation by billing period  
⚠️ No usage alerts or notifications to end-users  

---

## 2. Stripe API Integration for Payment Processing and Reporting

### Current Implementation: ✅ **IMPLEMENTED**

#### Stripe Connect Integration
The platform uses **Stripe Connect** to enable SaaS creators to accept payments directly:

```typescript
model StripeAccount {
  id              String   @id
  saasCreatorId   String   @unique
  stripeAccountId String   // Connected Stripe account ID
  accessToken     String?  // OAuth access token
  refreshToken    String?  // OAuth refresh token
  livemode        Boolean  @default(false)
  isActive        Boolean  @default(true)
}
```

**OAuth Flow**:
1. `/api/saas/stripe-connect/authorize` - Initiates OAuth
2. `/api/saas/stripe-connect/callback` - Handles callback and stores credentials

#### Product & Pricing Synchronization

Products and tiers are synchronized with Stripe:

```typescript
model Product {
  stripeProductId  String?  // Stripe product ID
  stripePriceId    String?  // Legacy field
}

model Tier {
  stripePriceId    String?  @unique  // Stripe price ID
  priceAmount      Int      // Amount in cents
  billingPeriod    String   // monthly, yearly, quarterly, one-time
}
```

**Price Creation Logic** (from `/api/saas/tiers`):
- ✅ Creates Stripe products automatically
- ✅ Creates Stripe prices with correct intervals
- ✅ Supports one-time and recurring payments
- ✅ Handles currency (USD)
- ✅ Metadata tracking (tierName, productId, saasCreatorId)

```typescript
// One-time payment
stripePriceData.type = 'one_time'

// Recurring payment
stripePriceData.recurring = {
  interval: 'month' | 'year',
  interval_count: 1 | 3  // 3 for quarterly
}
```

#### Subscription Management

```typescript
model Subscription {
  id                   String   @id
  stripeSubscriptionId String?  @unique
  status               String   // active, canceled, past_due
  currentPeriodStart   DateTime?
  currentPeriodEnd     DateTime?
  cancelAtPeriodEnd    Boolean  @default(false)
}
```

**Subscription APIs**:
- ✅ Create subscriptions via Stripe Checkout
- ✅ Retrieve subscription details
- ✅ Update subscription (change tier)
- ✅ Cancel subscriptions

#### Webhook Integration (`/api/webhooks/stripe`)

**Processed Events**:
- ✅ `checkout.session.completed` - Creates subscription
- ✅ `customer.subscription.created` - Tracks subscription
- ✅ `customer.subscription.updated` - Updates status/period
- ✅ `customer.subscription.deleted` - Marks as canceled
- ✅ `payment_intent.succeeded` - Confirms payment
- ✅ `payment_intent.payment_failed` - Handles failures

```typescript
model WebhookEvent {
  id          String   @id
  eventId     String   @unique  // Stripe event ID (deduplication)
  eventType   String
  status      String   @default("pending")
  payload     Json
  error       String?
  retryCount  Int      @default(0)
}
```

**Features**:
- ✅ Event deduplication by Stripe event ID
- ✅ Retry logic for failed webhooks
- ✅ Error tracking
- ✅ Email notifications for payment events

#### Invoice Management
- ✅ Fetches invoices from Stripe API
- ✅ Displays billing history in customer portal
- ✅ Provides download links for invoices

### Stripe Capabilities:
✅ **OAuth Connect** for creator onboarding  
✅ **Product/Price synchronization** with Stripe  
✅ **Subscription lifecycle** management  
✅ **Webhook processing** with retry logic  
✅ **Invoice retrieval** and display  
✅ **Payment status** tracking  
✅ **Connected account** management  

### Limitations:
⚠️ **No Stripe usage-based billing integration** (no `stripe.subscriptionItems.createUsageRecord`)  
⚠️ **No metered billing prices** in Stripe (all prices are fixed)  
⚠️ **Manual usage tracking only** (not synced to Stripe for billing)  
⚠️ **No automatic invoicing** based on usage  
⚠️ **No proration** for mid-period changes  

---

## 3. Billing and Subscription Management Logic

### Current Implementation: ✅ **IMPLEMENTED**

#### Subscription Lifecycle

**Creation**:
1. Creator sets up product and pricing tiers
2. Customer goes through Stripe Checkout
3. Webhook creates `Subscription` record
4. Links subscription to user, product, and tier

**Updates**:
- ✅ Change tier (`/api/saas/subscriptions/[id]/change-tier`)
- ✅ Update payment method (via Stripe Customer Portal)
- ✅ Update billing period

**Cancellation**:
- ✅ Immediate cancellation
- ✅ Cancel at period end
- ✅ Reactivation before period end

#### Creator Dashboard (`/dashboard`)

**Analytics**:
```typescript
model AnalyticsSnapshot {
  period             String    // daily, weekly, monthly
  periodStart        DateTime
  periodEnd          DateTime
  totalRevenue       Int       @default(0)
  newSubscribers     Int       @default(0)
  churnedSubscribers Int       @default(0)
  activeSubscribers  Int       @default(0)
  totalUsage         Float     @default(0)
}
```

**Features**:
- ✅ Revenue tracking
- ✅ Subscriber count (new, churned, active)
- ✅ Total usage aggregation
- ✅ Period-based snapshots

#### Customer Account Management (`/whitelabel/[domain]/account`)

**Customer Portal Features**:
- ✅ View subscription details (tier, features, billing period)
- ✅ View usage statistics (total, limit, percentage)
- ✅ Usage progress bar with visual indicators
- ✅ Recent activity history
- ✅ Invoice history with download links
- ✅ Payment method management (via Stripe)

```typescript
// Usage display
{
  total: 7500,
  limit: 10000,
  percentage: 75%,
  records: [
    { timestamp: "2025-01-15", quantity: 500 },
    ...
  ]
}
```

#### White-Label Configuration
- ✅ Custom branding per creator
- ✅ Custom domains/subdomains
- ✅ Custom colors, logos, favicons
- ✅ Custom CSS

### Billing Capabilities:
✅ **Multi-tier pricing** support  
✅ **Recurring billing** (monthly, yearly, quarterly)  
✅ **One-time payments**  
✅ **Usage tracking** and display  
✅ **Invoice management**  
✅ **Customer portal** with subscription details  
✅ **Creator analytics** dashboard  
✅ **White-label** customer experience  

### Limitations:
⚠️ **No prorated billing** for mid-cycle changes  
⚠️ **No dunning management** (failed payment retries)  
⚠️ **No revenue recognition** tools  
⚠️ **No tax calculation** integration  
⚠️ **No multi-currency** support  
⚠️ **Manual usage aggregation** (not automated per billing period)  

---

## 4. Limit Enforcement Capabilities

### Current Implementation: ❌ **NOT IMPLEMENTED**

#### What Exists:
✅ **Usage limits are stored** in the `Tier` model (`usageLimit` field)  
✅ **Usage is tracked** in `UsageRecord` table  
✅ **Total usage is calculated** on-demand  
✅ **Usage is displayed** to customers in the account portal  

#### What is Missing:
❌ **No enforcement mechanism** - usage can exceed limits  
❌ **No soft limits** (warnings at 80%, 90%)  
❌ **No hard limits** (blocking requests at 100%)  
❌ **No real-time limit checking** in the `/api/saas/usage` POST endpoint  
❌ **No automated notifications** when approaching limits  
❌ **No rate limiting** on API usage  
❌ **No overage handling** or charges  
❌ **No limit reset logic** at billing period boundaries  

### Current Architecture Gaps:

#### 1. No Limit Checking in Usage Tracking
The current `/api/saas/usage` POST endpoint **does not check limits**:

```typescript
// Current implementation (simplified)
export async function POST(request: NextRequest) {
  // ... authentication ...
  
  const { subscriptionId, userId, quantity } = await request.json();
  
  // Create usage record - NO LIMIT CHECK
  const usageRecord = await prisma.usageRecord.create({
    data: { subscriptionId, userId, quantity }
  });
  
  return NextResponse.json({ success: true });
}
```

**What's needed**:
```typescript
// Proposed enhancement
export async function POST(request: NextRequest) {
  const { subscriptionId, userId, quantity } = await request.json();
  
  // 1. Get subscription with tier and usage limit
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { tier: true }
  });
  
  // 2. Calculate current usage for this billing period
  const currentPeriodStart = subscription.currentPeriodStart;
  const currentUsage = await prisma.usageRecord.aggregate({
    where: {
      subscriptionId,
      timestamp: { gte: currentPeriodStart }
    },
    _sum: { quantity: true }
  });
  
  // 3. Check against limit
  const usageLimit = subscription.tier.usageLimit;
  const totalUsage = currentUsage._sum.quantity + quantity;
  
  if (usageLimit && totalUsage > usageLimit) {
    // HARD LIMIT - reject request
    return NextResponse.json({
      error: "Usage limit exceeded",
      limit: usageLimit,
      currentUsage: currentUsage._sum.quantity,
      requestedQuantity: quantity
    }, { status: 429 }); // Too Many Requests
  }
  
  // 4. Check soft limits (warning thresholds)
  const warningThreshold = usageLimit * 0.8; // 80%
  const criticalThreshold = usageLimit * 0.9; // 90%
  
  if (totalUsage >= criticalThreshold) {
    // Trigger critical warning notification
    await sendUsageWarning(userId, 'critical', totalUsage, usageLimit);
  } else if (totalUsage >= warningThreshold) {
    // Trigger warning notification
    await sendUsageWarning(userId, 'warning', totalUsage, usageLimit);
  }
  
  // 5. Create usage record
  const usageRecord = await prisma.usageRecord.create({
    data: { subscriptionId, userId, quantity }
  });
  
  return NextResponse.json({ 
    success: true,
    usageRecord,
    limits: {
      limit: usageLimit,
      currentUsage: totalUsage,
      remaining: usageLimit - totalUsage,
      percentage: (totalUsage / usageLimit) * 100
    }
  });
}
```

#### 2. No Limit Configuration

**What's needed**:
```typescript
// Enhanced Tier model
model Tier {
  usageLimit         Int?     // Maximum usage per period
  softLimitPercent   Float?   // Percentage for soft limit (e.g., 0.8 for 80%)
  warningThresholds  Json?    // Array of warning thresholds [0.5, 0.75, 0.9]
  limitAction        String?  // "block", "warn", "overage_charge"
  overageRate        Int?     // Cost per unit over limit (in cents)
}

// New model for limit violations
model UsageLimitEvent {
  id             String   @id @default(cuid())
  subscriptionId String
  userId         String
  eventType      String   // "warning", "critical", "exceeded", "reset"
  threshold      Float    // Percentage threshold (0.8, 0.9, 1.0)
  currentUsage   Float
  usageLimit     Int
  timestamp      DateTime @default(now())
  notificationSent Boolean @default(false)
}
```

#### 3. No Automated Notifications

**What's needed**:
```typescript
// Notification service for usage warnings
async function sendUsageWarning(
  userId: string,
  level: 'warning' | 'critical' | 'exceeded',
  currentUsage: number,
  limit: number
) {
  const percentage = (currentUsage / limit) * 100;
  
  // Create notification record
  await prisma.emailNotification.create({
    data: {
      userId,
      type: `usage_${level}`,
      subject: `Usage ${level}: ${percentage.toFixed(0)}% of limit reached`,
      body: `You have used ${currentUsage} of ${limit} units (${percentage.toFixed(1)}%)`,
      recipient: user.email,
      status: 'pending'
    }
  });
  
  // Trigger email send (or in-app notification)
  // ... email sending logic ...
}
```

#### 4. No Usage Reset at Period Boundaries

**What's needed**:
- Scheduled job to reset usage counters at billing period start
- Or, use date-based queries to calculate usage within current period only
- Track period-based usage in separate aggregation table

```typescript
// Usage aggregation per billing period
model UsageAggregation {
  id             String   @id
  subscriptionId String
  periodStart    DateTime
  periodEnd      DateTime
  totalUsage     Float
  limitExceeded  Boolean  @default(false)
  peakUsage      Float?
  averageUsage   Float?
}
```

---

## Recommendations

### Priority 1: Implement Limit Enforcement (Critical)

#### 1.1 Hard Limits
- ✅ **Goal**: Block requests when usage limit is reached
- **Implementation**: Modify `/api/saas/usage` POST to check limits before recording
- **User Experience**: Return 429 status with clear error message
- **Configuration**: Add `limitAction` field to Tier (block, warn, allow)

```typescript
// Creator configuration
{
  "limitAction": "block",  // Strictly enforce limit
  "usageLimit": 10000
}
```

#### 1.2 Soft Limits (Warning Thresholds)
- ✅ **Goal**: Warn users before hitting hard limit
- **Implementation**: Check usage against configurable thresholds (80%, 90%, 95%)
- **Notifications**: Email + in-app notifications
- **Deduplication**: Only send one notification per threshold per period

```typescript
// Creator configuration
{
  "warningThresholds": [0.8, 0.9, 0.95],  // 80%, 90%, 95%
  "notificationChannels": ["email", "webhook"]
}
```

#### 1.3 Overage Handling
- ✅ **Goal**: Allow usage beyond limit with additional charges
- **Implementation**: 
  - Add `overageAllowed` and `overageRate` to Tier
  - Track overage usage separately
  - Create overage invoices via Stripe
  
```typescript
// Creator configuration
{
  "limitAction": "overage_charge",
  "usageLimit": 10000,
  "overageRate": 5,  // $0.05 per unit over limit
  "overageAllowed": true
}
```

### Priority 2: Enhanced Stripe Integration

#### 2.1 Stripe Usage-Based Billing
- **Goal**: Report usage to Stripe for automatic invoicing
- **API**: `stripe.subscriptionItems.createUsageRecord()`
- **Implementation**: 
  - Create Stripe prices with `usage_type: 'metered'`
  - Report usage to Stripe in addition to local tracking
  - Let Stripe handle invoicing

```typescript
// When recording usage
await stripe.subscriptionItems.createUsageRecord(
  subscriptionItem.id,
  {
    quantity: quantity,
    timestamp: Math.floor(Date.now() / 1000),
    action: 'set'  // or 'increment'
  }
);
```

#### 2.2 Hybrid Pricing Models
- **Goal**: Combine flat-rate + usage-based pricing
- **Example**: $99/month base + $0.10 per API call over 1000
- **Implementation**: 
  - Create subscription with multiple subscription items
  - One for base fee, one for metered usage

### Priority 3: Real-Time Monitoring & Alerts

#### 3.1 Usage Dashboard Widget
- Real-time usage display in customer portal
- Visual indicators (green < 80%, yellow 80-95%, red > 95%)
- Projected usage for current period
- Historical trends

#### 3.2 Creator Alert System
- Notify creators when customers approach limits
- Upsell opportunities (offer higher tiers)
- Churn risk alerts (customers hitting limits frequently)

#### 3.3 Webhook Notifications
- Send webhooks to creator's systems on limit events
- Enable custom automation (e.g., temporary limit increase)

### Priority 4: Advanced Metering Features

#### 4.1 Rate Limiting
- Implement per-second/minute/hour rate limits
- Separate from billing period usage limits
- Prevent abuse and ensure fair usage

#### 4.2 Usage Quotas
- Different limits for different resource types
- Example: 10,000 API calls + 100 GB storage
- Track and enforce each quota independently

#### 4.3 Burst Allowances
- Allow temporary spikes above limit
- Example: 10,000 requests/day, burst up to 1,000/hour
- Smooth out usage patterns

### Priority 5: Analytics & Reporting

#### 5.1 Usage Analytics
- Usage trends over time
- Top users by usage
- Peak usage times
- Anomaly detection

#### 5.2 Revenue Forecasting
- Predict revenue based on usage patterns
- Identify growth opportunities
- Capacity planning

#### 5.3 Export & Integration
- Export usage data to CSV/JSON
- Integration with data warehouses
- API for programmatic access

---

## Implementation Roadmap

### Phase 1: Core Limit Enforcement (2-3 weeks)
1. ✅ Add limit checking to `/api/saas/usage` POST
2. ✅ Implement hard limit blocking (429 responses)
3. ✅ Add soft limit warnings (80%, 90%)
4. ✅ Create `UsageLimitEvent` model and tracking
5. ✅ Implement email notifications for warnings
6. ✅ Add limit status to usage API responses
7. ✅ Update customer portal to show limit status

### Phase 2: Stripe Metered Billing (2-3 weeks)
1. ✅ Add support for Stripe metered prices
2. ✅ Implement `stripe.subscriptionItems.createUsageRecord()`
3. ✅ Sync usage to Stripe on each tracking event
4. ✅ Test automated Stripe invoicing
5. ✅ Add overage charge support
6. ✅ Update tier creation to support metered pricing

### Phase 3: Advanced Notifications (1-2 weeks)
1. ✅ In-app notification system
2. ✅ Webhook notifications to creators
3. ✅ Configurable notification preferences
4. ✅ Deduplication and throttling
5. ✅ Notification history and audit log

### Phase 4: Analytics & Monitoring (2-3 weeks)
1. ✅ Usage dashboard widgets
2. ✅ Real-time usage charts
3. ✅ Historical trends and forecasting
4. ✅ Anomaly detection
5. ✅ Export capabilities

### Phase 5: Rate Limiting & Quotas (1-2 weeks)
1. ✅ Implement rate limiting middleware
2. ✅ Multi-dimensional quotas
3. ✅ Burst allowances
4. ✅ Rate limit headers in API responses

---

## Security Considerations

### Current Security: ✅ Good
- ✅ API key authentication for usage tracking
- ✅ Permission-based access control
- ✅ Subscription ownership validation
- ✅ Webhook signature verification

### Recommended Enhancements:
- 🔒 Add rate limiting to prevent API abuse
- 🔒 Encrypt sensitive usage metadata
- 🔒 Audit logging for all limit violations
- 🔒 IP whitelisting for usage tracking APIs
- 🔒 Two-factor authentication for high-value accounts

---

## Cost Implications

### Current Costs:
- ✅ Stripe fees: 2.9% + $0.30 per transaction
- ✅ Database storage for usage records
- ✅ API infrastructure (Next.js/Vercel)

### Additional Costs with Enhancements:
- **Stripe metered billing**: Same 2.9% + $0.30, but more frequent invoicing
- **Notification service**: Email sending costs (SendGrid, Postmark)
- **Monitoring**: APM tools for usage analytics (optional)
- **Database**: More storage for aggregations and limit events (~10-20% increase)

---

## Competitive Analysis

### Industry Standards:

**Stripe Billing**:
- ✅ Metered billing built-in
- ✅ Usage-based pricing tiers
- ✅ Automatic invoicing
- ✅ Proration and credits

**AWS**:
- ✅ Per-second billing
- ✅ Usage quotas and limits
- ✅ CloudWatch monitoring
- ✅ Budget alerts

**Twilio**:
- ✅ Pay-as-you-go pricing
- ✅ Account limits and warnings
- ✅ Auto-recharge options
- ✅ Usage analytics dashboard

**This Platform** (Current):
- ✅ Basic usage tracking
- ⚠️ No limit enforcement
- ⚠️ No automated billing from usage
- ✅ Good Stripe integration foundation

---

## Conclusion

### Strengths:
1. ✅ **Solid foundation** for usage tracking with flexible metering types
2. ✅ **Comprehensive Stripe integration** with OAuth and webhooks
3. ✅ **Good data model** with proper indexing and relationships
4. ✅ **White-label** customer experience
5. ✅ **API-first architecture** with authentication and permissions

### Critical Gaps:
1. ❌ **No limit enforcement** - This is the biggest gap
2. ❌ **No usage-based billing** with Stripe metered prices
3. ❌ **No automated notifications** for approaching limits
4. ❌ **No rate limiting** on API endpoints

### Recommended Next Steps:
1. **Immediate**: Implement hard and soft limit enforcement (Phase 1)
2. **Short-term**: Add Stripe metered billing integration (Phase 2)
3. **Medium-term**: Build notification and alert system (Phase 3)
4. **Long-term**: Advanced analytics and multi-dimensional quotas (Phases 4-5)

### Effort Estimate:
- **Phase 1** (Limit Enforcement): **2-3 weeks** - High Priority ⚡
- **Phase 2** (Stripe Metered Billing): **2-3 weeks** - High Priority ⚡
- **Phase 3** (Notifications): **1-2 weeks** - Medium Priority
- **Phase 4** (Analytics): **2-3 weeks** - Medium Priority
- **Phase 5** (Rate Limiting): **1-2 weeks** - Low Priority

**Total Effort**: ~8-13 weeks for complete implementation

---

## Appendix A: API Examples

### Current Usage Tracking
```bash
# Track usage
curl -X POST https://platform.com/api/saas/usage \
  -H "x-api-key: sk_test_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_xxx",
    "userId": "user_xxx",
    "quantity": 100,
    "metadata": {
      "endpoint": "/api/users",
      "method": "GET"
    }
  }'

# Get usage stats
curl -X GET "https://platform.com/api/saas/usage?subscriptionId=sub_xxx" \
  -H "x-api-key: sk_test_xxx"
```

### Proposed Enhanced Response
```json
{
  "success": true,
  "usageRecord": {
    "id": "rec_xxx",
    "quantity": 100,
    "timestamp": "2025-01-15T10:30:00Z"
  },
  "limits": {
    "limit": 10000,
    "currentUsage": 7500,
    "remaining": 2500,
    "percentage": 75,
    "warnings": [
      {
        "threshold": 80,
        "reached": false
      },
      {
        "threshold": 90,
        "reached": false
      }
    ]
  },
  "periodInfo": {
    "start": "2025-01-01T00:00:00Z",
    "end": "2025-02-01T00:00:00Z",
    "daysRemaining": 16
  }
}
```

---

## Appendix B: Database Schema Enhancements

### Proposed Schema Changes

```prisma
// Enhanced Tier model
model Tier {
  id                  String   @id @default(cuid())
  // ... existing fields ...
  usageLimit          Int?     // Maximum usage per period
  softLimitPercent    Float?   @default(0.8)  // Soft limit at 80%
  warningThresholds   Json?    // [0.8, 0.9, 0.95]
  limitAction         String?  @default("warn")  // "block", "warn", "overage_charge"
  overageRate         Int?     // Cost per unit over limit (cents)
  overageAllowed      Boolean  @default(false)
  resetPeriod         String?  @default("billing_period")  // or "daily", "weekly"
}

// New model for tracking limit events
model UsageLimitEvent {
  id                String       @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id])
  userId            String
  user              User         @relation(fields: [userId], references: [id])
  eventType         String       // "warning", "critical", "exceeded", "reset"
  threshold         Float        // 0.8, 0.9, 1.0, etc.
  currentUsage      Float
  usageLimit        Int
  percentage        Float
  timestamp         DateTime     @default(now())
  notificationSent  Boolean      @default(false)
  metadata          Json?
  
  @@index([subscriptionId, timestamp])
  @@index([userId, timestamp])
  @@index([eventType])
}

// New model for period-based usage aggregation
model UsageAggregation {
  id                String       @id @default(cuid())
  subscriptionId    String
  subscription      Subscription @relation(fields: [subscriptionId], references: [id])
  periodStart       DateTime
  periodEnd         DateTime
  totalUsage        Float
  peakUsage         Float?
  averageUsage      Float?
  limitExceeded     Boolean      @default(false)
  overageAmount     Float?
  overageCharge     Int?         // In cents
  createdAt         DateTime     @default(now())
  updatedAt         DateTime     @updatedAt
  
  @@unique([subscriptionId, periodStart])
  @@index([subscriptionId])
  @@index([periodStart])
}

// Enhanced MeteringConfig
model MeteringConfig {
  id                  String   @id @default(cuid())
  // ... existing fields ...
  rateLimitPerSecond  Int?     // Rate limit per second
  rateLimitPerMinute  Int?     // Rate limit per minute
  rateLimitPerHour    Int?     // Rate limit per hour
  burstAllowance      Int?     // Burst capacity
  quotaType           String?  @default("billing_period")  // or "daily", "hourly"
}
```

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Author**: Copilot  
**Status**: Draft for Review
