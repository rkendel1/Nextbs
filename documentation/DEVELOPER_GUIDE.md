# Platform Enhancements - Developer Guide

## Quick Start

This guide helps you understand and work with the newly implemented platform features.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Database Schema](#database-schema)
3. [API Endpoints](#api-endpoints)
4. [Authentication & Authorization](#authentication--authorization)
5. [Testing the Features](#testing-the-features)
6. [Building UI Components](#building-ui-components)
7. [Common Patterns](#common-patterns)

---

## Architecture Overview

### Multi-Tenant Hierarchy

```
Platform Owner (First User)
  ├── Manages all SaaS Creators
  │
  └── SaaS Creator 1
      ├── Products
      │   └── Tiers
      │       └── Subscriptions
      │           └── Subscribers (End Users)
      │
      ├── API Keys
      ├── White-label Config
      └── Analytics

  └── SaaS Creator 2
      └── ... (same structure)
```

### Request Flow

```
User Request
  ├── Session Auth → Platform Owner/Creator endpoints
  │
  └── API Key Auth → Usage tracking endpoints
      ├── Verify key hash
      ├── Check permissions
      ├── Verify ownership
      └── Process request
```

---

## Database Schema

### New Tables

#### ApiKey
```sql
- id: string (cuid)
- userId: string (FK to User)
- name: string (e.g., "Production Key")
- key: string (SHA-256 hash, unique)
- keyPrefix: string (first 11 chars for display)
- permissions: string[] (e.g., ["usage:read", "usage:write"])
- lastUsedAt: DateTime?
- expiresAt: DateTime?
- isActive: boolean
```

#### EmailNotification
```sql
- id: string
- userId: string (FK to User)
- type: string (subscription_created, payment_failed, etc.)
- subject: string
- body: text
- recipient: string (email address)
- status: string (pending, sent, failed)
- sentAt: DateTime?
- error: text?
- metadata: JSON (contextual data)
```

#### WebhookEvent
```sql
- id: string
- eventId: string (Stripe event ID, unique)
- eventType: string (customer.subscription.created, etc.)
- status: string (pending, processed, failed)
- payload: JSON (full Stripe event)
- processedAt: DateTime?
- error: text?
- retryCount: int
```

#### AnalyticsSnapshot
```sql
- id: string
- saasCreatorId: string? (FK to SaasCreator)
- period: string (daily, weekly, monthly)
- periodStart: DateTime
- periodEnd: DateTime
- totalRevenue: int
- newSubscribers: int
- churnedSubscribers: int
- activeSubscribers: int
- totalUsage: float
- metadata: JSON
```

### Updated Tables

#### User
```sql
+ role: string (default: 'creator')
  - Values: 'creator' | 'platform_owner'
```

#### WhiteLabelConfig
```sql
- userId → saasCreatorId (FK to SaasCreator)
+ secondaryColor: string?
+ faviconUrl: string?
```

---

## API Endpoints

### Platform Owner Endpoints

```typescript
// List all SaaS creators with stats
GET /api/platform/creators
Query: ?page=1&limit=10

Response: {
  creators: Array<{
    id: string;
    businessName: string;
    stats: {
      totalProducts: number;
      activeProducts: number;
      activeSubscriptions: number;
      monthlyRevenue: number; // in cents
    };
    hasStripeAccount: boolean;
  }>;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
```

### API Key Management

```typescript
// List API keys
GET /api/saas/api-keys
Headers: Cookie (session)

Response: {
  apiKeys: Array<{
    id: string;
    name: string;
    keyPrefix: string; // "sk_12345678"
    permissions: string[];
    lastUsedAt: Date?;
    expiresAt: Date?;
    isActive: boolean;
    createdAt: Date;
  }>;
}

// Create API key
POST /api/saas/api-keys
Headers: Cookie (session)
Body: {
  name: string;
  permissions?: string[]; // default: ["usage:read", "usage:write"]
  expiresAt?: string; // ISO date
}

Response: {
  apiKey: { /* same as above */ };
  key: string; // ONLY SHOWN ONCE - save it!
}

// Update API key
PATCH /api/saas/api-keys/[id]
Headers: Cookie (session)
Body: {
  isActive?: boolean;
  name?: string;
}

// Delete API key
DELETE /api/saas/api-keys/[id]
Headers: Cookie (session)
```

### White-label Configuration

```typescript
// Get config
GET /api/saas/white-label
Headers: Cookie (session)

// Create/update config
POST /api/saas/white-label
Headers: Cookie (session)
Body: {
  brandName?: string;
  primaryColor?: string; // hex color
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  subdomain?: string;
  customCss?: string;
  isActive?: boolean;
}
```

### Analytics

```typescript
GET /api/saas/analytics
Query: ?period=monthly&creatorId={id}
Headers: Cookie (session)

Response: {
  analytics: {
    revenue: {
      total: number; // in cents
      growth: number; // percentage
      monthlyBreakdown: Array<{
        month: string;
        amount: number;
        subscribers: number;
      }>;
    };
    subscribers: {
      total: number;
      active: number;
      churned: number;
      growth: number; // percentage
      new: number;
    };
    usage: {
      total: number;
      trend: Array<any>; // future
    };
  };
}
```

### Subscription Management

```typescript
POST /api/saas/subscriptions/[id]/change-tier
Headers: Cookie (session)
Body: {
  newTierId: string;
}

Response: {
  subscription: {
    // full subscription object with new tier
  };
}
```

### Webhooks (Stripe)

```typescript
POST /api/webhooks/stripe
Headers: stripe-signature (Stripe sends this)
Body: (Stripe event JSON)

// Handles:
// - customer.subscription.created
// - customer.subscription.updated
// - customer.subscription.deleted
// - payment_intent.succeeded
// - payment_intent.payment_failed
```

---

## Authentication & Authorization

### Session-based Auth (Existing)

```typescript
// In API route
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";

const session = await getServerSession(authOptions);
if (!session?.user?.email) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

// Check if Platform Owner
const user = await prisma.user.findUnique({
  where: { email: session.user.email },
});

if (user.role !== 'platform_owner') {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

### API Key Auth (New)

```typescript
import { verifyApiKey, hasPermission } from "@/utils/middleware/apiKeyAuth";

// Verify API key
const verification = await verifyApiKey(request);
if (!verification.valid) {
  return NextResponse.json(
    { error: verification.error },
    { status: 401 }
  );
}

// Check permission
if (!hasPermission(verification.permissions || [], 'usage:write')) {
  return NextResponse.json(
    { error: "Insufficient permissions" },
    { status: 403 }
  );
}

// Use userId
const userId = verification.userId;
```

### Available Permissions

```typescript
'usage:read'   // Can read usage data
'usage:write'  // Can create usage records
'*'            // All permissions
```

---

## Testing the Features

### 1. Set Up Database

```bash
# Apply migration
npx prisma migrate deploy

# Generate Prisma client
npx prisma generate
```

### 2. Create First User (Platform Owner)

```bash
# Register via UI or API
POST /api/register
{
  "name": "Admin User",
  "email": "admin@example.com",
  "password": "secure-password"
}
```

This user will automatically have `role: 'platform_owner'`.

### 3. Test API Key Generation

```bash
# Login first, then:
curl http://localhost:3000/api/saas/api-keys \
  -H "Cookie: next-auth.session-token=..." \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Key"}'

# Save the returned "key" value!
```

### 4. Test Usage Tracking with API Key

```bash
curl http://localhost:3000/api/saas/usage \
  -H "x-api-key: sk_..." \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "subscriptionId": "...",
    "userId": "...",
    "quantity": 100
  }'
```

### 5. Test Stripe Webhook (Locally)

```bash
# Install Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Trigger test event
stripe trigger customer.subscription.created
```

### 6. Test Analytics

```bash
curl http://localhost:3000/api/saas/analytics?period=monthly \
  -H "Cookie: next-auth.session-token=..."
```

---

## Building UI Components

### Example: API Key Management Page

```tsx
// app/(site)/dashboard/api-keys/page.tsx
'use client';

import { useState, useEffect } from 'react';

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState([]);
  const [newKey, setNewKey] = useState<string | null>(null);

  useEffect(() => {
    loadApiKeys();
  }, []);

  async function loadApiKeys() {
    const res = await fetch('/api/saas/api-keys');
    const data = await res.json();
    setApiKeys(data.apiKeys);
  }

  async function createKey(name: string) {
    const res = await fetch('/api/saas/api-keys', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const data = await res.json();
    setNewKey(data.key); // Show once!
    loadApiKeys();
  }

  async function deleteKey(id: string) {
    await fetch(`/api/saas/api-keys/${id}`, { method: 'DELETE' });
    loadApiKeys();
  }

  return (
    <div>
      <h1>API Keys</h1>
      
      {newKey && (
        <div className="alert">
          <strong>Your new API key (copy now!):</strong>
          <code>{newKey}</code>
          <button onClick={() => setNewKey(null)}>Done</button>
        </div>
      )}

      <button onClick={() => {
        const name = prompt('Key name:');
        if (name) createKey(name);
      }}>
        Create API Key
      </button>

      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Key</th>
            <th>Last Used</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {apiKeys.map((key: any) => (
            <tr key={key.id}>
              <td>{key.name}</td>
              <td><code>{key.keyPrefix}...</code></td>
              <td>{key.lastUsedAt || 'Never'}</td>
              <td>
                <button onClick={() => deleteKey(key.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

### Example: Analytics Dashboard

```tsx
// app/(site)/dashboard/analytics/page.tsx
'use client';

import { useEffect, useState } from 'react';

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    fetch('/api/saas/analytics?period=monthly')
      .then(res => res.json())
      .then(data => setAnalytics(data.analytics));
  }, []);

  if (!analytics) return <div>Loading...</div>;

  return (
    <div>
      <h1>Analytics</h1>
      
      <div className="stats-grid">
        <div className="stat-card">
          <h3>Monthly Revenue</h3>
          <p>${(analytics.revenue.total / 100).toFixed(2)}</p>
          <small>Growth: {analytics.revenue.growth.toFixed(1)}%</small>
        </div>

        <div className="stat-card">
          <h3>Active Subscribers</h3>
          <p>{analytics.subscribers.active}</p>
          <small>New: {analytics.subscribers.new}</small>
        </div>

        <div className="stat-card">
          <h3>Total Usage</h3>
          <p>{analytics.usage.total.toLocaleString()}</p>
        </div>
      </div>

      <div className="chart">
        <h2>Revenue Trend</h2>
        {/* Add chart library like recharts, chart.js */}
        <pre>{JSON.stringify(analytics.revenue.monthlyBreakdown, null, 2)}</pre>
      </div>
    </div>
  );
}
```

---

## Common Patterns

### 1. Checking User Role

```typescript
const user = await prisma.user.findUnique({
  where: { email: session.user.email },
});

const isPlatformOwner = user?.role === 'platform_owner';
```

### 2. Verifying Resource Ownership

```typescript
// Example: Verify subscription belongs to user
const subscription = await prisma.subscription.findUnique({
  where: { id: subscriptionId },
});

if (subscription.userId !== user.id) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
}
```

### 3. Queuing Email Notification

```typescript
await prisma.emailNotification.create({
  data: {
    userId: user.id,
    type: 'subscription_created',
    subject: 'Welcome!',
    body: 'Your subscription is active.',
    recipient: user.email!,
    status: 'pending',
    metadata: { subscriptionId } as any,
  },
});
```

### 4. Logging Webhook Event

```typescript
await prisma.webhookEvent.create({
  data: {
    eventId: event.id,
    eventType: event.type,
    payload: event.data.object as any,
    status: 'pending',
  },
});
```

---

## Environment Setup

### Required Variables

```env
# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/db"
SHADOW_DATABASE_URL="postgresql://user:pass@localhost:5432/shadow"

# NextAuth
SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Stripe
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Email (optional, for future implementation)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT="587"
EMAIL_SERVER_USER="user@example.com"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@example.com"
```

---

## Troubleshooting

### API Key Authentication Fails

1. Check if key is hashed correctly in database
2. Verify `x-api-key` header is being sent
3. Check if key is active and not expired
4. Ensure permissions match required permission

### Webhook Not Processing

1. Verify `STRIPE_WEBHOOK_SECRET` is set
2. Check Stripe dashboard for webhook delivery status
3. Look at `WebhookEvent` table for logged events
4. Check for errors in webhook event records

### Analytics Returning Empty Data

1. Ensure subscriptions exist in database
2. Check that `saasCreatorId` matches
3. Verify date ranges are correct
4. Look for Prisma query errors in logs

---

## Best Practices

1. **Never log API keys** - They're hashed for a reason
2. **Always verify ownership** before modifying resources
3. **Use transactions** for multi-step operations
4. **Queue emails** instead of sending synchronously
5. **Index properly** - All foreign keys have indexes
6. **Handle errors gracefully** - Return helpful messages

---

## Next Steps

1. Build UI components using examples above
2. Set up email sending service (SendGrid recommended)
3. Add comprehensive tests
4. Create user documentation
5. Set up monitoring and alerting

For more information, see:
- [API_ENHANCEMENTS.md](./API_ENHANCEMENTS.md) - Complete API reference
- [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Implementation details
