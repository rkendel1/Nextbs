# Platform Enhancements - API Documentation

This document describes the new features added to the SaaS for SaaS platform.

## Overview

The platform now includes:
1. **Platform Owner Role** - Manage all SaaS creators
2. **API Key Management** - Secure authentication for API access
3. **Stripe Webhook Handlers** - Automated subscription lifecycle
4. **White-label Configuration** - Customize subscriber portals
5. **Advanced Analytics** - Track revenue and subscriber metrics
6. **Email Notifications** - Automated notifications for key events
7. **Subscription Management** - Upgrade/downgrade flows

## 1. Platform Owner Role

The first user to sign up becomes the Platform Owner with full administrative access.

### User Roles
- `creator` - Default role for SaaS creators
- `platform_owner` - Administrative role with access to all creators

### Platform Owner Endpoints

#### List All Creators
```
GET /api/platform/creators?page=1&limit=10
```

**Response:**
```json
{
  "creators": [
    {
      "id": "...",
      "businessName": "...",
      "stats": {
        "totalProducts": 5,
        "activeProducts": 3,
        "activeSubscriptions": 150,
        "monthlyRevenue": 45000
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3
  }
}
```

## 2. API Key Management

SaaS creators can generate and manage API keys for programmatic access.

### Endpoints

#### List API Keys
```
GET /api/saas/api-keys
Authorization: Session cookie
```

#### Create API Key
```
POST /api/saas/api-keys
Authorization: Session cookie

{
  "name": "Production Key",
  "permissions": ["usage:read", "usage:write"],
  "expiresAt": "2025-12-31T23:59:59Z" // Optional
}
```

**Response (key only shown once):**
```json
{
  "apiKey": {
    "id": "...",
    "name": "Production Key",
    "keyPrefix": "sk_12345678",
    "permissions": ["usage:read", "usage:write"],
    "createdAt": "..."
  },
  "key": "sk_1234567890abcdef..." // Full key - save this!
}
```

#### Revoke API Key
```
DELETE /api/saas/api-keys/{id}
Authorization: Session cookie
```

#### Update API Key
```
PATCH /api/saas/api-keys/{id}
Authorization: Session cookie

{
  "isActive": false,
  "name": "Updated Name"
}
```

### Using API Keys

Include the API key in request headers:
```
x-api-key: sk_1234567890abcdef...
```

### Permissions
- `usage:read` - Read usage data
- `usage:write` - Create usage records
- `*` - All permissions

## 3. Stripe Webhook Handlers

Automated handling of Stripe subscription events.

### Webhook Endpoint
```
POST /api/webhooks/stripe
```

### Supported Events
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription modified
- `customer.subscription.deleted` - Subscription cancelled
- `payment_intent.succeeded` - Payment successful
- `payment_intent.payment_failed` - Payment failed

### Configuration
Set your webhook secret in `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Event Logging
All webhook events are logged in the `WebhookEvent` table for debugging.

## 4. White-label Configuration

Customize the subscriber portal with your branding.

### Endpoints

#### Get Configuration
```
GET /api/saas/white-label
Authorization: Session cookie
```

#### Update Configuration
```
POST /api/saas/white-label
Authorization: Session cookie

{
  "brandName": "My SaaS",
  "primaryColor": "#3B82F6",
  "secondaryColor": "#10B981",
  "logoUrl": "https://example.com/logo.png",
  "faviconUrl": "https://example.com/favicon.ico",
  "customDomain": "portal.example.com",
  "subdomain": "mycompany",
  "customCss": ".custom { color: red; }",
  "isActive": true
}
```

## 5. Advanced Analytics

Track revenue, subscribers, and usage metrics.

### Endpoint

#### Get Analytics
```
GET /api/saas/analytics?period=monthly&creatorId={id}
Authorization: Session cookie
```

**Query Parameters:**
- `period` - `daily`, `weekly`, or `monthly` (default: monthly)
- `creatorId` - Only for Platform Owners to view specific creator

**Response:**
```json
{
  "analytics": {
    "revenue": {
      "total": 45000,
      "growth": 15.5,
      "monthlyBreakdown": [
        { "month": "Jul 2024", "amount": 35000, "subscribers": 100 },
        { "month": "Aug 2024", "amount": 40000, "subscribers": 120 },
        { "month": "Sep 2024", "amount": 45000, "subscribers": 150 }
      ]
    },
    "subscribers": {
      "total": 150,
      "active": 145,
      "churned": 5,
      "growth": 20.5,
      "new": 30
    },
    "usage": {
      "total": 500000,
      "trend": []
    }
  }
}
```

## 6. Email Notifications

Automated email notifications for key events.

### Notification Types
- `subscription_created` - New subscription activated
- `subscription_updated` - Subscription modified
- `subscription_cancelled` - Subscription cancelled
- `payment_succeeded` - Payment received
- `payment_failed` - Payment failed
- `trial_ending` - Trial period ending soon
- `usage_limit_warning` - Approaching usage limit

### Storage
Notifications are stored in the `EmailNotification` table with status tracking.

### Implementation
The system queues notifications with `status: 'pending'`. You'll need to implement an email sending service (e.g., using SendGrid, AWS SES, or Nodemailer) to process these.

## 7. Subscription Upgrade/Downgrade

Allow subscribers to change their subscription tier.

### Endpoint

#### Change Subscription Tier
```
POST /api/saas/subscriptions/{subscriptionId}/change-tier
Authorization: Session cookie

{
  "newTierId": "tier_xyz"
}
```

**Features:**
- Automatic proration in Stripe
- Email notification sent
- Validates tier belongs to same product
- Updates both Stripe and database

## Database Migration

Run the migration to add new tables and fields:

```bash
npx prisma migrate deploy
```

Or apply the migration manually from:
```
prisma/migrations/20240101000000_add_platform_enhancements/migration.sql
```

## Environment Variables

Add these to your `.env` file:

```
# Stripe Webhook Secret
STRIPE_WEBHOOK_SECRET=whsec_...

# Existing variables
DATABASE_URL=...
STRIPE_SECRET_KEY=...
```

## Security Considerations

1. **API Keys**: Stored as SHA-256 hashes in the database
2. **Webhook Verification**: Uses Stripe signature verification
3. **Role-based Access**: Platform Owner endpoints check user role
4. **API Key Permissions**: Fine-grained permission system
5. **Ownership Verification**: All endpoints verify resource ownership

## Next Steps

To complete the implementation:

1. Build UI components for:
   - API key management dashboard
   - White-label configuration page
   - Analytics charts and visualizations
   - Subscription upgrade/downgrade UI

2. Implement email sending service to process `EmailNotification` records

3. Create subscriber portal using white-label configuration

4. Add more advanced analytics features (churn prediction, revenue forecasting)

## Support

For questions or issues, please contact support or refer to the main documentation.
