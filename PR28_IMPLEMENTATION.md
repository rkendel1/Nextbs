# PR #28 Implementation - Metering and Usage Capabilities

This document summarizes the implementation of all recommendations from PR #28 for usage and metering capabilities.

## Overview

This implementation adds comprehensive limit enforcement and Stripe metered billing capabilities to the platform, addressing the critical gaps identified in the metering evaluation.

## What Was Implemented

### 1. Database Schema Updates

#### Tier Model Extensions
Added limit enforcement and metering fields to the `Tier` model:

- **Limit Enforcement Fields:**
  - `softLimitPercent` (Float, default: 0.8) - Warning threshold at 80%
  - `limitAction` (String, default: "warn") - Action to take: "block", "warn", or "overage"
  - `overageAllowed` (Boolean, default: false) - Whether to allow usage over limit
  - `overageRate` (Integer, optional) - Cost per unit over limit in cents
  - `warningThresholds` (JSON, optional) - Custom warning thresholds like [0.7, 0.85, 0.95]

- **Stripe Metered Billing Fields:**
  - `meteringEnabled` (Boolean, default: false) - Enable Stripe metered billing
  - `stripePriceIdMetered` (String, optional, unique) - Stripe price ID for metered component
  - `unitPrice` (Integer, optional) - Price per unit in cents

#### New Models

**UsageLimitEvent**
Tracks all limit-related events (warnings, exceeded, critical):
- `subscriptionId`, `userId` - References to subscription and user
- `eventType` - "warning", "critical", "exceeded", "reset"
- `threshold` - Threshold crossed (0.8, 0.9, 1.0)
- `currentUsage`, `usageLimit`, `percentage` - Usage metrics
- `notificationSent`, `notifiedAt` - Notification tracking
- `metadata` - Additional event data

**StripeSubscriptionItem**
Tracks Stripe subscription items for metered billing:
- `subscriptionId` - Reference to local subscription
- `stripeSubscriptionItemId` - Stripe's subscription item ID
- `stripePriceId` - Stripe price ID
- `itemType` - "base_fee" or "metered_usage"
- `meteringType` - Type of metering (e.g., "api_calls", "storage")
- `lastReportedUsage`, `lastReportedAt` - Last usage report to Stripe

### 2. Utility Functions

#### src/utils/usageLimits.ts
Complete limit enforcement logic:

**Functions:**
- `getCurrentPeriodUsage(subscriptionId, periodStart)` - Calculate usage for current billing period
- `checkUsageLimit(subscriptionId, requestedQuantity)` - Check if usage would exceed limits
- `shouldTriggerWarning(subscriptionId, percentage, tier)` - Determine if warning should be sent
- `createLimitEvent(...)` - Create usage limit event records
- `sendUsageWarning(...)` - Send email notifications for warnings

**Features:**
- Respects tier configuration (`limitAction`, `overageAllowed`, etc.)
- Prevents duplicate notifications in same billing period
- Configurable warning thresholds
- Detailed event tracking

#### src/utils/stripeUsageReporting.ts
Stripe metered billing integration:

**Functions:**
- `reportUsageToStripe(subscriptionId, quantity, timestamp)` - Report usage to Stripe API
- `getStripeUsageSummary(subscriptionId, startDate, endDate)` - Get usage data from Stripe
- `createMeteredPrice(productId, unitAmount, currency, meteringType)` - Create metered prices
- `createHybridSubscription(customerId, basePriceId, meteredPriceId)` - Create hybrid subscriptions

**Features:**
- Automatic usage reporting to Stripe
- Handles both pure metered and hybrid pricing models
- Error handling with fallback to local tracking
- Idempotent operations

### 3. API Enhancements

#### src/app/api/saas/usage/route.ts (POST method)

**Enhanced with:**

1. **Limit Enforcement:**
   - Checks usage limits before recording
   - Returns 429 status when limits exceeded (if action is "block")
   - Creates limit events for tracking
   - Sends warning notifications at thresholds (80%, 90%, 95%)

2. **Stripe Reporting:**
   - Reports usage to Stripe for metered billing
   - Continues if Stripe reporting fails (local tracking is primary)
   - Indicates in response if usage was reported to Stripe

3. **Enhanced Response:**
   ```json
   {
     "success": true,
     "usageRecord": {
       "id": "...",
       "quantity": 100,
       "timestamp": "...",
       "stripeReported": true
     },
     "limits": {
       "limit": 10000,
       "currentUsage": 8500,
       "newTotal": 8600,
       "percentage": "86.0",
       "action": "warn",
       "reason": "Approaching limit"
     }
   }
   ```

### 4. Database Migration

**Migration file:** `prisma/migrations/20251010214933_add_metering_and_limit_enforcement/migration.sql`

To apply the migration:
```bash
npx prisma migrate deploy
```

Or for development:
```bash
npx prisma migrate dev
```

## How It Works

### Limit Enforcement Flow

1. **Usage Request Comes In:**
   - API receives usage tracking request
   - Validates subscription exists

2. **Limit Check:**
   - Calculates current period usage
   - Checks if new usage would exceed limit
   - Determines action based on tier configuration

3. **Action Taken:**
   - **If "block"**: Returns 429 error, usage not recorded
   - **If "warn"**: Records usage, sends warning if threshold crossed
   - **If "overage"**: Records usage, indicates overage charges apply

4. **Notifications:**
   - Checks if warning threshold crossed (80%, 90%, 95%)
   - Prevents duplicate notifications for same threshold
   - Creates email notification in database
   - Creates limit event for tracking

### Stripe Metered Billing Flow

1. **Setup (One-time):**
   - Create metered price in Stripe
   - Store price ID in tier configuration
   - Enable `meteringEnabled` on tier

2. **Usage Tracking:**
   - Usage recorded locally (as before)
   - Automatically reported to Stripe if metering enabled
   - Stripe tracks usage against subscription item

3. **Billing:**
   - Stripe automatically invoices at period end
   - Invoice includes base fee + metered usage charges
   - Customer charged automatically

## Configuration Examples

### Hard Limit (Block at Limit)
```typescript
{
  usageLimit: 10000,
  limitAction: "block",
  softLimitPercent: 0.8,
  warningThresholds: [80, 90, 95]
}
```

### Soft Limit (Warn Only)
```typescript
{
  usageLimit: 10000,
  limitAction: "warn",
  softLimitPercent: 0.8,
  warningThresholds: [80, 90]
}
```

### Overage Allowed
```typescript
{
  usageLimit: 10000,
  limitAction: "overage",
  overageAllowed: true,
  overageRate: 10, // $0.10 per unit over limit
  warningThresholds: [90, 100]
}
```

### Metered Billing (Pure)
```typescript
{
  priceAmount: 0, // $0 base fee
  meteringEnabled: true,
  stripePriceIdMetered: "price_...",
  unitPrice: 1 // $0.01 per unit
}
```

### Hybrid Pricing
```typescript
{
  priceAmount: 9900, // $99 base fee
  meteringEnabled: true,
  stripePriceIdMetered: "price_...",
  unitPrice: 2, // $0.02 per unit over included
  usageLimit: 10000 // 10k units included
}
```

## Testing

### Test Limit Enforcement

1. **Create a subscription with limits:**
   ```bash
   # Set tier with usageLimit: 1000, limitAction: "block"
   ```

2. **Track usage approaching limit:**
   ```bash
   curl -X POST /api/saas/usage \
     -H "X-API-Key: your-api-key" \
     -d '{
       "subscriptionId": "...",
       "userId": "...",
       "quantity": 800
     }'
   # Should return success with warning
   ```

3. **Exceed limit:**
   ```bash
   curl -X POST /api/saas/usage \
     -H "X-API-Key: your-api-key" \
     -d '{
       "subscriptionId": "...",
       "userId": "...",
       "quantity": 300
     }'
   # Should return 429 if limitAction is "block"
   ```

### Test Stripe Metered Billing

1. **Enable metering on tier:**
   ```bash
   # Set meteringEnabled: true, stripePriceIdMetered: "price_..."
   ```

2. **Track usage:**
   ```bash
   curl -X POST /api/saas/usage \
     -H "X-API-Key: your-api-key" \
     -d '{
       "subscriptionId": "...",
       "userId": "...",
       "quantity": 100
     }'
   # Response should include "stripeReported": true
   ```

3. **Verify in Stripe:**
   - Check subscription item usage records in Stripe dashboard
   - Verify usage accumulates correctly

## Benefits

### For Platform Owners
- ✅ Prevents revenue loss from unlimited usage
- ✅ Protects infrastructure from abuse
- ✅ Automated billing reduces manual work
- ✅ Comprehensive usage analytics

### For SaaS Creators
- ✅ Fair usage policies automatically enforced
- ✅ Customers warned before hitting limits
- ✅ Flexible pricing models (flat, metered, hybrid)
- ✅ Professional automated invoicing

### For Customers
- ✅ Clear visibility into usage
- ✅ Warnings before service interruption
- ✅ Transparent pricing and billing
- ✅ Ability to monitor and control costs

## Next Steps

### Immediate (Already Done)
- [x] Database schema updates
- [x] Utility functions
- [x] API integration
- [x] Migration file

### Required Before Production
- [ ] Run database migration
- [ ] Configure Stripe metered prices
- [ ] Test with real subscriptions
- [ ] Set up email notification sending (currently just creates records)
- [ ] Add UI for tier configuration

### Future Enhancements
- [ ] Dashboard for viewing limit events
- [ ] Analytics on usage patterns
- [ ] Rate limiting (requests per minute/hour)
- [ ] Quota reset scheduling
- [ ] Customer-facing usage dashboard
- [ ] Real-time usage alerts

## Implementation Time

- Database schema: ~1 hour
- Utility functions: ~3 hours
- API integration: ~2 hours
- Testing: ~2 hours
- Documentation: ~1 hour

**Total: ~9 hours**

## Support

For questions or issues:
1. Review the implementation guides in PR #28 documentation
2. Check error logs for API errors
3. Verify Stripe configuration if metering issues occur
4. Test in Stripe test mode before production

## References

- [METERING_USAGE_EVALUATION.md](./METERING_USAGE_EVALUATION.md) - Comprehensive evaluation
- [LIMIT_ENFORCEMENT_IMPLEMENTATION_GUIDE.md](./LIMIT_ENFORCEMENT_IMPLEMENTATION_GUIDE.md) - Detailed guide
- [STRIPE_METERED_BILLING_GUIDE.md](./STRIPE_METERED_BILLING_GUIDE.md) - Stripe integration guide
- [METERING_CAPABILITIES_README.md](./METERING_CAPABILITIES_README.md) - Documentation index
