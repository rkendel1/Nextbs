# White Label Enhancement Architecture Diagram

## System Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     Creator Onboarding Flow                          │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Step 1: Enter Website URL                                          │
│  User inputs: https://example.com                                   │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  POST /api/scrape                                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ DesignTokens Crawler Service                                  │ │
│  │ ────────────────────────────────                              │ │
│  │ Extracts:                                                     │ │
│  │ • Logo URL                                                    │ │
│  │ • Favicon URL                                                 │ │
│  │ • Primary Color (#1A73E8)                                     │ │
│  │ • Secondary Color (#F5F5F5)                                   │ │
│  │ • Fonts ["Inter", "Roboto"]                                   │ │
│  │ • Company Name                                                │ │
│  │ • Voice & Tone Analysis                                       │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  SaasCreator Model (Database)                                        │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Stored Fields:                                                │ │
│  │ ├─ logoUrl: "https://logo.clearbit.com/example.com"          │ │
│  │ ├─ faviconUrl: "https://example.com/favicon.ico"             │ │
│  │ ├─ primaryColor: "#1A73E8"                                    │ │
│  │ ├─ secondaryColor: "#F5F5F5"                                  │ │
│  │ ├─ fonts: '["Inter", "Roboto"]' (JSON string)                │ │
│  │ ├─ voiceAndTone: "Friendly and professional..."              │ │
│  │ └─ crawlStatus: "completed"                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  WhiteLabelConfig Model (Optional Manual Override)                  │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ • brandName                                                   │ │
│  │ • primaryColor (override)                                     │ │
│  │ • secondaryColor (override)                                   │ │
│  │ • logoUrl (override)                                          │ │
│  │ • customCss                                                   │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  GET /api/saas/whitelabel/creator-by-domain?domain=example         │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Response:                                                     │ │
│  │ {                                                             │ │
│  │   "creator": { /* creator data */ },                         │ │
│  │   "whiteLabel": {                                            │ │
│  │     "brandName": "Example Inc",                              │ │
│  │     "primaryColor": "#1A73E8",                               │ │
│  │     "logoUrl": "..."                                         │ │
│  │   },                                                         │ │
│  │   "designTokens": { ◄─── NEW!                               │ │
│  │     "fonts": ["Inter", "Roboto"],                           │ │
│  │     "primaryColor": "#1A73E8",                               │ │
│  │     "secondaryColor": "#F5F5F5",                             │ │
│  │     "logoUrl": "...",                                        │ │
│  │     "faviconUrl": "...",                                     │ │
│  │     "voiceAndTone": "Friendly and professional..."          │ │
│  │   }                                                          │ │
│  │ }                                                            │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  White Label Pages Rendering                                        │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ WhiteLabelLayout Component                                    │ │
│  │ ────────────────────────────                                  │ │
│  │                                                               │ │
│  │ 1. Font Loading (useEffect)                                   │ │
│  │    ├─ Parse fonts array                                       │ │
│  │    ├─ Create Google Fonts link                                │ │
│  │    │   <link href="https://fonts.googleapis.com/             │ │
│  │    │         css2?family=Inter&family=Roboto">               │ │
│  │    └─ Apply to body                                           │ │
│  │        font-family: 'Inter', sans-serif                       │ │
│  │                                                               │ │
│  │ 2. Favicon Injection (useEffect)                              │ │
│  │    ├─ Find or create <link rel="icon">                       │ │
│  │    └─ Set href to faviconUrl                                  │ │
│  │                                                               │ │
│  │ 3. Layout Rendering                                           │ │
│  │    ├─ Header with logo (logoUrl)                             │ │
│  │    ├─ Navigation with brand colors                           │ │
│  │    ├─ Main content area                                       │ │
│  │    └─ Footer with secondaryColor                             │ │
│  └───────────────────────────────────────────────────────────────┘ │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Homepage Component                                            │ │
│  │ ──────────────────                                            │ │
│  │                                                               │ │
│  │ Hero Section:                                                 │ │
│  │   background: linear-gradient(135deg,                        │ │
│  │     #F5F5F5 0%,              ◄─── secondaryColor            │ │
│  │     rgba(26,115,232,0.08) 100%) ◄─── primaryColor + opacity │ │
│  │                                                               │ │
│  │ Products Section:                                             │ │
│  │   backgroundColor: #F5F5F5   ◄─── secondaryColor            │ │
│  │   Card borders: #1A73E8      ◄─── primaryColor              │ │
│  │                                                               │ │
│  │ CTA Section:                                                  │ │
│  │   background: linear-gradient(135deg,                        │ │
│  │     #1A73E8 0%,              ◄─── primaryColor              │ │
│  │     #1A73E8dd 100%)          ◄─── primaryColor + opacity    │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│  Rendered White Label Page (User View)                              │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │ Browser Tab: [Favicon] Example Inc                           │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Header: [Logo] Home Products Account [Get Started]          │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Hero: (Light gradient background)                            │ │
│  │       Welcome to Example Inc                                 │ │
│  │       Friendly and professional... [in Inter font]           │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Products: (Light purple background)                          │ │
│  │   [Card with blue border] [Card] [Card]                     │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ CTA: (Blue gradient background)                              │ │
│  │      Ready to Get Started? [White button]                    │ │
│  ├───────────────────────────────────────────────────────────────┤ │
│  │ Footer: (Light purple background)                            │ │
│  │         © 2024 Example Inc | Links                           │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
```

## Priority System for Design Tokens

```
┌─────────────────────────────────────────────────────────────────┐
│  Design Token Value Resolution                                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  1. WhiteLabelConfig (Manual Override)                         │
│     ├─ If creator manually configured                          │
│     └─ Takes highest priority                                  │
│                                                                 │
│  2. DesignTokens (From Scraping)                               │
│     ├─ If scraping completed successfully                      │
│     └─ Automatic brand matching                                │
│                                                                 │
│  3. Default Values                                              │
│     ├─ Fallback for missing data                               │
│     └─ Ensures system always works                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

Example for Primary Color:
  primaryColor = config.primaryColor          // Priority 1
              || designTokens?.primaryColor    // Priority 2
              || '#667eea'                     // Priority 3
```

## Component Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│  /whitelabel/[domain]/page.tsx (Homepage)                       │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │  <WhiteLabelLayout domain={domain}>                       │ │
│  │    ├─ Fetches creator + design tokens                     │ │
│  │    ├─ Loads fonts dynamically                             │ │
│  │    ├─ Injects favicon                                     │ │
│  │    ├─ Renders header (with logo)                          │ │
│  │    ├─ Renders navigation                                  │ │
│  │    │                                                       │ │
│  │    ├─ {children}                                          │ │
│  │    │   └─ Homepage content                                │ │
│  │    │       ├─ Hero (branded gradient)                     │ │
│  │    │       ├─ Products (secondary bg)                     │ │
│  │    │       └─ CTA (primary gradient)                      │ │
│  │    │                                                       │ │
│  │    └─ Renders footer (secondary bg)                       │ │
│  │  </WhiteLabelLayout>                                      │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Data Transformations

```
Scraped Data (API Response)
  │
  ├─ colors.primary: "#1A73E8"
  ├─ colors.secondary: "#F5F5F5"
  ├─ fonts: ["Inter", "Roboto"]
  └─ voice: "Friendly and professional..."
  │
  ▼
Stored in Database (SaasCreator)
  │
  ├─ primaryColor: "#1A73E8"
  ├─ secondaryColor: "#F5F5F5"
  ├─ fonts: '["Inter","Roboto"]' (JSON string)
  └─ voiceAndTone: "Friendly and professional..."
  │
  ▼
API Response (designTokens object)
  │
  ├─ fonts: ["Inter", "Roboto"] (parsed array)
  ├─ primaryColor: "#1A73E8"
  ├─ secondaryColor: "#F5F5F5"
  └─ voiceAndTone: "Friendly and professional..."
  │
  ▼
Applied to UI
  │
  ├─ Google Fonts Link: family=Inter&family=Roboto
  ├─ Gradient: linear-gradient(#F5F5F5, rgba(26,115,232,0.08))
  ├─ Background: #F5F5F5
  └─ Message: "Friendly and professional..."
```

## Enhancement Impact

```
┌────────────────────────────────────────────────────────────────┐
│  Before Enhancement                                            │
├────────────────────────────────────────────────────────────────┤
│  • Generic gradients (gray-to-blue)                           │
│  • Only primary color used                                     │
│  • System fonts only                                           │
│  • No favicon                                                  │
│  • Generic messaging                                           │
│  • Template-like appearance                                    │
│  • 17% design token utilization                               │
└────────────────────────────────────────────────────────────────┘
                              │
                              │ Enhancement
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  After Enhancement                                             │
├────────────────────────────────────────────────────────────────┤
│  • Brand-aware gradients                                       │
│  • Full color palette (primary + secondary)                   │
│  • Brand fonts via Google Fonts                               │
│  • Dynamic favicon                                             │
│  • Voice/tone messaging                                        │
│  • On-brand appearance                                         │
│  • 100% design token utilization ✨                           │
└────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌────────────────────────────────────────────────────────────────┐
│  Result: Creator Confidence ↑                                  │
│  "This looks like a true extension of my brand!"              │
└────────────────────────────────────────────────────────────────┘
```
