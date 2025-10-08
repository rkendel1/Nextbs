import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import { BrandData } from "@/types/saas";

/**
 * GET /api/setup/prefill
 * Retrieves prefilled brand data from the crawler
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Find user with saasCreator data
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user || !user.saasCreator) {
      return NextResponse.json(
        { 
          success: false,
          crawlStatus: "not_started",
          message: "No crawl data available",
        },
        { status: 200 }
      );
    }

    const saasCreator = user.saasCreator;

    // Check crawl status
    if (saasCreator.crawlStatus === "processing" || saasCreator.crawlStatus === "pending") {
      return NextResponse.json({
        success: false,
        crawlStatus: saasCreator.crawlStatus,
        jobId: saasCreator.crawlJobId,
        message: "Crawl is still in progress",
      });
    }

    if (saasCreator.crawlStatus === "failed") {
      return NextResponse.json({
        success: false,
        crawlStatus: "failed",
        message: "Crawl failed - please enter information manually",
      });
    }

    // Parse JSON fields
    let fonts: string[] = [];
    let contactInfo: any = {};
    let products: string[] = [];
    let confidenceScores: any = {};

    try {
      if (saasCreator.fonts) fonts = JSON.parse(saasCreator.fonts);
      if (saasCreator.contactInfo) contactInfo = JSON.parse(saasCreator.contactInfo);
      if (saasCreator.productsParsed) products = JSON.parse(saasCreator.productsParsed);
      if (saasCreator.crawlConfidence) confidenceScores = JSON.parse(saasCreator.crawlConfidence);
    } catch (error) {
      console.error("Error parsing JSON fields:", error);
    }

    // Build BrandData response
    const brandData: BrandData = {
      logo_url: saasCreator.logoUrl || undefined,
      favicon_url: saasCreator.faviconUrl || undefined,
      colors: {
        primary: saasCreator.primaryColor || undefined,
        secondary: saasCreator.secondaryColor || undefined,
      },
      fonts: fonts.length > 0 ? fonts : undefined,
      company_name: saasCreator.businessName,
      company_address: saasCreator.companyAddress || undefined,
      contact_info: Object.keys(contactInfo).length > 0 ? contactInfo : undefined,
      products: products.length > 0 ? products : undefined,
      voice: saasCreator.voiceAndTone || undefined,
      confidence_scores: Object.keys(confidenceScores).length > 0 ? confidenceScores : undefined,
    };

    return NextResponse.json({
      success: true,
      crawlStatus: "completed",
      data: brandData,
      message: "Brand data retrieved successfully",
    });
  } catch (error: any) {
    console.error("Prefill API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to retrieve prefill data" },
      { status: 500 }
    );
  }
}
