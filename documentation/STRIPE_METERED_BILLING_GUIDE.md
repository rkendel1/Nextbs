# Stripe Metered Billing Integration Guide

**Companion to**: METERING_USAGE_EVALUATION.md  
**Date**: 2025-10-10  
**Purpose**: Implementation guide for integrating Stripe's native metered billing

---

## Overview

This guide shows how to integrate **Stripe's metered billing** to automatically charge customers based on actual usage. This eliminates the need for manual usage tracking and invoicing.

### Benefits of Stripe Metered Billing

✅ **Automatic invoicing** based on usage  
✅ **Accurate billing** at period end  
✅ **Proration** for mid-period changes  
✅ **Customer portal** with usage visibility  
✅ **Dunning management** built-in  
✅ **Tax calculation** support  

---

## Architecture Overview

### Current Flow (Manual Tracking)
```
Customer uses service
    ↓
Creator calls /api/saas/usage (POST)
    ↓
Usage stored in database
    ↓
Creator manually creates invoices
    ↓
Customer pays invoice
```

### New Flow (Stripe Metered Billing)
```
Customer uses service
    ↓
Creator calls /api/saas/usage (POST)
    ↓
Usage stored locally AND reported to Stripe
    ↓
Stripe automatically invoices at period end
    ↓
Customer pays automatically via Stripe
```

---

## Step 1: Update Database Schema

### Add Stripe subscription item tracking

```prisma
// prisma/schema.prisma

model Subscription {
  id                     String   @id @default(cuid())
  // ... existing fields ...
  
  // NEW: Track Stripe subscription items
  stripeSubscriptionId   String?  @unique
  stripeItems            StripeSubscriptionItem[]
}

// NEW MODEL: Track Stripe subscription items
model StripeSubscriptionItem {
  id                     String       @id @default(cuid())
  subscriptionId         String
  subscription           Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  stripeSubscriptionItemId String     @unique
  stripePriceId          String
  itemType               String       // "base_fee" or "metered_usage"
  meteringType           String?      // "api_calls", "storage", etc.
  lastReportedUsage      Float?       @default(0)
  lastReportedAt         DateTime?
  createdAt              DateTime     @default(now())
  updatedAt              DateTime     @updatedAt
  
  @@index([subscriptionId])
  @@index([stripeSubscriptionItemId])
}

model Tier {
  // ... existing fields ...
  
  // NEW: Support for metered pricing
  meteringEnabled        Boolean      @default(false)
  stripePriceIdMetered   String?      @unique  // Separate price for metered component
  unitPrice              Int?         // Price per unit in cents (for metered)
}
```

Run migration:
```bash
npx prisma migrate dev --name add_stripe_metered_billing
npx prisma generate
```

---

## Step 2: Create Metered Prices in Stripe

### Update: `src/app/api/saas/tiers/route.ts`

```typescript
import Stripe from "stripe";

// POST create tier with metered pricing
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  // ... auth checks ...

  const {
    productId,
    name,
    priceAmount,      // Base subscription fee
    billingPeriod,
    usageLimit,
    meteringEnabled,  // NEW
    unitPrice,        // NEW: price per unit for metered billing
  } = await request.json();

  // Get product and creator's Stripe account
  const product = await prisma.product.findUnique({
    where: { id: productId },
    include: {
      saasCreator: {
        include: { stripeAccount: true }
      }
    }
  });

  if (!product?.saasCreator.stripeAccount?.accessToken) {
    return NextResponse.json(
      { error: "Stripe account not connected" },
      { status: 400 }
    );
  }

  // Use creator's Stripe account
  const stripe = new Stripe(product.saasCreator.stripeAccount.accessToken, {
    apiVersion: "2023-10-16",
  });

  let stripePriceId = null;
  let stripePriceIdMetered = null;

  try {
    // 1. Create base recurring price (if priceAmount > 0)
    if (priceAmount > 0) {
      const basePrice = await stripe.prices.create({
        product: product.stripeProductId!,
        unit_amount: parseInt(priceAmount),
        currency: 'usd',
        recurring: {
          interval: billingPeriod === 'yearly' ? 'year' : 'month',
          interval_count: billingPeriod === 'quarterly' ? 3 : 1,
        },
        metadata: {
          tierName: name,
          priceType: 'base_fee',
        },
      });
      stripePriceId = basePrice.id;
    }

    // 2. Create metered price (if metering enabled)
    if (meteringEnabled && unitPrice) {
      const meteredPrice = await stripe.prices.create({
        product: product.stripeProductId!,
        unit_amount: parseInt(unitPrice), // Price per unit
        currency: 'usd',
        recurring: {
          interval: billingPeriod === 'yearly' ? 'year' : 'month',
          interval_count: billingPeriod === 'quarterly' ? 3 : 1,
          usage_type: 'metered',  // KEY: This makes it metered
          aggregate_usage: 'sum', // or 'max', 'last_during_period'
        },
        billing_scheme: 'per_unit', // or 'tiered' for volume pricing
        metadata: {
          tierName: name,
          priceType: 'metered_usage',
          usageLimit: usageLimit?.toString() || '',
        },
      });
      stripePriceIdMetered = meteredPrice.id;
    }

    // 3. Create tier in database
    const tier = await prisma.tier.create({
      data: {
        productId,
        name,
        priceAmount: parseInt(priceAmount),
        billingPeriod,
        usageLimit: usageLimit ? parseInt(usageLimit) : null,
        stripePriceId,
        meteringEnabled: meteringEnabled || false,
        stripePriceIdMetered,
        unitPrice: unitPrice ? parseInt(unitPrice) : null,
        // ... other fields
      },
    });

    return NextResponse.json({ tier }, { status: 201 });
  } catch (error: any) {
    console.error("Stripe price creation error:", error);
    return NextResponse.json(
      { error: `Failed to create Stripe prices: ${error.message}` },
      { status: 500 }
    );
  }
}
```

---

## Step 3: Create Subscriptions with Multiple Items

### Update: `src/app/api/saas/checkout/route.ts`

```typescript
// POST create checkout session with metered billing
export async function POST(request: NextRequest) {
  const { tierId, customerId } = await request.json();

  const tier = await prisma.tier.findUnique({
    where: { id: tierId },
    include: {
      product: {
        include: {
          saasCreator: {
            include: { stripeAccount: true }
          }
        }
      }
    }
  });

  const stripe = new Stripe(tier.product.saasCreator.stripeAccount.accessToken, {
    apiVersion: "2023-10-16",
  });

  // Build line items
  const lineItems: any[] = [];

  // 1. Base subscription fee (if exists)
  if (tier.stripePriceId) {
    lineItems.push({
      price: tier.stripePriceId,
      quantity: 1,
    });
  }

  // 2. Metered usage component (if enabled)
  if (tier.meteringEnabled && tier.stripePriceIdMetered) {
    lineItems.push({
      price: tier.stripePriceIdMetered,
      // No quantity for metered items - usage reported later
    });
  }

  // Create checkout session
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    customer: customerId,
    line_items: lineItems,
    success_url: `${process.env.NEXT_PUBLIC_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_URL}/cancel`,
    metadata: {
      tierId,
      saasCreatorId: tier.product.saasCreatorId,
    },
  });

  return NextResponse.json({ url: session.url });
}
```

---

## Step 4: Store Subscription Items

### Update: `src/app/api/webhooks/stripe/route.ts`

```typescript
// Handle subscription created webhook
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log("Processing subscription.created:", subscription.id);

  // Find subscription in database
  const dbSubscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: subscription.id },
    include: { tier: true },
  });

  if (!dbSubscription) {
    console.log("Subscription not found in database, will be created by checkout.session.completed");
    return;
  }

  // Store subscription items
  for (const item of subscription.items.data) {
    const price = item.price;
    const isMetered = price.recurring?.usage_type === 'metered';

    await prisma.stripeSubscriptionItem.upsert({
      where: { stripeSubscriptionItemId: item.id },
      create: {
        subscriptionId: dbSubscription.id,
        stripeSubscriptionItemId: item.id,
        stripePriceId: price.id,
        itemType: isMetered ? 'metered_usage' : 'base_fee',
        meteringType: isMetered ? (price.metadata?.meteringType || 'usage') : null,
      },
      update: {
        stripePriceId: price.id,
      },
    });
  }

  console.log(`Stored ${subscription.items.data.length} subscription items`);
}
```

---

## Step 5: Report Usage to Stripe

### Create: `src/utils/stripeUsageReporting.ts`

```typescript
import Stripe from "stripe";
import { prisma } from "@/utils/prismaDB";

/**
 * Report usage to Stripe for metered billing
 */
export async function reportUsageToStripe(
  subscriptionId: string,
  quantity: number,
  timestamp?: Date
): Promise<boolean> {
  try {
    // Get subscription with Stripe items
    const subscription = await prisma.subscription.findUnique({
      where: { id: subscriptionId },
      include: {
        tier: true,
        stripeItems: {
          where: {
            itemType: 'metered_usage',
          },
        },
        saasCreator: {
          include: { stripeAccount: true },
        },
      },
    });

    if (!subscription) {
      throw new Error("Subscription not found");
    }

    // Check if metering is enabled
    if (!subscription.tier.meteringEnabled) {
      console.log("Metering not enabled for this tier, skipping Stripe report");
      return false;
    }

    // Get metered subscription item
    const meteredItem = subscription.stripeItems[0];
    if (!meteredItem) {
      console.error("No metered subscription item found");
      return false;
    }

    // Get Stripe account
    const stripeAccount = subscription.saasCreator.stripeAccount;
    if (!stripeAccount?.accessToken) {
      console.error("No Stripe account connected");
      return false;
    }

    const stripe = new Stripe(stripeAccount.accessToken, {
      apiVersion: "2023-10-16",
    });

    // Report usage to Stripe
    const usageRecord = await stripe.subscriptionItems.createUsageRecord(
      meteredItem.stripeSubscriptionItemId,
      {
        quantity: Math.ceil(quantity), // Stripe requires integer
        timestamp: timestamp ? Math.floor(timestamp.getTime() / 1000) : 'now',
        action: 'increment', // or 'set' to replace
      }
    );

    // Update last reported usage
    await prisma.stripeSubscriptionItem.update({
      where: { id: meteredItem.id },
      data: {
        lastReportedUsage: quantity,
        lastReportedAt: new Date(),
      },
    });

    console.log("Usage reported to Stripe:", usageRecord.id);
    return true;
  } catch (error: any) {
    console.error("Stripe usage reporting error:", error);
    return false;
  }
}

/**
 * Get current usage from Stripe
 */
export async function getStripeUsageSummary(
  subscriptionId: string,
  startDate?: Date,
  endDate?: Date
) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: {
      stripeItems: {
        where: { itemType: 'metered_usage' },
      },
      saasCreator: {
        include: { stripeAccount: true },
      },
    },
  });

  if (!subscription?.stripeItems[0]?.stripeSubscriptionItemId) {
    return null;
  }

  const stripe = new Stripe(subscription.saasCreator.stripeAccount!.accessToken!, {
    apiVersion: "2023-10-16",
  });

  // Get usage summary from Stripe
  const summary = await stripe.subscriptionItems.listUsageRecordSummaries(
    subscription.stripeItems[0].stripeSubscriptionItemId,
    {
      limit: 100,
    }
  );

  return summary.data;
}
```

---

## Step 6: Update Usage Tracking API

### Modify: `src/app/api/saas/usage/route.ts`

```typescript
import { reportUsageToStripe } from "@/utils/stripeUsageReporting";

// POST track usage - with Stripe reporting
export async function POST(request: NextRequest) {
  try {
    // ... existing authentication and validation ...

    const { subscriptionId, userId, quantity, metadata } = await request.json();

    // ... existing subscription verification ...

    // Create local usage record
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
    // ========== END NEW CODE ==========

    return NextResponse.json({
      success: true,
      usageRecord: {
        id: usageRecord.id,
        quantity: usageRecord.quantity,
        timestamp: usageRecord.timestamp,
        stripeReported, // NEW: indicate if reported to Stripe
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
```

---

## Step 7: UI for Metered Pricing Configuration

### Update: `src/components/ProductManagement/TierModal.tsx`

```tsx
// Add to form state
const [formData, setFormData] = useState({
  // ... existing fields ...
  meteringEnabled: tier?.meteringEnabled || false,
  unitPrice: tier?.unitPrice || "",
});

// Add to form JSX
<div className="mt-4">
  <label className="flex items-center gap-2">
    <input
      type="checkbox"
      checked={formData.meteringEnabled}
      onChange={(e) => setFormData({ ...formData, meteringEnabled: e.target.checked })}
      className="rounded"
    />
    <span className="text-base font-medium text-dark dark:text-white">
      Enable Metered Billing
    </span>
  </label>
  <p className="mt-1 text-sm text-body-color dark:text-dark-6">
    Charge customers based on actual usage (e.g., per API call, per GB)
  </p>
</div>

{formData.meteringEnabled && (
  <>
    <div className="mt-4">
      <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
        Unit Price (cents)
      </label>
      <input
        type="number"
        min="0"
        step="0.01"
        placeholder="e.g., 5 = $0.05 per unit"
        value={formData.unitPrice}
        onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3"
        required
      />
      <p className="mt-1 text-sm text-body-color dark:text-dark-6">
        Cost per unit of usage (e.g., per API call, per GB of storage)
      </p>
    </div>

    <div className="rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 mt-4">
      <h4 className="font-medium text-blue-900 dark:text-blue-200">
        💡 Example Pricing
      </h4>
      <p className="text-sm text-blue-800 dark:text-blue-300 mt-2">
        Base Fee: ${(parseInt(formData.priceAmount || "0") / 100).toFixed(2)}/month<br />
        + ${(parseInt(formData.unitPrice || "0") / 100).toFixed(4)} per unit used
      </p>
      <p className="text-xs text-blue-700 dark:text-blue-400 mt-2">
        If a customer uses 10,000 units, they pay: $
        {((parseInt(formData.priceAmount || "0") + parseInt(formData.unitPrice || "0") * 10000) / 100).toFixed(2)}
      </p>
    </div>
  </>
)}
```

---

## Step 8: Customer Portal Enhancement

### Update: `src/app/whitelabel/[domain]/account/page.tsx`

```tsx
// Add Stripe usage sync
const [stripeUsage, setStripeUsage] = useState<any>(null);

useEffect(() => {
  async function fetchStripeUsage() {
    if (!subscription?.id) return;
    
    const response = await fetch(`/api/saas/stripe-usage?subscriptionId=${subscription.id}`);
    if (response.ok) {
      const data = await response.json();
      setStripeUsage(data);
    }
  }
  
  fetchStripeUsage();
}, [subscription]);

// Display Stripe usage
{subscription?.tier?.meteringEnabled && (
  <Card className="mt-6">
    <CardHeader>
      <CardTitle>Metered Usage</CardTitle>
      <CardDescription>
        Your usage this billing period will be charged at ${(subscription.tier.unitPrice / 100).toFixed(4)} per unit
      </CardDescription>
    </CardHeader>
    <CardContent>
      <div className="space-y-2">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total Units Used</span>
          <span className="font-semibold">{usage?.total.toLocaleString()}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Unit Price</span>
          <span className="font-semibold">${(subscription.tier.unitPrice / 100).toFixed(4)}</span>
        </div>
        <Separator />
        <div className="flex justify-between text-lg">
          <span className="font-semibold">Estimated Charge</span>
          <span className="font-semibold text-primary">
            ${((usage?.total * subscription.tier.unitPrice) / 100).toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-2">
          * This is an estimate. Final charges calculated at the end of your billing period.
        </p>
      </div>
    </CardContent>
  </Card>
)}
```

---

## Step 9: Invoice Generation Webhook

### Update: `src/app/api/webhooks/stripe/route.ts`

```typescript
// Handle invoice creation
async function handleInvoiceCreated(invoice: Stripe.Invoice) {
  console.log("Processing invoice.created:", invoice.id);

  // Find subscription
  const subscription = await prisma.subscription.findUnique({
    where: { stripeSubscriptionId: invoice.subscription as string },
    include: { user: true, tier: true },
  });

  if (!subscription?.user) {
    console.log("Subscription or user not found");
    return;
  }

  // Calculate metered charges
  let meteredCharge = 0;
  for (const line of invoice.lines.data) {
    if (line.price?.recurring?.usage_type === 'metered') {
      meteredCharge += line.amount;
    }
  }

  // Send notification if metered charges exist
  if (meteredCharge > 0) {
    await prisma.emailNotification.create({
      data: {
        userId: subscription.user.id,
        type: 'invoice_created',
        subject: `Invoice for metered usage: $${(meteredCharge / 100).toFixed(2)}`,
        body: `Your latest invoice includes $${(meteredCharge / 100).toFixed(2)} in usage-based charges.`,
        recipient: subscription.user.email!,
        status: 'pending',
        metadata: {
          invoiceId: invoice.id,
          meteredCharge,
          totalAmount: invoice.amount_due,
        },
      },
    });
  }
}

// Add to webhook event handler
case 'invoice.created':
  await handleInvoiceCreated(event.data.object as Stripe.Invoice);
  break;
case 'invoice.payment_succeeded':
  await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice);
  break;
```

---

## Step 10: Testing

### Test Metered Billing Flow

1. **Create Metered Tier**
```bash
curl -X POST http://localhost:3000/api/saas/tiers \
  -H "Cookie: next-auth.session-token=..." \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "prod_xxx",
    "name": "Pay As You Go",
    "priceAmount": 0,
    "billingPeriod": "monthly",
    "meteringEnabled": true,
    "unitPrice": 5,
    "usageLimit": 100000
  }'
```

2. **Subscribe Customer** (via Stripe Checkout)
```bash
# Creates subscription with both base and metered items
curl -X POST http://localhost:3000/api/saas/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "tierId": "tier_xxx",
    "customerId": "cus_xxx"
  }'
```

3. **Track Usage** (reports to both database and Stripe)
```bash
curl -X POST http://localhost:3000/api/saas/usage \
  -H "x-api-key: sk_test_xxx" \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "sub_xxx",
    "userId": "user_xxx",
    "quantity": 1000
  }'

# Response includes:
# {
#   "success": true,
#   "usageRecord": { ... },
#   "stripeReported": true  <-- confirms reported to Stripe
# }
```

4. **Verify in Stripe Dashboard**
- Go to Stripe Dashboard → Subscriptions
- Find the subscription
- Click on the metered subscription item
- See usage records logged
- At period end, Stripe will automatically invoice

5. **End of Billing Period**
- Stripe automatically:
  - Calculates total usage
  - Generates invoice
  - Charges customer
  - Sends invoice email
  - Resets usage counter

---

## Pricing Models

### 1. Pure Metered (Pay-As-You-Go)
```
Base Fee: $0
Per Unit: $0.01
Usage: 50,000 units
Total: $500.00
```

### 2. Hybrid (Base + Metered)
```
Base Fee: $99/month
Included: 10,000 units
Per Unit (overage): $0.02
Usage: 15,000 units
Total: $99 + (5,000 × $0.02) = $199.00
```

### 3. Tiered Metered
```javascript
// In Stripe price creation
recurring: {
  usage_type: 'metered',
  aggregate_usage: 'sum',
},
billing_scheme: 'tiered',
tiers: [
  { up_to: 10000, unit_amount: 10 },   // $0.10 per unit for first 10k
  { up_to: 50000, unit_amount: 5 },    // $0.05 per unit for 10k-50k
  { up_to: 'inf', unit_amount: 2 },    // $0.02 per unit for 50k+
],
tiers_mode: 'graduated'
```

---

## Best Practices

### 1. Usage Reporting Frequency
- ✅ **Real-time**: Report usage immediately as it happens
- ✅ **Batched**: Aggregate and report hourly/daily for high-volume
- ❌ **Avoid**: Reporting only at period end (Stripe may reject late reports)

### 2. Idempotency
```typescript
// Use idempotency key for usage reporting
await stripe.subscriptionItems.createUsageRecord(
  itemId,
  {
    quantity: 100,
    timestamp: 'now',
  },
  {
    idempotencyKey: `usage-${subscriptionId}-${usageRecordId}`,
  }
);
```

### 3. Error Handling
```typescript
try {
  await reportUsageToStripe(subscriptionId, quantity);
} catch (error) {
  if (error.code === 'resource_missing') {
    // Subscription item doesn't exist - log and alert
    console.error("Stripe subscription item not found");
    await notifyAdmin(error);
  } else if (error.code === 'timestamp_too_old') {
    // Trying to report usage older than billing period
    console.warn("Usage timestamp too old, skipping Stripe report");
  }
  // Always keep local tracking even if Stripe fails
}
```

### 4. Monitoring
```typescript
// Track Stripe reporting success rate
const metrics = await prisma.usageRecord.groupBy({
  by: ['metadata'],
  where: {
    timestamp: { gte: startOfMonth() },
  },
  _count: true,
});

const stripeReported = metrics.filter(m => m.metadata?.stripeReported).length;
const successRate = (stripeReported / metrics.length) * 100;
console.log(`Stripe reporting success rate: ${successRate}%`);
```

---

## Cost Comparison

### Manual Invoicing (Current)
- Development: 0 hours (existing)
- Stripe fees: 2.9% + $0.30 per invoice
- Admin time: ~2 hours/month creating invoices
- Risk: High (manual errors, late invoices)

### Automated Metered Billing
- Development: 15-20 hours (one-time)
- Stripe fees: Same (2.9% + $0.30)
- Admin time: ~0 hours/month (fully automated)
- Risk: Low (automated, accurate)

**ROI**: Break-even after first month for businesses with 10+ customers

---

## Migration Guide

### Migrating Existing Subscriptions

1. **Create metered prices** for existing tiers
2. **Add subscription items** to active subscriptions
3. **Start reporting usage** to Stripe
4. **Monitor for one billing cycle** alongside manual invoicing
5. **Switch to automated billing** once validated

```typescript
// Migration script
async function migrateSubscriptionToMetered(subscriptionId: string) {
  const subscription = await prisma.subscription.findUnique({
    where: { id: subscriptionId },
    include: { tier: true, saasCreator: { include: { stripeAccount: true } } },
  });

  const stripe = new Stripe(subscription.saasCreator.stripeAccount.accessToken, {
    apiVersion: "2023-10-16",
  });

  // Add metered item to existing Stripe subscription
  const item = await stripe.subscriptionItems.create({
    subscription: subscription.stripeSubscriptionId!,
    price: subscription.tier.stripePriceIdMetered!,
  });

  // Store in database
  await prisma.stripeSubscriptionItem.create({
    data: {
      subscriptionId: subscription.id,
      stripeSubscriptionItemId: item.id,
      stripePriceId: subscription.tier.stripePriceIdMetered!,
      itemType: 'metered_usage',
    },
  });

  console.log(`Migrated subscription ${subscriptionId} to metered billing`);
}
```

---

## Troubleshooting

### Issue: "Usage timestamp is too old"
**Cause**: Trying to report usage from a previous billing period  
**Solution**: Only report usage from current period

### Issue: "Subscription item not found"
**Cause**: Metered subscription item not created  
**Solution**: Verify subscription items exist in StripeSubscriptionItem table

### Issue: "Usage not appearing in Stripe"
**Cause**: Wrong subscription item ID or authentication  
**Solution**: Check stripeSubscriptionItemId and accessToken

### Issue: "Customer charged twice"
**Cause**: Both manual invoice and Stripe auto-invoice  
**Solution**: Disable manual invoicing once Stripe metering is active

---

## Summary

### What You Get

✅ **Automatic billing** based on actual usage  
✅ **Accurate invoices** generated by Stripe  
✅ **Hybrid pricing** (base fee + usage)  
✅ **Volume discounts** with tiered pricing  
✅ **No manual invoicing** required  
✅ **Professional invoices** from Stripe  
✅ **Built-in dunning** for failed payments  

### Implementation Checklist

- [ ] Update database schema with StripeSubscriptionItem
- [ ] Create metered prices in Stripe
- [ ] Store subscription items on creation
- [ ] Implement reportUsageToStripe utility
- [ ] Update /api/saas/usage to report to Stripe
- [ ] Add metering toggle in tier creation UI
- [ ] Update customer portal to show metered charges
- [ ] Test with Stripe test mode
- [ ] Monitor for one billing cycle
- [ ] Switch to production

### Estimated Timeline

- Database updates: 2 hours
- Stripe price creation: 3 hours
- Usage reporting: 4 hours
- Webhook handling: 2 hours
- UI updates: 3 hours
- Testing: 4 hours
- **Total: 18-20 hours**

---

**Document Version**: 1.0  
**Last Updated**: 2025-10-10  
**Stripe API Version**: 2023-10-16  
**Companion to**: METERING_USAGE_EVALUATION.md
