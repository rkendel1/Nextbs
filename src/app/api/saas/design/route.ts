import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import { SaasCreator } from '@prisma/client';
import { extractDesignTokens } from "@/utils/designTokenExtractor";

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
    const groupedTokens = designTokens.reduce((acc, token) => {
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
        socialLinks: companyInfo.structuredJson?.socialLinks || [],
      } : null,
      brandVoice: brandVoice ? {
        tone: brandVoice.guidelines ? JSON.parse(brandVoice.guidelines).tone : 'neutral',
        personality: brandVoice.guidelines ? JSON.parse(brandVoice.guidelines).personality : [],
        themes: brandVoice.guidelines ? JSON.parse(brandVoice.guidelines).themes : [],
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

    const body = await request.json();
    const { tokens, config } = body;

    if (!tokens || !config || typeof tokens !== 'object' || typeof config !== 'object') {
      return NextResponse.json({ error: "Tokens and config are required and must be objects" }, { status: 400 });
    }

    // Update WhiteLabelConfig
    await prisma.whiteLabelConfig.upsert({
      where: { saasCreatorId: user.saasCreator.id },
      update: {
        primaryColor: config.primaryColor ?? user.saasCreator.primaryColor ?? '#667eea',
        secondaryColor: config.secondaryColor ?? user.saasCreator.secondaryColor ?? '#f5f5f5',
        customCss: config.customCss ?? '',
        brandName: config.brandName ?? user.saasCreator.businessName ?? 'Your Brand',
        pageVisibility: config.pageVisibility ?? '{}',
      },
      create: {
        saasCreatorId: user.saasCreator.id,
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
      where: { saasCreatorId: user.saasCreator.id },
      orderBy: { version: "desc" },
    });

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    await prisma.designVersion.create({
      data: {
        saasCreatorId: user.saasCreator.id,
        version: newVersion,
        tokensJson: tokens,
        whiteLabelJson: config,
        isActive: true,
      },
    });

    // Deactivate previous versions
    await prisma.designVersion.updateMany({
      where: { saasCreatorId: user.saasCreator.id, isActive: true },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, version: newVersion });
  } catch (error: any) {
    console.error("Design POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST_rerun(request: NextRequest) {
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

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    // Trigger scrape
    const scrapeResponse = await fetch("http://localhost:3000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!scrapeResponse.ok) {
      const error = await scrapeResponse.json();
      return NextResponse.json({ error: error.error }, { status: scrapeResponse.status });
    }

    const scrapeResult = await scrapeResponse.json();
    const jobId = scrapeResult.jobId;

    // Poll for completion (max 60s)
    const maxWait = 60000;
    const pollInterval = 2000;
    let elapsed = 0;
    let saasCreator: SaasCreator | null = user.saasCreator;

    while (elapsed < maxWait) {
      saasCreator = await prisma.saasCreator.findUnique({
        where: { id: saasCreator!.id },
      });

      if (!saasCreator) {
        return NextResponse.json({ error: "SaaS creator not found during poll" }, { status: 404 });
      }

      if (saasCreator.crawlStatus === "completed") {
        break;
      }

      if (saasCreator.crawlStatus?.includes("failed")) {
        return NextResponse.json({ error: "Scrape failed" }, { status: 500 });
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
      elapsed += pollInterval;
    }

    if (!saasCreator || saasCreator.crawlStatus !== "completed") {
      return NextResponse.json({ error: "Scrape timeout - deep processing may still be running" }, { status: 408 });
    }

    const lightweight = saasCreator.lightweightScrape as any || {};
    const deep = saasCreator.deepDesignTokens as any || {};

    // Merge data
    const merged = {
      ...lightweight,
      ...deep,
      colors: Array.from(new Set([...(lightweight.colors || []), ...(Object.values(deep.majorColors || {}) as string[])]) ),
      fonts: Array.from(new Set([...(lightweight.fonts || []), ...(deep.majorFonts || [])]) ),
      spacingValues: Array.from(new Set([...(lightweight.spacingValues || []), ...(deep.spacingScale || [])]) ),
    };

    // Update SaasCreator with merged
    await prisma.saasCreator.update({
      where: { id: saasCreator.id },
      data: {
        mergedScrapeData: merged,
        fonts: JSON.stringify(merged.fonts),
        voiceAndTone: deep.brandVoice?.tone || lightweight.tone || 'neutral',
      },
    });

    // Derive tokens and config
    const primaryColor = saasCreator.primaryColor || deep.majorColors?.text || lightweight.colors?.[0] || '#667eea';
    const secondaryColor = saasCreator.secondaryColor || deep.majorColors?.background || lightweight.colors?.[1] || '#f5f5f5';
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
      where: { saasCreatorId: saasCreator.id },
      orderBy: { version: "desc" },
    });

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    const newDesignVersion = await prisma.designVersion.create({
      data: {
        saasCreatorId: saasCreator.id,
        version: newVersion,
        tokensJson,
        whiteLabelJson,
        isActive: true,
      },
    });

    // Deactivate previous versions
    await prisma.designVersion.updateMany({
      where: { 
        saasCreatorId: saasCreator.id, 
        id: { not: newDesignVersion.id },
        isActive: true 
      },
      data: { isActive: false },
    });

    // Upsert WhiteLabelConfig
    await prisma.whiteLabelConfig.upsert({
      where: { saasCreatorId: saasCreator.id },
      update: whiteLabelJson,
      create: {
        saasCreatorId: saasCreator.id,
        ...whiteLabelJson,
        isActive: true,
      },
    });

    return NextResponse.json({ success: true, version: newVersion, jobId });
  } catch (error: any) {
    console.error("Design rerun POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET_versions(request: NextRequest) {
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

    const versions = await prisma.designVersion.findMany({
      where: { saasCreatorId: user.saasCreator.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      versions: versions.map(v => ({
        id: v.id,
        version: v.version,
        createdAt: v.createdAt,
        isActive: v.isActive,
      })),
    });
  } catch (error: any) {
    console.error("Design versions GET error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST_revert(request: NextRequest) {
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
    const { versionId } = body;

    // Deactivate all versions
    await prisma.designVersion.updateMany({
      where: { saasCreatorId: saasCreator.id },
      data: { isActive: false },
    });

    // Activate selected version
    await prisma.designVersion.update({
      where: { id: versionId },
      data: { isActive: true },
    });

    // Update current config from version
    const version = await prisma.designVersion.findUnique({
      where: { id: versionId },
    });

    if (version) {
      const wlJson = version.whiteLabelJson;
      let primaryColor = saasCreator.primaryColor || '#667eea';
      let secondaryColor = saasCreator.secondaryColor || '#f5f5f5';
      let customCss = '';
      let brandName = saasCreator.businessName || '';
      let pageVisibility = '{}';

      if (wlJson && typeof wlJson === 'object') {
        const wl = wlJson as any;
        primaryColor = wl.primaryColor ?? primaryColor;
        secondaryColor = wl.secondaryColor ?? secondaryColor;
        customCss = wl.customCss ?? customCss;
        brandName = wl.brandName ?? brandName;
        pageVisibility = wl.pageVisibility ?? pageVisibility;
      }

      await prisma.whiteLabelConfig.upsert({
        where: { saasCreatorId: saasCreator.id },
        update: {
          primaryColor,
          secondaryColor,
          customCss,
          brandName,
          pageVisibility,
        },
        create: {
          saasCreatorId: saasCreator.id,
          primaryColor,
          secondaryColor,
          customCss,
          brandName,
          pageVisibility,
          isActive: true,
        },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Design revert POST error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}