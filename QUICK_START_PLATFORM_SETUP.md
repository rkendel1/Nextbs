# Quick Start: Platform Owner Setup for Creator Onboarding

## TL;DR

```bash
# Set up your environment
cp .env.example .env
# Edit .env and set DATABASE_URL and STRIPE_SECRET_KEY

# Install dependencies
npm install --legacy-peer-deps

# Generate Prisma client
npx prisma generate

# Run database migrations
npx prisma migrate deploy

# Set up platform owner with products
npm run setup:platform

# Verify the setup
npm run verify:setup
```

## What This Does

Creates a platform owner account with **3 active products** ready for creator onboarding:

1. **Starter Plan** - $29/month
2. **Professional Plan** - $59/month  
3. **Enterprise Plan** - $99/month

Each product includes a pricing tier with Stripe integration, making them immediately available on:
- Landing page (`/pricing`)
- Creator onboarding flow
- Product selection during signup

## Why This is Needed

**Problem**: Creators cannot onboard if there are no active platform products to choose from.

**Solution**: This script creates a fully configured platform owner with multiple products and pricing tiers, all integrated with Stripe.

## Requirements

- ✅ PostgreSQL database
- ✅ Stripe account (for production readiness)
- ✅ Node.js 18+

## Verification

After running the setup, you should see:

```
✅ Platform Owner: platform@nextbs.com
✅ SaaS Creator: Platform Business
✅ Products created: 3
Tiers with Stripe prices: 3
```

Run the verification script to confirm everything is working:

```bash
npm run verify:setup
```

Visit `/pricing` to see the products displayed.

## Troubleshooting

**No products showing on pricing page?**
- Ensure `STRIPE_SECRET_KEY` is set
- Run `npm run verify:setup` to check configuration
- Look for tiers with `stripePriceId` in the output

**Already ran the script?**
- Safe to re-run - script is idempotent
- Will update missing Stripe IDs if Stripe is now configured

**Want to verify the setup?**
- Run `npm run verify:setup` for comprehensive validation
- Run `npm run verify:tiers` for tier-specific details

## Documentation

For detailed information, see [PLATFORM_OWNER_SETUP.md](./PLATFORM_OWNER_SETUP.md)
