# Design Tokens Web Scraper Implementation

## Overview

The mock design tokens API call has been replaced with a **lightweight frontend web scraper** that extracts design tokens directly from websites in real-time.

## Technologies Used

- **cheerio** - Fast HTML parsing and jQuery-like DOM manipulation
- **css-tree** - CSS parsing and AST manipulation for accurate color and font extraction
- **@mozilla/readability** - Content extraction for company information
- **jsdom** - DOM manipulation compatible with Readability
- **AI SDK** - Ready for future AI-enhanced analysis (installed but not yet used)

## What Gets Extracted

### 🎨 Design Tokens
1. **Colors**
   - Parses all CSS files (external and inline)
   - Extracts hex and rgb/rgba color values
   - Filters out common colors (white, black, very light grays)
   - Ranks by frequency to identify primary and secondary brand colors
   - Confidence scoring based on number of unique colors found

2. **Fonts**
   - Extracts `font-family` declarations from all CSS
   - Detects Google Fonts links
   - Filters out generic font families (sans-serif, serif, etc.)
   - Returns top 5 fonts with fallback to Inter, Roboto, Arial

### 🏢 Brand Assets
3. **Logo**
   - Searches using multiple selectors: `img[alt*="logo"]`, `.logo img`, `header img`, etc.
   - Falls back to Clearbit API if not found on page
   - Higher confidence score when found directly on page

4. **Favicon**
   - Checks `link[rel="icon"]`, `link[rel="shortcut icon"]`, etc.
   - Falls back to Google's favicon service
   - Always returns a value

### 📋 Company Information
5. **Company Name**
   - Extracts from `<title>` tag
   - Uses Open Graph title if available
   - Falls back to domain name extraction

6. **Company Description**
   - Uses Mozilla Readability for content extraction
   - Falls back to meta description
   - Provides voice/tone analysis from description

7. **Contact Information**
   - Email: Regex search prioritizing contact@, info@, hello@
   - Phone: US phone number pattern matching
   - Address: Pattern matching for US address format (Street, City, ST ZIP)

## Implementation Details

### File: `/src/app/api/scrape/route.ts`

#### Helper Functions
- `fetchCss(url)` - Fetches external CSS files with error handling
- `extractColorsFromCss(css)` - Parses CSS AST to extract colors
- `extractFonts($, cssContents)` - Extracts fonts from CSS and HTML
- `findLogo($, baseUrl)` - Searches for logo using multiple strategies
- `findFavicon($, baseUrl)` - Finds favicon with fallback
- `extractCompanyName(url)` - Extracts company name from URL

#### Main Function: `triggerCrawlerJob(jobId, url, saasCreatorId)`
1. Fetches the target webpage with User-Agent header
2. Loads HTML into cheerio for DOM manipulation
3. Extracts all CSS (external files + inline styles)
4. Fetches up to 5 external CSS files in parallel
5. Extracts colors, fonts, logo, favicon
6. Uses Readability for content extraction
7. Extracts contact information via regex
8. Calculates confidence scores for each data type
9. Stores results in database
10. Completes within 20-second timeout

## Confidence Scoring

Each extraction type gets a confidence score (0.0 - 1.0):

- **Logo**: 0.85 if found on page, 0.5 if using Clearbit fallback
- **Colors**: 0.8 if 3+ colors found, 0.5 otherwise
- **Fonts**: 0.75 if fonts found, 0.4 if using defaults
- **Company Info**: 0.7 if address found, 0.4 otherwise

These scores help the UI indicate data quality to users.

## Performance

- **Timeout**: 20 seconds maximum
- **CSS Limit**: Fetches only first 5 external CSS files to avoid delays
- **Parallel Processing**: CSS files fetched concurrently
- **Error Handling**: Graceful degradation with fallbacks

## Testing

A test script is provided at `/test-scraper.js` (not committed):

```bash
node test-scraper.js
```

This tests all scraping components with mock HTML/CSS.

## Usage

The scraper runs automatically when a user enters a URL in the onboarding flow:

1. User enters website URL at `/onboarding`
2. POST request to `/api/scrape` with the URL
3. Scraper job starts asynchronously
4. Status stored in database as "processing"
5. On completion, status updates to "completed" with extracted data
6. User sees data in Step 3 (Company Info Review)

## Future Enhancements

Potential improvements:

1. **AI Analysis** - Use AI SDK to analyze brand voice and tone more accurately
2. **Product Detection** - Extract product/service information from page content
3. **Caching** - Cache results for frequently scraped domains
4. **More Selectors** - Add more logo/favicon selectors for edge cases
5. **International Support** - Better address/phone parsing for non-US formats
6. **Image Analysis** - Use AI to verify logo quality and appropriateness

## Migration from Mock

### Before (Mock Implementation)
```typescript
// Simulated delay
await new Promise(resolve => setTimeout(resolve, delay));

// Hard-coded response
const mockCrawlerResponse = {
  logo_url: `https://logo.clearbit.com/${hostname}`,
  colors: { primary: "#1A73E8", secondary: "#F5F5F5" },
  fonts: ["Inter", "Roboto", "Arial"],
  // ... more mock data
};
```

### After (Real Scraper)
```typescript
// Fetch and parse actual webpage
const response = await fetch(url);
const html = await response.text();
const $ = cheerio.load(html);

// Extract real design tokens
const colors = extractColorsFromCss(cssContent);
const fonts = extractFonts($, cssContents);
const logo = findLogo($, url);
// ... real extraction
```

## Dependencies Added

```json
{
  "cheerio": "^1.0.0",
  "@mozilla/readability": "^0.5.0",
  "jsdom": "^25.0.0",
  "css-tree": "^3.0.0",
  "ai": "^4.0.0",
  "@ai-sdk/groq": "^1.0.0"
}
```

## Notes

- The scraper respects robots.txt should be considered for production
- Rate limiting should be implemented for production use
- Some websites may block scraping - handle gracefully
- CORS is not an issue since this runs server-side
- External CSS files are fetched with proper User-Agent headers

## Documentation Updated

- `ONBOARDING_REVAMP_README.md` - Updated crawler section
- `PRODUCTION_CRAWLER_INTEGRATION.md` - Added note about new implementation
