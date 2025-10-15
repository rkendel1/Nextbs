import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import { Buffer } from "buffer";

interface FeelData {
  url: string;
  headings: string[];
  mainText: string;
  links: { href: string; text: string }[];
  images: { src: string; alt: string }[];
  colors: string[];
  fonts: string[];
  tone: string;
  spacingValues: string[];
  logos: { src: string; alt: string; type: string; }[];
}

export async function POST(request: NextRequest) {
  let saasCreator: any = null;
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Get or create SaaS creator profile
    saasCreator = user.saasCreator;
    if (!saasCreator) {
      saasCreator = await prisma.saasCreator.create({
        data: {
          userId: user.id,
          businessName: "Pending",
          website: url,
          onboardingStep: 1,
          crawlStatus: "pending",
        },
      });
    }

    // Generate a job ID for tracking
    const jobId = `crawl_${Date.now()}_${Math.random().toString(36).substring(7)}`;

    // Update SaaS creator with crawl job info
    await prisma.saasCreator.update({
      where: { id: saasCreator.id },
      data: {
        website: url,
        crawlJobId: jobId,
        crawlStatus: "queued",
      },
    });

    // Return immediately
    const response = NextResponse.json({
      success: true,
      jobId,
      message: "Crawl queued for background processing. You'll be notified when complete.",
    });

    // Background crawl
    (async () => {
      try {
        // Call brandmanager for crawl
        const bmUrl = process.env.BRANDMANAGER_URL || 'http://localhost:3030';
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 120000); // 2 min timeout

        const bmResponse = await fetch(`${bmUrl}/api/brand-manager/crawl`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!bmResponse.ok) {
          const errorData = await bmResponse.json().catch(() => ({ error: "Unknown error" }));
          throw new Error(errorData.message || `Brandmanager failed: ${bmResponse.statusText}`);
        }

        const bmData = await bmResponse.json();

        const logos = bmData.site?.logos || [];

        // Upsert ScrapedSite
        const scrapedSite = await prisma.scrapedSite.upsert({
          where: { saasCreatorId: saasCreator.id },
          update: {
            url,
            domain: bmData.site.domain,
            title: bmData.site.title,
            description: bmData.site.description,
            rawHtml: bmData.site.raw_html,
            logoUrls: JSON.stringify(logos.map((l: any) => l.src)),
            primaryLogo: logos[0]?.src || null,
            crawledAt: new Date(),
          },
          create: {
            saasCreatorId: saasCreator.id,
            url,
            domain: bmData.site.domain,
            title: bmData.site.title,
            description: bmData.site.description,
            rawHtml: bmData.site.raw_html,
            logoUrls: JSON.stringify(logos.map((l: any) => l.src)),
            primaryLogo: logos[0]?.src || null,
            crawledAt: new Date(),
          },
        });

        // Create or update CompanyInfo (delete old if exists)
        await prisma.companyInfo.deleteMany({ where: { scrapedSiteId: scrapedSite.id } });
        await prisma.companyInfo.create({
          data: {
            scrapedSiteId: scrapedSite.id,
            companyName: bmData.companyInfo.company_name || null,
            legalName: bmData.companyInfo.legal_name || null,
            contactEmails: bmData.companyInfo.contact_emails || [],
            contactPhones: bmData.companyInfo.contact_phones || [],
            addresses: bmData.companyInfo.addresses || [],
            structuredJson: {
              ...bmData.companyInfo,
              logoUrls: logos.map((l: any) => l.src),
              primaryLogo: logos[0]?.src || null,
            },
          },
        });

        // Screenshot as Bytes
        if (bmData.site.screenshot) {
          try {
            const screenshotBuffer = Buffer.from(bmData.site.screenshot, 'base64');
            await prisma.scrapedSite.update({
              where: { id: scrapedSite.id },
              data: { screenshot: screenshotBuffer },
            });
          } catch (e) {
            console.warn('Screenshot decode failed:', e);
          }
        }

        // Delete existing DesignTokens
        await prisma.designToken.deleteMany({ where: { scrapedSiteId: scrapedSite.id } });

        // Create DesignTokens from bmData.designTokens
        const designTokensData = bmData.designTokens.map((token: any) => ({
          scrapedSiteId: scrapedSite.id,
          tokenKey: token.token_key,
          tokenType: token.token_type,
          tokenValue: JSON.stringify(token.token_value),
          source: 'brandmanager',
          meta: token.meta || {},
        }));

        await prisma.designToken.createMany({ data: designTokensData });

        // Create BrandVoice
        await prisma.brandVoice.deleteMany({ where: { scrapedSiteId: scrapedSite.id } });
        await prisma.brandVoice.create({
          data: {
            scrapedSiteId: scrapedSite.id,
            summary: bmData.brandVoice.summary || null,
            guidelines: JSON.stringify({
              tone: bmData.brandVoice.tone,
              personality: bmData.brandVoice.personality || [],
              themes: bmData.brandVoice.themes || [],
            }),
          },
        });

        // Create ScrapedProducts if available
        if (bmData.companyInfo.products && Array.isArray(bmData.companyInfo.products)) {
          await prisma.scrapedProduct.deleteMany({ where: { scrapedSiteId: scrapedSite.id } });
          const productsData = bmData.companyInfo.products.map((p: any) => ({
            scrapedSiteId: scrapedSite.id,
            name: p.name,
            slug: p.slug,
            price: p.price,
            description: p.description,
            productUrl: p.product_url,
            metadata: p.metadata || {},
          }));
          await prisma.scrapedProduct.createMany({ data: productsData });
        }

        // Extract for FeelData adaptation
        const colors = designTokensData
          .filter((t: any) => t.tokenType === 'color')
          .slice(0, 5)
          .map((t: any) => t.tokenValue.replace(/"/g, ''));
        const fonts = designTokensData
          .filter((t: any) => t.tokenType === 'typography' || t.tokenType === 'font')
          .slice(0, 3)
          .map((t: any) => t.tokenValue.replace(/"/g, ''));
        const spacingValues = designTokensData
          .filter((t: any) => t.tokenType === 'spacing')
          .slice(0, 5)
          .map((t: any) => t.tokenValue.replace(/"/g, ''));
        const socialLinks = bmData.companyInfo.socialLinks || [];
        const links = socialLinks.map((s: any) => ({ href: s.url, text: s.platform }));

        const adaptedFeelData: FeelData = {
          url,
          headings: [],
          mainText: bmData.site.description || '',
          links,
          images: [],
          colors,
          fonts,
          tone: bmData.brandVoice.tone || 'neutral',
          spacingValues,
          logos: logos.slice(0, 3).map((l: any) => ({ src: l.src, alt: l.alt, type: l.type })),
        };

        // Update saasCreator
        const primaryColor = colors[0] || '#667eea';
        const secondaryColor = colors[1] || '#f5f5f5';

        await prisma.saasCreator.update({
          where: { id: saasCreator.id },
          data: {
            lightweightScrape: JSON.stringify(adaptedFeelData),
            deepDesignTokens: JSON.stringify(bmData),
            primaryColor,
            secondaryColor,
            primaryLogo: logos[0]?.src || null,
            crawlStatus: "completed",
            crawlCompletedAt: new Date(),
          },
        });

        console.log(`Background brandmanager crawl completed for job ${jobId}`);
      } catch (error) {
        console.error(`Background crawl failed for job ${jobId}:`, error);
        await prisma.saasCreator.update({
          where: { id: saasCreator.id },
          data: { crawlStatus: "failed" },
        });
      }
    })();

    return response;
  } catch (error: any) {
    console.error("Scrape API error:", error);
    // Update status to failed
    if (saasCreator) {
      await prisma.saasCreator.update({
        where: { id: saasCreator.id },
        data: { crawlStatus: "failed" },
      });
    }
    return NextResponse.json(
      { error: error.message || "Failed to integrate with BrandManager" },
      { status: 500 }
    );
  }
}