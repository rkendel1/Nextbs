# GuidedProductWizard Enhancements - Visual Guide

## UI Enhancements Overview

This document provides a visual/textual representation of the UI enhancements added to the GuidedProductWizard component.

---

## Step 3: Enhanced Metering Configuration

### NEW: Limit Enforcement Section
**Appears when:** User sets a usage limit for metered/usage-based products

```
┌─────────────────────────────────────────────────────────────┐
│ 🛡️ Limit Enforcement                                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ What happens when limit is reached? *                      │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Soft Limit (Warn only - allow usage to continue)   │   │
│ │ Hard Limit (Block usage when exceeded)             │   │
│ │ Allow Overage (Charge extra for usage over limit)  │   │
│ └─────────────────────────────────────────────────────┘   │
│ ℹ️ Users receive warnings but can continue using...        │
│                                                             │
│ Warning Threshold (%)                                       │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 80                                                  │   │
│ └─────────────────────────────────────────────────────┘   │
│ ℹ️ Users will receive warning at 800 units (80% of 1000)   │
│                                                             │
│ [When overage selected]                                    │
│ Overage Rate (USD per unit)                                │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ 0.01                                                │   │
│ └─────────────────────────────────────────────────────┘   │
│ ℹ️ Price charged per unit over the limit                   │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ⚠️ Limit Enforcement Best Practices                   │ │
│ │ • Set warning at 80-90% to give users time to upgrade│ │
│ │ • Hard limits work best for free tiers               │ │
│ │ • Overage pricing provides flexibility               │ │
│ │ • Always communicate limits clearly to users         │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 4: Implementation Guide Enhancements

### NEW: Webhook Configuration
**Appears in:** Step 4 (after implementation guide)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔗 Webhook Configuration (Optional)                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ☑️ Enable webhook notifications for usage events           │
│                                                             │
│ [When enabled]                                              │
│ Webhook URL *                                               │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ https://your-domain.com/webhooks/usage             │   │
│ └─────────────────────────────────────────────────────┘   │
│ ℹ️ We'll send POST requests to this URL when events occur  │
│                                                             │
│ Events to Track                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ☑️ Usage Recorded                                     │ │
│ │    Triggered each time usage is reported             │ │
│ ├───────────────────────────────────────────────────────┤ │
│ │ ☑️ Limit Warning                                      │ │
│ │    Triggered at warning threshold                    │ │
│ ├───────────────────────────────────────────────────────┤ │
│ │ ☑️ Limit Exceeded                                     │ │
│ │    Triggered when limit is reached                   │ │
│ ├───────────────────────────────────────────────────────┤ │
│ │ ☑️ Subscription Updated                               │ │
│ │    Triggered on subscription changes                 │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ 💻 Webhook Payload Example                            │ │
│ │ {                                                     │ │
│ │   "event": "usage.recorded",                         │ │
│ │   "subscriptionId": "sub_xxx",                       │ │
│ │   "userId": "user_xxx",                              │ │
│ │   "quantity": 100,                                   │ │
│ │   "timestamp": "2024-01-15T10:30:00Z"                │ │
│ │ }                                                     │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### NEW: API Key Management
**Appears in:** Step 4 (after webhook configuration)

```
┌─────────────────────────────────────────────────────────────┐
│ 🔑 API Key Management (Optional)                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ☑️ Generate API keys for subscribers                       │
│                                                             │
│ [When enabled]                                              │
│ API Key Purpose/Name                                        │
│ ┌─────────────────────────────────────────────────────┐   │
│ │ Production API Access                               │   │
│ └─────────────────────────────────────────────────────┘   │
│ ℹ️ Helps you and subscribers identify the key's purpose    │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ ✅ Automatic API Key Generation                       │ │
│ │ When enabled, we'll automatically generate a unique  │ │
│ │ API key for each subscriber. Keys are securely sent  │ │
│ │ via email and displayed in their account dashboard.  │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## Step 5: Review & Confirm Enhancements

### NEW: Product Preview Card
**Appears in:** Step 5 (after product status selection)

```
┌─────────────────────────────────────────────────────────────┐
│ 👁️ Live Preview on Your Site                                │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │                  [Your Business Logo]                 │ │
│ │                                                       │ │
│ │                   Pro Plan                            │ │
│ │         Everything you need to scale                  │ │
│ │                                                       │ │
│ │                  $49.99 / monthly                     │ │
│ │                                                       │ │
│ │  ✓ 10,000 API calls per month                        │ │
│ │  ✓ Priority email support                            │ │
│ │  ✓ Advanced analytics dashboard                      │ │
│ │  ✓ Custom domain support                             │ │
│ │  ✓ 99.9% uptime SLA                                  │ │
│ │                                                       │ │
│ │  ┌─────────────────────────────────────────────┐     │ │
│ │  │        Preview Subscribe                    │     │ │
│ │  └─────────────────────────────────────────────┘     │ │
│ │                                                       │ │
│ │  This is a live preview of your product card on      │ │
│ │  the whitelabel site.                                │ │
│ └───────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

---

## State Management Architecture

### New State Objects

```typescript
// Limit Enforcement Configuration
const [limitConfig, setLimitConfig] = useState({
  limitAction: "warn" as "warn" | "block" | "overage",
  softLimitPercent: 80,
  overageRate: "",
});

// Webhook Configuration
const [webhookConfig, setWebhookConfig] = useState({
  enabled: false,
  url: "",
  events: [] as string[],
});

// API Key Configuration
const [apiKeyConfig, setApiKeyConfig] = useState({
  requiresApiKey: false,
  apiKeyName: "",
});

// White-label config for preview
const [whiteLabelConfig, setWhiteLabelConfig] = useState<any>(null);
```

---

## Backend Integration Flow

### Product Creation Sequence

```
1. Create Product
   POST /api/saas/products
   ↓
2. Create Tier with Limit Config
   POST /api/saas/tiers
   {
     ...tierData,
     usageLimit: 1000,
     limitAction: "warn",
     softLimitPercent: 0.8,
     overageRate: 100 // cents
   }
   ↓
3. Create Metering with Webhook Config
   POST /api/saas/metering
   {
     ...meteringConfig,
     usageReportingUrl: "https://...",
     webhookEvents: ["usage.recorded", "limit.warning"]
   }
   ↓
4. Create API Key (if required)
   POST /api/saas/api-keys
   {
     name: "Production API Access",
     productId: "prod_xxx",
     permissions: ["usage:read", "usage:write"]
   }
   ↓
5. Fetch White-label Config
   GET /api/saas/white-label
   ↓
6. Navigate to Success Step
```

---

## User Experience Flow

### For Subscription Products
```
Step 0: Choose Product Type → Subscription
Step 1: Product Information → Name, Description
Step 2: Set Pricing → Tier Name, Price, Billing Period
Step 3: Add Features → Feature List
Step 5: Review → [Product Details] → [NEW: Preview Card] → Create
```

### For Usage-Based/Metered Products
```
Step 0: Choose Product Type → Usage-based/Metered
Step 1: Product Information → Name, Description
Step 2: Set Pricing → Tier Name, Price, Usage Limit
Step 3: Metering Configuration → Type, Unit, Aggregation
        [NEW: Limit Enforcement] → Action, Threshold, Overage Rate
Step 4: Implementation Guide → Usage API Examples
        [NEW: Webhook Config] → URL, Events
        [NEW: API Key Config] → Name, Purpose
Step 5: Review → [Product Details] → [NEW: Preview Card] → Create
```

---

## Key Design Principles

### 1. Progressive Disclosure
- Advanced features only shown when relevant
- Limit enforcement only for products with usage limits
- Webhook/API key sections are opt-in

### 2. Contextual Help
- Inline tooltips explain each option
- Best practices shown alongside inputs
- Example payloads for webhook config

### 3. Visual Consistency
- Icons for each section (🛡️, 🔗, 🔑, 👁️)
- Consistent color scheme (blue for info, green for success)
- Bordered sections with clear headers

### 4. Smart Defaults
- Warning threshold defaults to 80%
- Limit action defaults to "warn" (safest option)
- All optional features disabled by default

---

## Accessibility Features

- ✅ Proper label associations (`htmlFor` on labels)
- ✅ Descriptive help text for screen readers
- ✅ Keyboard navigation support
- ✅ Clear visual hierarchy
- ✅ Semantic HTML structure
- ✅ ARIA-compliant checkboxes and radio buttons

---

## Summary

The GuidedProductWizard now provides:

1. **Visual Product Preview** - See your product card before publishing
2. **Flexible Limit Enforcement** - Choose soft/hard limits or overage pricing
3. **Event Tracking** - Configure webhooks for usage monitoring
4. **API Key Management** - Auto-generate keys for subscribers
5. **Comprehensive Help** - Inline documentation and best practices

All while maintaining a clean, intuitive user experience!
