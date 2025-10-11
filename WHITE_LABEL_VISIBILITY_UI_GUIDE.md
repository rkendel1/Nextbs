# White Label Visibility Feature - Visual Guide

## Dashboard UI Preview

The new Page Visibility section appears in the White Label Configuration dashboard (`/dashboard/white-label`), positioned between "Domain Settings" and "Advanced Customization".

### Page Visibility Section

```
┌────────────────────────────────────────────────────────────────┐
│ Page Visibility                                                 │
├────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Visibility Setting                                              │
│                                                                  │
│ ○ Public                                                        │
│   Your white label page is visible to everyone and can be      │
│   accessed via your domain.                                     │
│                                                                  │
│ ○ Unlisted                                                      │
│   Your white label page is accessible via direct link but      │
│   won't appear in search results.                              │
│                                                                  │
│ ○ Private                                                       │
│   Your white label page is hidden and will not be accessible   │
│   to anyone.                                                    │
│                                                                  │
│ ─────────────────────────────────────────────────────────────  │
│                                                                  │
│ ☑ Active                                                        │
│   Enable or disable your white label configuration entirely.   │
│                                                                  │
└────────────────────────────────────────────────────────────────┘
```

## Use Case Examples

### Example 1: Public Launch
**Setting**: Public ✓
**Result**: 
- Page accessible at `https://yourdomain.com`
- Appears in Google search results
- No restrictions

### Example 2: Beta Testing
**Setting**: Unlisted ✓
**Result**:
- Page accessible at `https://yourdomain.com`
- Will NOT appear in Google search results
- Perfect for sharing with beta testers
- Meta tag added: `<meta name="robots" content="noindex, nofollow">` (using Next.js Head for proper SEO)

### Example 3: Maintenance Mode
**Setting**: Private ✓
**Result**:
- Page returns HTTP 403 Forbidden
- Completely inaccessible to all visitors
- Useful during setup or major changes

## Technical Implementation

### Frontend (React Components)
```tsx
// Using Next.js Head component for SEO-friendly meta tags
{creator?.whiteLabel?.pageVisibility === 'unlisted' && (
  <Head>
    <meta name="robots" content="noindex, nofollow" />
  </Head>
)}
```

### Backend (API Response)
```json
{
  "whiteLabel": {
    "brandName": "My SaaS",
    "primaryColor": "#667eea",
    "pageVisibility": "public",
    ...
  }
}
```

### Database (Prisma Schema)
```prisma
model WhiteLabelConfig {
  pageVisibility  String  @default("public")
  // Values: "public", "private", "unlisted"
}
```

## Feature Highlights

✅ **Three visibility modes** - Public, Unlisted, and Private
✅ **SEO control** - Automatic noindex/nofollow meta tags for unlisted pages  
✅ **API enforcement** - Private pages return 403 Forbidden
✅ **Backwards compatible** - All existing configs default to "public"
✅ **Simple UI** - Clear radio buttons with helpful descriptions
✅ **Database migration** - Seamless upgrade path

## Testing Checklist

- [ ] Public mode allows normal access
- [ ] Unlisted mode adds noindex meta tag
- [ ] Private mode returns 403 error
- [ ] Settings persist after save
- [ ] UI updates correctly on load
- [ ] All white label pages respect the setting

## Related Files

**Frontend Components:**
- `/src/components/WhiteLabel/index.tsx` - Configuration UI
- `/src/app/whitelabel/[domain]/page.tsx` - White label homepage
- `/src/app/[domain]/page.tsx` - Alternate homepage
- `/src/app/[domain]/pricing/page.tsx` - Pricing page
- `/src/app/[domain]/products/page.tsx` - Products page

**Backend APIs:**
- `/src/app/api/saas/white-label/route.ts` - CRUD operations
- `/src/app/api/saas/whitelabel/creator-by-domain/route.ts` - Public access check

**Database:**
- `/prisma/schema.prisma` - Schema definition
- `/prisma/migrations/.../migration.sql` - Migration file

**Types:**
- `/src/types/saas.ts` - TypeScript interfaces
