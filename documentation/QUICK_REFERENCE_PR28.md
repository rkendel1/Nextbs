# PR #28 Quick Reference

Quick reference for using the limit enforcement and Stripe metered billing features.

## Table of Contents
- [Usage Tracking with Limits](#usage-tracking-with-limits)
- [Tier Configuration](#tier-configuration)
- [Stripe Metered Billing](#stripe-metered-billing)
- [Event Monitoring](#event-monitoring)
- [Common Scenarios](#common-scenarios)

## Usage Tracking with Limits

### Track Usage (POST /api/saas/usage)

**Request:**
```bash
curl -X POST http://localhost:3000/api/saas/usage \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_123",
    "userId": "user_123",
    "quantity": 100,
    "metadata": {
      "endpoint": "/api/example",
      "method": "GET"
    }
  }'
```

**Success Response (200):**
```json
{
  "success": true,
  "usageRecord": {
    "id": "rec_123",
    "quantity": 100,
    "timestamp": "2025-10-10T12:00:00Z",
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

**Limit Exceeded Response (429):**
```json
{
  "error": "Usage limit exceeded",
  "limits": {
    "limit": 10000,
    "currentUsage": 10000,
    "requestedQuantity": 100,
    "percentage": "101.0"
  }
}
```

## Tier Configuration

### Limit Actions

#### Hard Limit (Block)
```sql
UPDATE "Tier" SET
  "usageLimit" = 10000,
  "limitAction" = 'block',
  "softLimitPercent" = 0.8,
  "warningThresholds" = '[80, 90, 95]'::jsonb
WHERE id = 'tier_id';
```
- Blocks requests at limit
- Returns 429 error
- Sends notifications at thresholds

#### Soft Limit (Warn)
```sql
UPDATE "Tier" SET
  "usageLimit" = 10000,
  "limitAction" = 'warn',
  "softLimitPercent" = 0.8,
  "warningThresholds" = '[80, 90]'::jsonb
WHERE id = 'tier_id';
```
- Allows unlimited usage
- Sends warnings only
- Tracks overage

#### Overage Mode
```sql
UPDATE "Tier" SET
  "usageLimit" = 10000,
  "limitAction" = 'overage',
  "overageAllowed" = true,
  "overageRate" = 10,
  "warningThresholds" = '[90, 100]'::jsonb
WHERE id = 'tier_id';
```
- Allows overage
- Charges $0.10 per unit over limit
- Sends warning at 90% and 100%

### Warning Threshold Configuration

**Default Thresholds:** 80%, 90%, 95%

**Custom Thresholds:**
```sql
UPDATE "Tier" SET
  "warningThresholds" = '[70, 85, 95, 98]'::jsonb
WHERE id = 'tier_id';
```

**Disable Warnings:**
```sql
UPDATE "Tier" SET
  "warningThresholds" = '[]'::jsonb
WHERE id = 'tier_id';
```

## Stripe Metered Billing

### Enable Metered Billing

1. **Create Metered Price in Stripe:**
```bash
stripe prices create \
  --product prod_123 \
  --currency usd \
  --recurring '{"interval": "month", "usage_type": "metered", "aggregate_usage": "sum"}' \
  --billing-scheme per_unit \
  --unit-amount 100
```

2. **Update Tier:**
```sql
UPDATE "Tier" SET
  "meteringEnabled" = true,
  "stripePriceIdMetered" = 'price_123',
  "unitPrice" = 100
WHERE id = 'tier_id';
```

3. **Create Subscription Item Record:**
```sql
INSERT INTO "StripeSubscriptionItem" (
  id, "subscriptionId", "stripeSubscriptionItemId",
  "stripePriceId", "itemType", "meteringType", "createdAt", "updatedAt"
) VALUES (
  'item_123', 'sub_123', 'si_123',
  'price_123', 'metered_usage', 'api_calls', NOW(), NOW()
);
```

### Hybrid Pricing (Base + Metered)

**Tier Configuration:**
```sql
UPDATE "Tier" SET
  "priceAmount" = 9900,          -- $99 base
  "usageLimit" = 10000,          -- 10k included
  "meteringEnabled" = true,
  "stripePriceIdMetered" = 'price_123',
  "unitPrice" = 2                -- $0.02 per unit over limit
WHERE id = 'tier_id';
```

**Result:**
- $99/month base fee
- 10,000 units included
- $0.02 per unit over 10,000

## Event Monitoring

### Check Limit Events
```sql
SELECT 
  e.*,
  u.email,
  s.status as subscription_status
FROM "UsageLimitEvent" e
JOIN "User" u ON e."userId" = u.id
JOIN "Subscription" s ON e."subscriptionId" = s.id
WHERE e."timestamp" > NOW() - INTERVAL '7 days'
ORDER BY e."timestamp" DESC;
```

### Check Pending Notifications
```sql
SELECT * FROM "EmailNotification"
WHERE type LIKE 'usage_%'
  AND status = 'pending'
ORDER BY "createdAt" DESC;
```

### Check Stripe Reporting
```sql
SELECT 
  si.*,
  s."stripeSubscriptionId"
FROM "StripeSubscriptionItem" si
JOIN "Subscription" s ON si."subscriptionId" = s.id
WHERE si."lastReportedAt" > NOW() - INTERVAL '1 day'
ORDER BY si."lastReportedAt" DESC;
```

## Common Scenarios

### Scenario 1: User Approaching Limit

**Event Flow:**
1. User tracks usage → 85% of limit
2. System checks: Should send warning?
3. No existing warning at 80% threshold
4. Creates UsageLimitEvent (eventType: "warning")
5. Creates EmailNotification (type: "usage_warning")
6. Returns success with warning in response

**Database Changes:**
```sql
-- UsageLimitEvent
INSERT INTO "UsageLimitEvent" (...)
VALUES ('evt_123', 'sub_123', 'user_123', 'warning', 0.8, 8500, 10000, 85.0, ...);

-- EmailNotification
INSERT INTO "EmailNotification" (...)
VALUES ('email_123', 'user_123', 'usage_warning', '⚡ Notice: 85% of Usage Limit Reached', ...);
```

### Scenario 2: User Exceeds Hard Limit

**Event Flow:**
1. User tracks usage → Would be 105% of limit
2. System checks: Limit exceeded & action is "block"
3. Creates UsageLimitEvent (eventType: "exceeded")
4. Creates EmailNotification (type: "usage_exceeded")
5. Returns 429 error, usage NOT recorded

**API Response:**
```json
{
  "error": "Usage limit exceeded",
  "limits": {
    "limit": 10000,
    "currentUsage": 10000,
    "requestedQuantity": 500,
    "percentage": "105.0"
  }
}
```

### Scenario 3: Stripe Metered Billing

**Event Flow:**
1. User tracks usage → 100 units
2. Usage recorded locally
3. Checks: meteringEnabled = true
4. Finds StripeSubscriptionItem for subscription
5. Calls `stripe.subscriptionItems.createUsageRecord()`
6. Updates StripeSubscriptionItem with lastReportedUsage
7. Returns success with stripeReported: true

**At Period End:**
- Stripe automatically invoices
- Invoice includes base fee + metered usage
- Customer charged automatically

### Scenario 4: Warning Deduplication

**Event Flow:**
1. User at 85% → Warning sent
2. User tracks more → Now at 87%
3. System checks: Already sent warning at 80%?
4. Yes → No new notification
5. User tracks more → Now at 92%
6. System checks: Already sent warning at 90%?
7. No → New critical warning sent

## Utility Functions

### Check Usage Limit
```typescript
import { checkUsageLimit } from '@/utils/usageLimits';

const result = await checkUsageLimit(subscriptionId, 100);
if (!result.allowed) {
  // Blocked!
  console.log(`Limit exceeded: ${result.reason}`);
}
```

### Report to Stripe
```typescript
import { reportUsageToStripe } from '@/utils/stripeUsageReporting';

const reported = await reportUsageToStripe(
  subscriptionId,
  100,
  new Date()
);
console.log(`Stripe reported: ${reported}`);
```

### Get Current Usage
```typescript
import { getCurrentPeriodUsage } from '@/utils/usageLimits';

const usage = await getCurrentPeriodUsage(
  subscriptionId,
  periodStart
);
console.log(`Current usage: ${usage}`);
```

## API Permissions

Required permissions for usage tracking:
- `usage:write` - Track usage (POST)
- `usage:read` - Get usage stats (GET)

Generate API key with permissions:
```sql
INSERT INTO "ApiKey" (
  id, "userId", name, key, permissions, "isActive", "createdAt", "updatedAt"
) VALUES (
  'key_123', 'user_123', 'Usage Tracker',
  'sk_test_123...', ARRAY['usage:write', 'usage:read'],
  true, NOW(), NOW()
);
```

## Troubleshooting

### Usage Not Reporting to Stripe
1. Check `meteringEnabled` on tier
2. Verify StripeSubscriptionItem exists
3. Check Stripe API logs
4. Verify STRIPE_SECRET_KEY is set

### No Warning Emails Sent
1. Check EmailNotification table for pending
2. Verify email service is configured
3. Check warningThresholds on tier
4. Verify user has email address

### Limit Not Enforced
1. Check `limitAction` on tier
2. Verify `usageLimit` is set
3. Check tier is linked to subscription
4. Review API logs for errors

## Performance Tips

1. **Indexes**: Already optimized with proper indexes
2. **Caching**: Consider caching current usage
3. **Batch Updates**: Use Stripe batch reporting for high volume
4. **Async Processing**: Email sending should be async
5. **Monitoring**: Set up alerts on UsageLimitEvent

## Security Notes

1. **API Keys**: Required for all usage tracking
2. **Validation**: Subscription ownership verified
3. **Rate Limiting**: Consider adding to prevent abuse
4. **Audit Trail**: All events logged in UsageLimitEvent
5. **Stripe Webhooks**: Verify signature on webhook events

---

For more details, see:
- [PR28_IMPLEMENTATION.md](./PR28_IMPLEMENTATION.md)
- [test-pr28-implementation.sh](./test-pr28-implementation.sh)
- [IMPLEMENTATION_CHECKLIST.md](./IMPLEMENTATION_CHECKLIST.md)
