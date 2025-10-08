# Onboarding Flow Diagram

## Visual Flow Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NEW ONBOARDING FLOW                             │
│                    "Stripe meets Webflow setup magic"                   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 1: Enter Your URL                                                  │
│ ──────────────────────                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────┐                         │
│  │  "Enter your website URL"                  │                         │
│  │  [https://your-company.com    ]   [Next]   │                         │
│  │                                             │                         │
│  │  ✨ Magic Prefill™                         │                         │
│  │  We'll automatically detect your brand     │                         │
│  │  colors, logo, fonts, and company info     │                         │
│  └────────────────────────────────────────────┘                         │
│                                                                          │
│  User Action: Clicks [Next]                                             │
│         ↓                                                                │
│  System Action: POST /api/scrape { url }                                │
│         ↓                                                                │
│  Toast: "🪄 Preparing your workspace…"                                  │
│         ↓                                                                │
│  Immediately proceed to Step 2 (no waiting)                             │
└─────────────────────────────────────────────────────────────────────────┘
                            ↓
                   ┌────────────────┐
                   │ Background Job │ ← Crawler processes in parallel
                   │   Processing   │
                   │   (1-20 sec)   │
                   └────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 2: Connect Stripe                                                  │
│ ──────────────────────                                                  │
│                                                                          │
│  ┌────────────────────────────────────────────┐                         │
│  │  "Connect your Stripe account"             │                         │
│  │                                             │                         │
│  │  ┌──────────────────────────────┐          │                         │
│  │  │  [Connect with Stripe]       │          │                         │
│  │  │  🔵 Powered by Stripe        │          │                         │
│  │  └──────────────────────────────┘          │                         │
│  │                                             │                         │
│  │  While you connect Stripe, we're fetching  │                         │
│  │  your brand info in the background         │                         │
│  └────────────────────────────────────────────┘                         │
│                                                                          │
│  User Action: Clicks [Connect with Stripe]                              │
│         ↓                                                                │
│  Redirects to Stripe OAuth                                              │
│         ↓                                                                │
│  User authorizes Stripe                                                 │
│         ↓                                                                │
│  Returns to app with stripeAccountId                                    │
│         ↓                                                                │
│  Toast: "Nice! While you were connecting Stripe,                        │
│          we fetched your brand and company info." ✨                    │
└─────────────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────────────┐
│ STEP 3: Review Company Info                                             │
│ ───────────────────────────                                             │
│                                                                          │
│  ┌────────────────────────────────────────────┐                         │
│  │  "Review Your Company Info"                │                         │
│  │                                             │                         │
│  │  ┌─────────────────────────────┐           │                         │
│  │  │ 🎨 Brand Preview            │           │                         │
│  │  │ [Logo] 🟦 Primary 🔲 Secondary │       │                         │
│  │  └─────────────────────────────┘           │                         │
│  │                                             │                         │
│  │  Business Name: [Acme Inc]       ✏️         │                         │
│  │  Description:   [SaaS platform]  ✏️         │                         │
│  │  Address:       [123 Main St]   ✏️         │                         │
│  │  Email:         [hi@acme.com]   ✏️         │                         │
│  │  Phone:         [555-1234]      ✏️         │                         │
│  │                                             │                         │
│  │  🎯 Detected Brand Voice                   │                         │
│  │  "Friendly and professional..."            │                         │
│  │                                             │                         │
│  │  [Back]              [Complete Setup] →    │                         │
│  └────────────────────────────────────────────┘                         │
│                                                                          │
│  Data Source: GET /api/setup/prefill                                    │
│         ↓                                                                │
│  If status = "completed" → Show prefilled data with edit controls       │
│  If status = "processing" → Show "Still fetching..." message            │
│  If status = "failed" → Show manual entry form                          │
│                                                                          │
│  User Action: Clicks [Complete Setup]                                   │
│         ↓                                                                │
│  System: POST /api/saas/onboarding (save all data)                      │
│         ↓                                                                │
│  Redirect to /dashboard                                                 │
└─────────────────────────────────────────────────────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                          TECHNICAL FLOW DIAGRAM
═══════════════════════════════════════════════════════════════════════════

┌──────────────┐
│   Browser    │
└──────┬───────┘
       │
       │ 1. User enters URL
       ↓
┌──────────────────────────┐
│  POST /api/scrape        │
│  { url: "..." }          │
└──────┬───────────────────┘
       │
       │ 2. Create/update SaasCreator
       │    Set crawlStatus = "processing"
       │    Set crawlJobId = "crawl_xxx"
       ↓
┌──────────────────────────┐
│  triggerCrawlerJob()     │ ← Async background function
│  (Promise - no await)    │
└──────┬───────────────────┘
       │
       │ 3. Simulates crawler call
       │    (1-3 sec delay)
       ↓
┌──────────────────────────┐
│  Mock Crawler Response   │
│  {                       │
│    logo_url,             │
│    colors,               │
│    fonts,                │
│    company_name,         │
│    ...                   │
│  }                       │
└──────┬───────────────────┘
       │
       │ 4. Update SaasCreator
       │    Set crawlStatus = "completed"
       │    Store all brand data
       ↓
┌──────────────────────────┐
│  Database (PostgreSQL)   │
│                          │
│  SaasCreator {           │
│    crawlStatus,          │
│    logoUrl,              │
│    primaryColor,         │
│    fonts (JSON),         │
│    contactInfo (JSON),   │
│    ...                   │
│  }                       │
└──────┬───────────────────┘
       │
       │ 5. User returns from Stripe
       ↓
┌──────────────────────────┐
│  GET /api/setup/prefill  │
└──────┬───────────────────┘
       │
       │ 6. Retrieve SaasCreator data
       │    Parse JSON fields
       │    Build BrandData response
       ↓
┌──────────────────────────┐
│  CompanyInfoReviewStep   │
│  Displays prefilled data │
└──────────────────────────┘


═══════════════════════════════════════════════════════════════════════════
                         STATE MACHINE DIAGRAM
═══════════════════════════════════════════════════════════════════════════

                        ┌──────────────┐
                        │   pending    │ ← Initial state
                        └──────┬───────┘
                               │
                  POST /api/scrape triggers
                               │
                               ↓
                        ┌──────────────┐
                    ┌───│ processing   │
                    │   └──────┬───────┘
                    │          │
      Timeout (20s) │          │ Success (1-3s typical)
         or Error   │          │
                    │          ↓
                    │   ┌──────────────┐
                    │   │  completed   │ ← Brand data available
                    │   └──────────────┘
                    │
                    ↓
             ┌──────────────┐
             │    failed    │ ← Fallback to manual entry
             └──────────────┘


═══════════════════════════════════════════════════════════════════════════
                        DATA FLOW ARCHITECTURE
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────────┐
│                     Frontend Components                             │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  BusinessInfoStep  →  StripeConnectStep  →  CompanyInfoReviewStep  │
│    (URL entry)         (Stripe OAuth)          (Review & Edit)      │
│                                                                      │
└────────┬──────────────────────┬───────────────────────┬─────────────┘
         │                      │                       │
         │ POST                 │ GET                   │ POST
         │ /api/scrape          │ /api/setup/prefill    │ /api/saas/onboarding
         │                      │                       │
         ↓                      ↓                       ↓
┌─────────────────────────────────────────────────────────────────────┐
│                        API Routes                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  /api/scrape/route.ts                                               │
│  - Validate URL                                                     │
│  - Create/update SaasCreator                                        │
│  - Trigger background crawler                                       │
│                                                                      │
│  /api/setup/prefill/route.ts                                        │
│  - Check crawl status                                               │
│  - Return BrandData if completed                                    │
│  - Parse JSON fields                                                │
│                                                                      │
│  /api/saas/onboarding/route.ts                                      │
│  - Save all onboarding data                                         │
│  - Update SaasCreator fields                                        │
│  - Mark onboarding complete                                         │
│                                                                      │
└────────┬────────────────────────────────────────────────────────────┘
         │
         │ Prisma ORM
         │
         ↓
┌─────────────────────────────────────────────────────────────────────┐
│                     Database Schema                                  │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  SaasCreator {                                                      │
│    // Existing fields                                               │
│    businessName                                                     │
│    businessDescription                                              │
│    website                                                          │
│                                                                      │
│    // NEW: Brand Assets                                             │
│    logoUrl                                                          │
│    faviconUrl                                                       │
│                                                                      │
│    // NEW: Design Tokens                                            │
│    primaryColor                                                     │
│    secondaryColor                                                   │
│    fonts (JSON array)                                               │
│                                                                      │
│    // NEW: Company Info                                             │
│    companyAddress                                                   │
│    contactInfo (JSON object)                                        │
│                                                                      │
│    // NEW: Parsed Data                                              │
│    productsParsed (JSON array)                                      │
│    voiceAndTone                                                     │
│                                                                      │
│    // NEW: Crawler Metadata                                         │
│    crawlJobId                                                       │
│    crawlStatus                                                      │
│    crawlConfidence (JSON object)                                    │
│    crawlCompletedAt                                                 │
│  }                                                                  │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## Key Features

### 🚀 Parallel Processing
- Crawler runs in background while user completes Stripe
- No blocking wait states
- Seamless user experience

### 🎨 Magic Prefill™
- Automatic brand detection
- Logo and favicon extraction
- Color palette analysis
- Font detection
- Company information parsing
- Voice & tone AI analysis

### ✏️ Full Control
- All fields editable
- Accept/Edit/Remove actions
- Confidence scores visible
- Manual entry fallback

### 🛡️ Robust Error Handling
- 20-second timeout
- Graceful degradation
- Clear error messaging
- Always allows progression

## Timeline

**Total Onboarding Time: ~2 minutes**

| Step | Duration | Activity |
|------|----------|----------|
| 1    | 10 sec   | Enter URL + validate |
| 2    | 60-90 sec | Stripe OAuth flow |
| 3    | 30-60 sec | Review & edit data |

**Background Processing: 1-3 seconds** (happens during Step 2)

## UX Moments

### "Wow Moments"
1. **URL Submit**: "🪄 Preparing your workspace…" toast
2. **Stripe Return**: "Nice! While you were connecting Stripe, we fetched your brand and company info." toast
3. **Step 3 Load**: Magic reveal animation with pre-filled fields
4. **Brand Preview**: Visual display of logo and colors

### Progressive Disclosure
- Only show what's necessary at each step
- Hide technical details (job IDs, API calls)
- Focus on value ("we detected", not "crawler found")

### Trust Building
- Transparency: All fields editable
- Control: Accept/Edit/Remove options
- Confidence: Show accuracy scores
- Fallback: Manual entry always available
