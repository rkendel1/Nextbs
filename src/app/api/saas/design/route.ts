import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import { SaasCreator, DesignToken } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { 
        saasCreator: {
          include: {
            scrapedSite: {
              include: {
                companyInfo: true,
                brandVoice: true,
                designTokens: true,
              },
            },
          },
        },
      },
    });

    if (!user || !user.saasCreator) {
      return NextResponse.json({ error: "SaaS creator profile not found" }, { status: 404 });
    }

    const saasCreator = user.saasCreator;
    const scrapedSite = saasCreator.scrapedSite;
    const companyInfo = scrapedSite?.companyInfo;
    const brandVoice = scrapedSite?.brandVoice;
    const designTokens = scrapedSite?.designTokens || [];

    // Group tokens by type
    const groupedTokens = designTokens.reduce((acc: Record<string, DesignToken[]>, token) => {
      const type = token.tokenType;
      if (!acc[type]) acc[type] = [];
      acc[type].push(token);
      return acc;
    }, {});

    const currentVersion = await prisma.designVersion.findFirst({
      where: { saasCreatorId: saasCreator.id, isActive: true },
    });

    const versions = await prisma.designVersion.findMany({
      where: { saasCreatorId: saasCreator.id },
      orderBy: { createdAt: "desc" },
    });

    const currentConfig = await prisma.whiteLabelConfig.findUnique({
      where: { saasCreatorId: saasCreator.id },
    });

    const currentTokens = {
      primaryColor: saasCreator.primaryColor || '#667eea',
      secondaryColor: saasCreator.secondaryColor || '#f5f5f5',
      fonts: saasCreator.fonts ? JSON.parse(saasCreator.fonts) : [],
      logoUrl: saasCreator.logoUrl || '',
      faviconUrl: saasCreator.faviconUrl || '',
      companyName: companyInfo?.companyName || saasCreator.businessName || 'Your Company',
      confidenceScores: { logo: 0.1, colors: 0.1, fonts: 0.1 },
      groupedTokens,
      companyInfo: companyInfo ? {
        name: companyInfo.companyName,
        emails: companyInfo.contactEmails,
        phones: companyInfo.contactPhones,
        socialLinks: (companyInfo.structuredJson as any)?.socialLinks || [],
      } : null,
      brandVoice: brandVoice ? {
        tone: typeof brandVoice.guidelines === 'string' ? (JSON.parse(brandVoice.guidelines).tone || 'neutral') : 'neutral',
        personality: typeof brandVoice.guidelines === 'string' ? (JSON.parse(brandVoice.guidelines).personality || []) : [],
        themes: typeof brandVoice.guidelines === 'string' ? (JSON.parse(brandVoice.guidelines).themes || []) : [],
        summary: brandVoice.summary,
      } : null,
    };

    return NextResponse.json({
      currentTokens,
      currentConfig,
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        createdAt: v.createdAt,
        isActive: v.isActive,
      })),
    });
  } catch (error: any) {
    console.error("Design GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user || !user.saasCreator) {
      return NextResponse.json({ error: "SaaS creator profile not found" }, { status: 404 });
    }

    const saasCreator = user.saasCreator;
    const body = await request.json();

    if (body.action === 'rerun') {
      const url = body.url || saasCreator.website;
      if (!url) {
        return NextResponse.json({ error: "URL is required" }, { status: 400 });
      }

      // Trigger scrape with forwarded auth - must use absolute URL for server-side fetch
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      const scrapeResponse = await fetch(`${baseUrl}/api/scrape`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Cookie": request.headers.get("cookie") || ""
        },
        body: JSON.stringify({ url }),
      });

      if (!scrapeResponse.ok) {
        const error = await scrapeResponse.json().catch(() => ({}));
        return NextResponse.json({ error: error.error || "Scrape failed" }, { status: scrapeResponse.status });
      }

      const scrapeResult = await scrapeResponse.json();
      const jobId = scrapeResult.jobId;

      // Poll for completion (max 60s)
      const maxWait = 60000;
      const pollInterval = 2000;
      let elapsed = 0;
      let currentSaasCreator: SaasCreator | null = saasCreator;

      while (elapsed < maxWait) {
        currentSaasCreator = await prisma.saasCreator.findUnique({
          where: { id: currentSaasCreator!.id },
        });

        if (!currentSaasCreator) {
          return NextResponse.json({ error: "SaaS creator not found during poll" }, { status: 404 });
        }

        if (currentSaasCreator.crawlStatus === "completed") {
          break;
        }

        if (currentSaasCreator.crawlStatus?.includes("failed")) {
          return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
        }

        await new Promise(resolve => setTimeout(resolve, pollInterval));
        elapsed += pollInterval;
      }

      if (!currentSaasCreator || currentSaasCreator.crawlStatus !== "completed") {
        return NextResponse.json({ error: "Scrape timeout - deep processing may still be running" }, { status: 408 });
      }

      const lightweight = currentSaasCreator.lightweightScrape as any || {};
      const deep = currentSaasCreator.deepDesignTokens as any || {};

      // Merge data safely
      const safeFonts = Array.isArray(deep.majorFonts) ? deep.majorFonts : [];
      const safeSpacing = Array.isArray(deep.spacingScale) ? deep.spacingScale : [];
      const safeLightFonts = Array.isArray(lightweight.fonts) ? lightweight.fonts : [];
      const safeLightSpacing = Array.isArray(lightweight.spacingValues) ? lightweight.spacingValues : [];

      const merged = {
        ...lightweight,
        ...deep,
        colors: Array.from(new Set([...(lightweight.colors || []), ...(Object.values(deep.majorColors || {}) as string[])])),
        fonts: Array.from(new Set([...safeLightFonts, ...safeFonts])),
        spacingValues: Array.from(new Set([...safeLightSpacing, ...safeSpacing])),
      };

      // Update SaasCreator with merged
      await prisma.saasCreator.update({
        where: { id: currentSaasCreator.id },
        data: {
          mergedScrapeData: merged,
          fonts: JSON.stringify(merged.fonts),
          voiceAndTone: deep.brandVoice?.tone || lightweight.tone || 'neutral',
        },
      });

      // Derive tokens and config
      const primaryColor = currentSaasCreator.primaryColor || deep.majorColors?.text || lightweight.colors?.[0] || '#667eea';
      const secondaryColor = currentSaasCreator.secondaryColor || deep.majorColors?.background || lightweight.colors?.[1] || '#f5f5f5';
      const brandName = lightweight.headings?.[0] || deep.brandVoice?.personality?.[0] || 'Your Brand';
      const customCss = `:root { --primary: ${primaryColor}; --secondary: ${secondaryColor}; font-family: ${(merged.fonts || []).join(', ') || 'sans-serif'}; }`;

      const tokensJson = {
        primaryColor,
        secondaryColor,
        fonts: merged.fonts,
        logoUrl: (lightweight.images || [])[0]?.src || '',
        faviconUrl: '',
        companyName: brandName,
        designTokens: deep.designTokens || [],
        screenshot: deep.screenshot || '',
        confidenceScores: { logo: 0.5, colors: 0.8, fonts: 0.7 }, // Placeholder
        ...Object.fromEntries((deep.designTokens || []).map((t: any) => [t.tokenKey, t.tokenValue])),
      };

      const whiteLabelJson = {
        primaryColor,
        secondaryColor,
        customCss,
        brandName,
        pageVisibility: '{}',
      };

      // Create new version
      const latestVersion = await prisma.designVersion.findFirst({
        where: { saasCreatorId: currentSaasCreator.id },
        orderBy: { version: "desc" },
      });

      const newVersion = latestVersion ? latestVersion.version + 1 : 1;

      const newDesignVersion = await prisma.designVersion.create({
        data: {
          saasCreatorId: currentSaasCreator.id,
          version: newVersion,
          tokensJson,
          whiteLabelJson,
          isActive: true,
        },
      });

      // Deactivate previous versions
      await prisma.designVersion.updateMany({
        where: { 
          saasCreatorId: currentSaasCreator.id, 
          id: { not: newDesignVersion.id },
          isActive: true 
        },
        data: { isActive: false },
      });

      // Upsert WhiteLabelConfig
      await prisma.whiteLabelConfig.upsert({
        where: { saasCreatorId: currentSaasCreator.id },
        update: whiteLabelJson,
        create: {
          saasCreatorId: currentSaasCreator.id,
          ...whiteLabelJson,
          isActive: true,
        },
      });

      return NextResponse.json({ success: true, version: newVersion, jobId });
    } else if (body.action === 'update-logo') {
      const { logoData } = body;
      if (!logoData || typeof logoData !== 'string') {
        return NextResponse.json({ error: "Valid logo data (base64) is required" }, { status: 400 });
      }

      await prisma.saasCreator.update({
        where: { id: saasCreator.id },
        data: { logoUrl: logoData },
      });

      return NextResponse.json({ success: true });
    } else {
      const { tokens, config } = body;

      if (!tokens || !config || typeof tokens !== 'object' || typeof config !== 'object') {
        return NextResponse.json({ error: "Tokens and config are required and must be objects" }, { status: 400 });
      }

      // Update WhiteLabelConfig
      await prisma.whiteLabelConfig.upsert({
        where: { saasCreatorId: saasCreator.id },
        update: {
          primaryColor: config.primaryColor ?? saasCreator.primaryColor ?? '#667eea',
          secondaryColor: config.secondaryColor ?? saasCreator.secondaryColor ?? '#f5f5f5',
          customCss: config.customCss ?? '',
          brandName: config.brandName ?? saasCreator.businessName ?? 'Your Brand',
          pageVisibility: config.pageVisibility ?? '{}',
        },
        create: {
          saasCreatorId: saasCreator.id,
          primaryColor: config.primaryColor ?? '#667eea',
          secondaryColor: config.secondaryColor ?? '#f5f5f5',
          customCss: config.customCss ?? '',
          brandName: config.brandName ?? 'Your Brand',
          pageVisibility: config.pageVisibility ?? '{}',
          isActive: true,
        },
      });

      // Create new design version
      const latestVersion = await prisma.designVersion.findFirst({
        where: { saasCreatorId: saasCreator.id },
        orderBy: { version: "desc" },
      });

      const newVersion = latestVersion ? latestVersion.version + 1 : 1;

      await prisma.designVersion.create({
        data: {
          saasCreatorId: saasCreator.id,
          version: newVersion,
          tokensJson: tokens,
          whiteLabelJson: config,
          isActive: true,
        },
      });

      // Deactivate previous versions
      await prisma.designVersion.updateMany({
        where: { saasCreatorId: saasCreator.id, isActive: true },
        data: { isActive: false },
      });

      return NextResponse.json({ success: true, version: newVersion });
    }
  } catch (error: any) {
    console.error("Design POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}