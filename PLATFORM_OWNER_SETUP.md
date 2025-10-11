# Platform Owner Setup Guide

This guide explains how to set up a full platform owner with products and tiers configured for creator onboarding.

## Overview

The platform owner setup is essential for enabling creator onboarding. Creators need to see and select from active products with pricing tiers when they:
1. Visit the landing/pricing page
2. Go through the onboarding process
3. Subscribe to platform services

## Prerequisites

Before running the setup script, ensure you have:

1. **Database**: A PostgreSQL database configured
2. **Environment Variables**: Required variables set in `.env` file:
   ```env
   DATABASE_URL=postgresql://user:password@localhost:5432/dbname
   STRIPE_SECRET_KEY=sk_test_... (optional but recommended)
   ```

## Setup Script

### Quick Start

Run the full platform owner setup script:

```bash
npx tsx scripts/setup-full-platform-owner.ts
```

### What It Does

The `setup-full-platform-owner.ts` script performs the following operations:

1. **Creates Platform Owner User**
   - Email: `platform@nextbs.com`
   - Role: `platform_owner`
   - Subscription Status: `FREE`

2. **Creates SaasCreator Profile**
   - Business Name: "Platform Business"
   - Onboarding: Completed (step 4)
   - Crawl Status: Completed

3. **Creates Three Active Products**:

   #### Starter Plan ($29/month)
   - Target: Small businesses and individuals
   - Features:
     - Up to 5 users
     - Basic support
     - 1GB storage
     - Core features access
     - Email support
   - Usage Limit: 100

   #### Professional Plan ($59/month)
   - Target: Growing businesses and teams
   - Features:
     - Up to 20 users
     - Priority support
     - 10GB storage
     - Advanced analytics
     - API access
     - Custom integrations
   - Usage Limit: 500

   #### Enterprise Plan ($99/month)
   - Target: Large organizations
   - Features:
     - Unlimited users
     - 24/7 dedicated support
     - 100GB storage
     - Advanced analytics & reporting
     - Custom integrations
     - SSO & advanced security
     - Dedicated account manager
     - SLA guarantee
   - Usage Limit: 10,000

4. **Stripe Integration** (if configured)
   - Creates Stripe products for each plan
   - Creates Stripe prices for each tier
   - Links Stripe IDs to database records

## Stripe Configuration

### With Stripe Configured

When `STRIPE_SECRET_KEY` is set, the script will:
- Create Stripe products and prices
- Store `stripePriceId` in database
- Enable tiers to appear on the pricing page
- Allow creators to subscribe via Stripe

### Without Stripe

If Stripe is not configured:
- Products and tiers are still created in the database
- **WARNING**: Tiers without `stripePriceId` won't appear on the pricing page
- The API endpoint `/api/saas/tiers` filters out tiers without Stripe price IDs
- You'll need to run the script again after configuring Stripe

## Verifying Setup

After running the setup script, verify the configuration:

```bash
# Comprehensive setup verification
npm run verify:setup

# Check tiers in database (detailed)
npm run verify:tiers

# Check platform owner (basic)
npx tsx scripts/check-platform-owner.ts
```

### Verification Script Output

The `verify:setup` script checks:

1. ✅ Platform owner user exists
2. ✅ SaasCreator profile is complete
3. ✅ Active products exist
4. ✅ Products have Stripe integration
5. ✅ Tiers have Stripe price IDs
6. ✅ API endpoint will return valid data

**Example output:**
```
🔍 Verifying Platform Owner Setup...

1️⃣  Checking Platform Owner User...
   ✅ PASSED: Platform owner found (platform@nextbs.com)

2️⃣  Checking SaasCreator Profile...
   ✅ PASSED: SaasCreator found (Platform Business)
   ✅ Onboarding completed (step 4)

3️⃣  Checking Active Products...
   ✅ PASSED: 3 active product(s) found

4️⃣  Checking Stripe Integration...
   📦 Starter Plan
      Stripe Product: prod_...
      ✅ Basic: $29.00/monthly
         Stripe Price: price_...

5️⃣  Checking API Endpoint Compatibility...
   Tiers with Stripe prices: 3
   Tiers without Stripe prices: 0
   ✅ PASSED: All tiers have Stripe price IDs

6️⃣  Simulating API Response...
   API would return 3 tier(s):
   - Starter Plan - Basic: $29.00
   - Professional Plan - Professional: $59.00
   - Enterprise Plan - Enterprise: $99.00

==================================================
📋 VERIFICATION SUMMARY
==================================================
✅ All checks passed!
✅ Platform is ready for creator onboarding

Next steps:
1. Visit /pricing to see the products
2. Test creator signup and product selection
3. Verify Stripe checkout flow
==================================================
```

### Expected Output

The setup script provides a detailed summary:

```
📊 Setup Summary:
================

✅ Platform Owner: platform@nextbs.com
✅ SaaS Creator: Platform Business
✅ Products created: 3

  📦 Starter Plan
     Stripe Product: prod_...
     ✅ Basic: $29/monthly
        Stripe Price: price_...

  📦 Professional Plan
     Stripe Product: prod_...
     ✅ Professional: $59/monthly
        Stripe Price: price_...

  📦 Enterprise Plan
     Stripe Product: prod_...
     ✅ Enterprise: $99/monthly
        Stripe Price: price_...

================
Tiers with Stripe prices: 3
Tiers without Stripe prices: 0

✅ Full platform owner setup complete!

Creators can now onboard and view available products on the pricing page.
```

## How It Enables Creator Onboarding

### 1. Pricing Page Visibility

The pricing page at `/pricing` fetches tiers from `/api/saas/tiers`:

```typescript
// API returns only active tiers with Stripe price IDs
const platformOwner = await prisma.user.findFirst({
  where: { role: 'platform_owner' },
  include: {
    saasCreator: {
      include: {
        products: {
          where: { isActive: true },
          include: {
            tiers: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' }
            }
          }
        }
      }
    }
  }
});
```

### 2. Creator Subscription Flow

1. Creator visits the landing page
2. Views available pricing tiers
3. Selects a plan
4. Completes Stripe checkout
5. Gains access to platform features

### 3. Onboarding Process

During creator onboarding (`/saas/onboarding`):
- Creators can select from available products
- Products are displayed with their tiers and pricing
- Subscription is created upon selection
- Creator profile is marked as onboarded

## Troubleshooting

### Tiers Not Showing on Pricing Page

**Issue**: Pricing page is empty or shows "No plans available"

**Solutions**:
1. Check if Stripe is configured:
   ```bash
   echo $STRIPE_SECRET_KEY
   ```
2. Run the setup script with Stripe configured
3. Verify tiers have `stripePriceId`:
   ```bash
   npx tsx scripts/verify-tiers.ts
   ```

### Products Already Exist

**Behavior**: Script detects existing products and:
- Skips product creation
- Updates missing Stripe products/prices
- Links existing records to Stripe

**Safe to Re-run**: The script is idempotent and can be run multiple times.

### Database Connection Issues

**Error**: `DATABASE_URL` not found

**Solution**: 
1. Create a `.env` file from `.env.example`
2. Set your database connection string
3. Run `npx prisma generate` to update client

## Related Scripts

- `scripts/setup-platform-owner.ts` - Basic setup (no Stripe)
- `scripts/setup-platform-complete.ts` - Setup with test data
- `scripts/verify-tiers.ts` - Verify tier configuration
- `scripts/check-platform-owner.ts` - Check platform owner status

## Manual Alternative

If you prefer to create products manually:

1. Create platform owner user with role `platform_owner`
2. Create SaasCreator profile linked to the user
3. Use the product wizard in the dashboard
4. Create tiers with Stripe integration
5. Ensure `isActive` is true for products and tiers

## API Reference

### GET /api/saas/tiers

Returns active tiers from platform owner's products.

**Response**:
```json
{
  "tiers": [
    {
      "id": "tier_123",
      "nickname": "Basic",
      "unit_amount": 2900,
      "offers": ["Up to 5 users", "Basic support", ...],
      "product": {
        "name": "Starter Plan",
        "description": "Perfect for small businesses..."
      },
      "isActive": true,
      "stripePriceId": "price_123..."
    }
  ]
}
```

**Filtering**: Only returns tiers with:
- `isActive: true`
- `stripePriceId` is not null
- Product `isActive: true`

## Best Practices

1. **Run After Database Setup**: Execute this script after database migrations
2. **Configure Stripe First**: Set up Stripe before running to get full functionality
3. **Verify Results**: Always check the summary output
4. **Document Changes**: If you modify product/tier configs, update this guide
5. **Test Pricing Page**: Visit `/pricing` to verify tiers appear correctly

## Customization

To customize the products and tiers, edit the `PRODUCTS_CONFIG` array in `setup-full-platform-owner.ts`:

```typescript
const PRODUCTS_CONFIG: ProductConfig[] = [
  {
    name: 'Your Product Name',
    description: 'Your product description',
    tiers: [
      {
        name: 'Tier Name',
        description: 'Tier description',
        priceAmount: 4900, // $49 in cents
        billingPeriod: 'monthly',
        features: ['Feature 1', 'Feature 2'],
        usageLimit: 1000,
        sortOrder: 1
      }
    ]
  }
];
```

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review the script output for warnings
3. Verify environment variables are set correctly
4. Check Stripe dashboard for created products/prices
