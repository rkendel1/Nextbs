# Quick Start Guide - New Onboarding Flow

## 🚀 What Changed?

The onboarding experience is now a **3-step magic flow** instead of the old 4-5 step form-heavy process.

---

## ✨ The New Experience

### Step 1: Enter URL (10 seconds)
```
┌─────────────────────────────────┐
│  Paste your website URL         │
│  https://your-site.com          │
│  [Continue] →                   │
└─────────────────────────────────┘
```
🪄 **Magic happens**: Crawler starts in background

---

### Step 2: Connect Stripe (1-2 minutes)
```
┌─────────────────────────────────┐
│  [Connect with Stripe] 🔵       │
│                                 │
│  While you connect, we're       │
│  fetching your brand info...    │
└─────────────────────────────────┘
```
⚡ **Behind the scenes**: Brand data being collected

---

### Step 3: Review & Go (30-60 seconds)
```
┌─────────────────────────────────┐
│  ✨ PRE-FILLED FOR YOU:         │
│                                 │
│  Logo:    [Your Logo] ✏️        │
│  Colors:  🟦 🔲 ✏️              │
│  Name:    Your Company ✏️       │
│  Address: 123 Main St ✏️        │
│  Email:   hi@you.com ✏️         │
│                                 │
│  [Complete Setup] →             │
└─────────────────────────────────┘
```
🎉 **Done!** Everything auto-filled, ready to review

---

## 📝 Developer Checklist

### Before You Start
- [ ] Pull the latest code from `copilot/revamp-onboarding-flow` branch
- [ ] Read `ONBOARDING_REVAMP_README.md` for overview
- [ ] Review `FLOW_DIAGRAM.md` for visual understanding

### Setup (5 minutes)
```bash
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Run database migration
npx prisma migrate dev --name add_brand_data_fields

# 4. Start dev server
npm run dev
```

### Test It Out (3 minutes)
1. Navigate to `/onboarding`
2. Enter any URL (e.g., `https://example.com`)
3. See the magic toast: "🪄 Preparing your workspace…"
4. Click through Stripe (or skip)
5. See pre-filled data in Step 3
6. Try editing fields
7. Complete setup

### Production Setup (When Ready)
```bash
# Add to .env
DESIGNTOKENS_CRAWLER_URL=https://your-crawler-service.com
DESIGNTOKENS_API_KEY=your-api-key-here
```

Then follow `PRODUCTION_CRAWLER_INTEGRATION.md`

---

## 📚 Documentation Quick Reference

| Need to... | Read this |
|------------|-----------|
| Understand the feature | `ONBOARDING_REVAMP_README.md` |
| See the flow visually | `FLOW_DIAGRAM.md` |
| Set up production | `PRODUCTION_CRAWLER_INTEGRATION.md` |
| Compare old vs new | `BEFORE_AFTER_COMPARISON.md` |
| Get project stats | `ONBOARDING_IMPLEMENTATION_SUMMARY.md` |

---

## 🎯 Key Files to Know

### Frontend
```
src/components/SaasOnboarding/
├── BusinessInfoStep.tsx         ← Now URL-only entry
├── StripeConnectStep.tsx        ← Enhanced messages
├── CompanyInfoReviewStep.tsx    ← NEW! Step 3
└── index.tsx                    ← Updated flow
```

### Backend
```
src/app/api/
├── scrape/route.ts              ← NEW! Crawler trigger
├── setup/prefill/route.ts       ← NEW! Data retrieval
└── saas/onboarding/route.ts     ← Enhanced with brand data
```

### Schema
```
prisma/
├── schema.prisma                ← 13 new SaasCreator fields
└── migrations/
    └── add_brand_data_fields.sql
```

---

## ⚡ Quick Commands

### Development
```bash
# Start dev server
npm run dev

# Check types
npm run build

# Lint files
npm run lint

# Generate Prisma client
npx prisma generate
```

### Database
```bash
# Run migrations
npx prisma migrate dev

# Open Prisma Studio
npx prisma studio

# Reset database (careful!)
npx prisma migrate reset
```

---

## 🐛 Troubleshooting

### Build Errors
**Problem**: TypeScript errors  
**Solution**: Run `npm install && npx prisma generate`

**Problem**: Duplicate route error  
**Solution**: Already fixed - duplicate `pricing/page.tsx` removed

### Runtime Errors
**Problem**: Crawler not working  
**Solution**: Check that mock crawler is running (it's automatic in dev)

**Problem**: No prefill data  
**Solution**: Check database - crawler writes to `SaasCreator` table

### Database Issues
**Problem**: Column doesn't exist  
**Solution**: Run migration: `npx prisma migrate dev --name add_brand_data_fields`

**Problem**: Can't connect to database  
**Solution**: Check `DATABASE_URL` in `.env`

---

## 🎨 What Users Will See

### Toast Messages
1. On URL submit: **"🪄 Preparing your workspace…"**
2. After Stripe: **"Nice! While you were connecting Stripe, we fetched your brand and company info."**
3. On Step 3: **"✨ We matched your brand automatically — ready to review?"**

### Visual Elements
- Brand logo preview
- Color swatches (primary/secondary)
- Edit icons on all fields
- Confidence scores
- Voice & tone description
- Fallback messaging if crawler fails

---

## 📊 Success Metrics to Track

### User Metrics
- [ ] Onboarding completion rate
- [ ] Time to complete onboarding
- [ ] Edit rate (how many fields users change)
- [ ] Crawler success rate

### Technical Metrics
- [ ] API response times
- [ ] Crawler job success/failure ratio
- [ ] Timeout frequency
- [ ] Error rates

---

## 🚦 Status Indicators

### Crawler Status States
- `pending` - Not started yet
- `processing` - Currently running
- `completed` - Success! Data available
- `failed` - Error occurred, fallback to manual

### How to Check Status
```typescript
// In browser console
fetch('/api/setup/prefill')
  .then(r => r.json())
  .then(d => console.log('Crawler status:', d.crawlStatus))
```

---

## 🎓 Learning Resources

### New to the Codebase?
1. Start with `ONBOARDING_REVAMP_README.md`
2. Look at `FLOW_DIAGRAM.md` for visual understanding
3. Read the component code (well-commented)
4. Try it yourself in the browser

### Want to Modify It?
1. Review `PRODUCTION_CRAWLER_INTEGRATION.md` for API structure
2. Check TypeScript types in `src/types/saas.ts`
3. Look at database schema in `prisma/schema.prisma`
4. Follow existing patterns in the code

---

## ✅ Final Checklist

Before marking as complete:
- [ ] Code pulled and running locally
- [ ] Database migrated
- [ ] Tested onboarding flow end-to-end
- [ ] Reviewed documentation
- [ ] Understood the 3-step flow
- [ ] Tested error scenarios
- [ ] Ready to deploy (or know what's needed)

---

## 🆘 Need Help?

1. **Check the docs** - 5 comprehensive guides available
2. **Review the code** - Well-commented and structured
3. **Test locally** - Run through the flow yourself
4. **Ask questions** - File an issue or reach out

---

## 🎉 You're Ready!

The new onboarding flow is:
- ✅ Implemented
- ✅ Documented
- ✅ Tested (code-level)
- ✅ Ready for review

**Next Steps:**
1. Review the PR
2. Test in your environment
3. Provide feedback
4. Deploy when ready!

---

*Happy onboarding! 🚀*
