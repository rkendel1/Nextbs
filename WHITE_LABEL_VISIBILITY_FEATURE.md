# White Label Page Visibility Feature

## Overview

The White Label Page Visibility feature allows SaaS creators to control the accessibility and discoverability of their white label pages. This gives creators flexibility in managing how their branded pages are accessed by the public.

## Visibility Options

### Public (Default)
- **Description**: Your white label page is fully accessible to everyone
- **Use Case**: When you want your branded page to be discoverable via search engines and accessible to all visitors
- **Behavior**: 
  - Pages are accessible via custom domain or subdomain
  - No restrictions on access
  - Can be indexed by search engines

### Unlisted
- **Description**: Your white label page is accessible via direct link but won't appear in search results
- **Use Case**: When you want to share your page with specific audiences without it being publicly discoverable
- **Behavior**:
  - Pages are accessible via custom domain or subdomain
  - No restrictions on access
  - Search engines are instructed not to index the page (via `noindex, nofollow` meta tags)
  - Useful for beta testing or limited releases

### Private
- **Description**: Your white label page is hidden and not accessible to anyone
- **Use Case**: When you want to temporarily disable your white label page or work on updates
- **Behavior**:
  - API returns a 403 Forbidden error
  - Pages cannot be accessed by anyone
  - Useful during maintenance or when setting up your configuration

## Implementation Details

### Database Schema

The `WhiteLabelConfig` model includes a `pageVisibility` field:

```prisma
model WhiteLabelConfig {
  // ... other fields
  pageVisibility  String      @default("public") // "public", "private", "unlisted"
  // ... other fields
}
```

### API Enforcement

The `/api/saas/whitelabel/creator-by-domain` endpoint checks the visibility setting:

```typescript
// Check visibility settings
if (whiteLabelConfig.pageVisibility === 'private') {
  return NextResponse.json(
    { error: "This white label page is currently private" },
    { status: 403 }
  );
}
```

### Frontend Implementation

All white label pages use Next.js Head component to add `noindex, nofollow` meta tags for unlisted pages:

```typescript
return (
  <>
    {creator?.whiteLabel?.pageVisibility === 'unlisted' && (
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
    )}
    <WhiteLabelLayout domain={domain}>
      {/* Page content */}
    </WhiteLabelLayout>
  </>
);
```

This ensures the meta tag is present in the initial render for better SEO compliance.

## Configuration UI

The visibility controls are available in the White Label Configuration dashboard at `/dashboard/white-label`:

1. Navigate to Dashboard → White Label Configuration
2. Scroll to the "Page Visibility" section
3. Select your desired visibility option:
   - **Public**: Fully accessible and searchable
   - **Unlisted**: Accessible but not indexed
   - **Private**: Completely hidden
4. Use the "Active" checkbox to enable/disable your entire white label configuration

## Migration

A database migration has been created to add the `pageVisibility` field to existing configurations:

```sql
-- AlterTable
ALTER TABLE "WhiteLabelConfig" ADD COLUMN "pageVisibility" TEXT NOT NULL DEFAULT 'public';
```

All existing configurations will default to "public" to maintain current behavior.

## API Response

The creator-by-domain API endpoint now includes the `pageVisibility` field in its response:

```json
{
  "creator": { ... },
  "whiteLabel": {
    "brandName": "...",
    "primaryColor": "...",
    "pageVisibility": "public",
    ...
  },
  "designTokens": { ... }
}
```

## Best Practices

1. **Use Public**: When your branded page is ready for production and you want maximum visibility
2. **Use Unlisted**: During beta testing or for invitation-only access
3. **Use Private**: During initial setup, maintenance, or when making significant changes

## Affected Pages

The following pages respect the visibility settings:
- Homepage: `/whitelabel/[domain]` and `/[domain]`
- Pricing: `/whitelabel/[domain]/pricing` and `/[domain]/pricing`
- Products: `/whitelabel/[domain]/products` and `/[domain]/products`
- All other white label pages

## Testing

To test the feature:

1. Set visibility to "Private" and verify the page returns a 403 error
2. Set visibility to "Unlisted" and verify:
   - The page is accessible via direct link
   - The `<meta name="robots" content="noindex, nofollow">` tag is present in the page head
3. Set visibility to "Public" and verify normal access

## Future Enhancements

Potential future improvements:
- Password protection for unlisted pages
- Time-based visibility scheduling
- Page-specific visibility controls (e.g., hide pricing but show products)
- Access analytics for unlisted pages
