# Onboarding Flow Revamp - DesignTokens Integration

## Overview

This implementation delivers a new 3-step onboarding experience that automatically fetches brand information from a user's website using the rkendel1/designtokens crawler service.

## Features

### 🎯 New 3-Step Onboarding Flow

1. **Step 1: Enter Your URL**
   - User enters their public website URL
   - System validates the URL
   - Crawler job triggered in background
   - Toast notification: "🪄 Preparing your workspace…"
   - User immediately proceeds to Stripe Connect

2. **Step 2: Connect Stripe**
   - Standard Stripe Connect flow
   - While user connects Stripe, crawler processes in background
   - No waiting screens - seamless experience

3. **Step 3: Review Company Info**
   - Displays pre-filled brand data from crawler
   - Editable fields with Accept/Edit/Remove controls
   - Brand preview showing logo and color palette
   - Fallback to manual entry if crawler fails
   - "Magic reveal" animation when data is ready

### ✨ Magic Prefill™

The system automatically detects and pre-fills:
- **Brand Assets**: Logo, favicon
- **Design Tokens**: Primary/secondary colors, fonts
- **Company Info**: Name, address
- **Contact Info**: Email, phone
- **Voice & Tone**: AI-assisted brand language analysis
- **Confidence Scores**: Per-field accuracy metrics

## API Endpoints

### POST /api/scrape
Triggers the designtokens crawler to scrape brand data from a URL.

**Request:**
```json
{
  "url": "https://example.com"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "crawl_1234567890_abc123",
  "message": "Crawler job started"
}
```

### GET /api/setup/prefill
Retrieves prefilled brand data from the crawler.

**Response (when completed):**
```json
{
  "success": true,
  "crawlStatus": "completed",
  "data": {
    "logo_url": "https://...",
    "favicon_url": "https://...",
    "colors": {
      "primary": "#1A73E8",
      "secondary": "#F5F5F5"
    },
    "fonts": ["Inter", "Roboto"],
    "company_name": "Example Inc.",
    "company_address": "123 Main St, City, State",
    "contact_info": {
      "email": "contact@example.com",
      "phone": "+1 (555) 123-4567"
    },
    "products": ["Starter", "Pro", "Enterprise"],
    "voice": "Friendly and professional...",
    "confidence_scores": {
      "logo": 0.85,
      "colors": 0.9,
      "fonts": 0.8,
      "company_info": 0.75
    }
  }
}
```

**Response (when processing):**
```json
{
  "success": false,
  "crawlStatus": "processing",
  "jobId": "crawl_1234567890_abc123",
  "message": "Crawl is still in progress"
}
```

**Response (when failed):**
```json
{
  "success": false,
  "crawlStatus": "failed",
  "message": "Crawl failed - please enter information manually"
}
```

## Database Schema Changes

### SaasCreator Model Extensions

New fields added to the `SaasCreator` model in Prisma schema:

```prisma
model SaasCreator {
  // ... existing fields ...
  
  // Brand data from crawler
  logoUrl             String?
  faviconUrl          String?
  primaryColor        String?
  secondaryColor      String?
  fonts               String?             @db.Text // JSON array
  companyAddress      String?
  contactInfo         String?             @db.Text // JSON object
  productsParsed      String?             @db.Text // JSON array
  voiceAndTone        String?             @db.Text
  crawlJobId          String?
  crawlStatus         String?             @default("pending")
  crawlConfidence     String?             @db.Text // JSON object
  crawlCompletedAt    DateTime?
}
```

## TypeScript Types

### OnboardingStep Enum
```typescript
export enum OnboardingStep {
  URL_ENTRY = 1,
  STRIPE_CONNECT = 2,
  COMPANY_INFO_REVIEW = 3,
  COMPLETE = 4,
}
```

### BrandData Interface
```typescript
export interface BrandData {
  logo_url?: string;
  favicon_url?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  fonts?: string[];
  company_name?: string;
  company_address?: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  products?: string[];
  voice?: string;
  confidence_scores?: {
    logo?: number;
    colors?: number;
    fonts?: number;
    company_info?: number;
  };
}
```

## Components

### BusinessInfoStep
- **Location**: `src/components/SaasOnboarding/BusinessInfoStep.tsx`
- **Purpose**: URL entry and crawler trigger
- **Features**:
  - URL validation
  - Crawler API integration
  - Toast notifications
  - Info box explaining Magic Prefill™

### CompanyInfoReviewStep
- **Location**: `src/components/SaasOnboarding/CompanyInfoReviewStep.tsx`
- **Purpose**: Review and edit pre-filled data
- **Features**:
  - Fetch prefill data on mount
  - Editable field controls
  - Brand preview with logo and colors
  - Confidence score display
  - Voice & tone detection display
  - Fallback messaging for failed crawls

### OnboardingWizard
- **Location**: `src/components/SaasOnboarding/index.tsx`
- **Purpose**: Main orchestration component
- **Changes**:
  - Updated to 3-step flow
  - New state management for brand data
  - Progress tracking for new steps

## Crawler Integration

### Current Implementation
The `/api/scrape` endpoint now includes an **actual web scraper** that extracts design tokens directly from websites. It uses:

- **cheerio** - For HTML parsing and DOM manipulation
- **css-tree** - For CSS parsing and color/font extraction
- **@mozilla/readability** - For content extraction and company information
- **jsdom** - For DOM manipulation with Readability

The scraper extracts:
- **Colors**: Analyzes all CSS files and inline styles to find primary and secondary brand colors
- **Fonts**: Extracts font-family declarations from CSS and Google Fonts links
- **Logo & Favicon**: Searches for logo images using common selectors and favicon links
- **Company Info**: Uses Readability and meta tags to extract company name and description
- **Contact Info**: Uses regex patterns to find email addresses, phone numbers, and physical addresses

### Alternative: External Crawler Service
If you prefer to use an external crawler service (like rkendel1/designtokens):

1. Update the `triggerCrawlerJob` function in `/api/scrape/route.ts`
2. Replace the scraping logic with an HTTP call:

```typescript
// Production integration example
const crawlerResponse = await fetch('https://designtokens-service/api/crawl', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    url: url,
    user_id: saasCreatorId 
  })
});

const result = await crawlerResponse.json();
```

3. The crawler should conform to the expected response format (BrandData interface)
4. Update environment variables to include crawler service URL

## Error Handling

### Crawler Failures
- **Timeout**: Crawl auto-terminates after 20 seconds with partial results
- **Network Errors**: Status updated to "failed", fallback to manual entry
- **Invalid URLs**: Client-side validation with error messages

### User Experience
- All failures gracefully fall back to manual data entry
- Contextual messaging guides users through fallback scenarios
- No blocking wait states - user can always proceed

## Testing

### Manual Testing Flow
1. Navigate to `/onboarding`
2. Enter a website URL (e.g., `https://example.com`)
3. Verify toast notification appears
4. Proceed to Stripe Connect
5. Complete or skip Stripe
6. Verify Company Info Review step shows prefilled data
7. Test edit controls on each field
8. Complete onboarding

### Test Cases
- ✅ Valid URL submission
- ✅ Invalid URL validation
- ✅ Crawler success with full data
- ✅ Crawler in progress state
- ✅ Crawler failure fallback
- ✅ Field editing functionality
- ✅ Required field validation
- ✅ Onboarding completion

## Future Enhancements

1. **Real-time Progress Updates**
   - WebSocket connection for live crawler status
   - Progressive reveal as data becomes available

2. **Enhanced Confidence Scoring**
   - Visual indicators for low-confidence fields
   - Manual verification prompts

3. **Webhook Support**
   - Crawler can webhook when complete
   - Reduce polling overhead

4. **Multiple URL Support**
   - Crawl multiple pages for better accuracy
   - Compare and merge results

5. **A/B Testing**
   - Test confetti animation vs subtle fade-in
   - Measure conversion rates

## Migration Guide

### Running Migrations
After pulling these changes, run:

```bash
npm install
npx prisma generate
npx prisma migrate dev --name add_brand_data_fields
```

### Database Seed (Optional)
For testing with existing users:

```sql
UPDATE "SaasCreator" 
SET "crawlStatus" = 'pending' 
WHERE "crawlStatus" IS NULL;
```

## Deployment Notes

1. **Environment Variables**: Ensure `DATABASE_URL` is configured
2. **Prisma Client**: Run `prisma generate` during build
3. **Background Jobs**: Crawler runs async - no worker process needed for MVP
4. **Crawler Service**: Configure URL when production crawler is ready

## Support

For issues or questions:
- Check API endpoint logs for crawler errors
- Verify Prisma schema migrations are applied
- Test with different URLs to isolate crawler issues
- Check browser console for frontend errors

---

**Version**: 1.0.0  
**Last Updated**: 2024  
**Author**: GitHub Copilot for rkendel1
