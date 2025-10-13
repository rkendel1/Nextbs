import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import { extractDesignTokens } from "@/utils/designTokenExtractor";

export async function GET(request: NextRequest) {
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
    const versions = await prisma.designVersion.findMany({
      where: { saasCreatorId: saasCreator.id },
      orderBy: { createdAt: "desc" },
    });

    const currentVersion = versions.find(v => v.isActive) || versions[0];

    let currentTokens;
    if (saasCreator.website) {
      currentTokens = await extractDesignTokens(saasCreator.website);
    } else {
      currentTokens = {
        primaryColor: saasCreator.primaryColor || '#667eea',
        secondaryColor: saasCreator.secondaryColor || '#f5f5f5',
        fonts: [],
        logoUrl: '',
        faviconUrl: '',
        companyName: saasCreator.businessName || 'Your Company',
        confidenceScores: { logo: 0.1, colors: 0.1, fonts: 0.1 },
      };
    }
    const currentConfig = await prisma.whiteLabelConfig.findUnique({
      where: { saasCreatorId: saasCreator.id },
    });

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

    // Update WhiteLabelConfig
    await prisma.whiteLabelConfig.upsert({
      where: { saasCreatorId: user.saasCreator.id },
      update: {
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        customCss: config.customCss,
        brandName: config.brandName,
        pageVisibility: config.pageVisibility,
      },
      create: {
        saasCreatorId: user.saasCreator.id,
        primaryColor: config.primaryColor,
        secondaryColor: config.secondaryColor,
        customCss: config.customCss,
        brandName: config.brandName,
        pageVisibility: config.pageVisibility,
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

    // Trigger scrape
    const scrapeResponse = await fetch("/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });

    if (!scrapeResponse.ok) {
      const error = await scrapeResponse.json();
      return NextResponse.json({ error: error.error }, { status: scrapeResponse.status });
    }

    // Create new version after scrape completes (simple, no async wait)
    const latestVersion = await prisma.designVersion.findFirst({
      where: { saasCreatorId: user.saasCreator.id },
      orderBy: { version: "desc" },
    });

    const newVersion = latestVersion ? latestVersion.version + 1 : 1;

    await prisma.designVersion.create({
      data: {
        saasCreatorId: user.saasCreator.id,
        version: newVersion,
        tokensJson: {}, // Will be updated after scrape
        whiteLabelJson: {}, // Will be updated after scrape
        isActive: true,
      },
    });

    // Deactivate previous
    await prisma.designVersion.updateMany({
      where: { saasCreatorId: user.saasCreator.id, isActive: true },
      data: { isActive: false },
    });

    return NextResponse.json({ success: true, version: newVersion, jobId: body.jobId });
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