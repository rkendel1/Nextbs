import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";

/**
 * POST /api/scrape
 * Triggers the designtokens crawler to scrape brand data from a URL
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user?.email) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { url } = body;

    if (!url) {
      return NextResponse.json(
        { error: "URL is required" },
        { status: 400 }
      );
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      return NextResponse.json(
        { error: "Invalid URL format" },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { saasCreator: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Get or create SaaS creator profile
    let saasCreator = user.saasCreator;
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
        crawlStatus: "processing",
      },
    });

    // Trigger crawler service (async)
    // Note: In production, this would call the actual designtokens crawler service
    // For now, we'll simulate it with a background job
    triggerCrawlerJob(jobId, url, saasCreator.id).catch((error) => {
      console.error("Crawler job error:", error);
    });

    return NextResponse.json({
      success: true,
      jobId,
      message: "Crawler job started",
    });
  } catch (error: any) {
    console.error("Scrape API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start crawler" },
      { status: 500 }
    );
  }
}

/**
 * Simulated crawler job that would call the designtokens service
 * In production, this would be a separate background worker
 */
async function triggerCrawlerJob(jobId: string, url: string, saasCreatorId: string) {
  // Set a timeout of 20 seconds
  const TIMEOUT_MS = 20000;
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Crawler timeout")), TIMEOUT_MS)
  );

  const crawlPromise = (async () => {
    try {
      // Simulate API call delay (1-3 seconds)
      const delay = 1000 + Math.random() * 2000;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Simulated crawler response
      // In production, this would call: POST https://designtokens-service/api/crawl
      const mockCrawlerResponse = {
        logo_url: `https://logo.clearbit.com/${new URL(url).hostname}`,
        favicon_url: `https://www.google.com/s2/favicons?domain=${url}&sz=128`,
        colors: {
          primary: "#1A73E8",
          secondary: "#F5F5F5",
        },
        fonts: ["Inter", "Roboto", "Arial"],
        company_name: extractCompanyName(url),
        company_address: "123 Main Street, San Francisco, CA 94105",
        contact_info: {
          email: `contact@${new URL(url).hostname}`,
          phone: "+1 (555) 123-4567",
        },
        products: ["Starter", "Professional", "Enterprise"],
        voice: "Friendly and professional with a focus on innovation and customer success",
        confidence_scores: {
          logo: 0.85,
          colors: 0.9,
          fonts: 0.8,
          company_info: 0.75,
        },
      };

      // Store the crawl results
      await prisma.saasCreator.update({
        where: { id: saasCreatorId },
        data: {
          crawlStatus: "completed",
          crawlCompletedAt: new Date(),
          logoUrl: mockCrawlerResponse.logo_url,
          faviconUrl: mockCrawlerResponse.favicon_url,
          primaryColor: mockCrawlerResponse.colors.primary,
          secondaryColor: mockCrawlerResponse.colors.secondary,
          fonts: JSON.stringify(mockCrawlerResponse.fonts),
          businessName: mockCrawlerResponse.company_name || "Your Company",
          companyAddress: mockCrawlerResponse.company_address,
          contactInfo: JSON.stringify(mockCrawlerResponse.contact_info),
          productsParsed: JSON.stringify(mockCrawlerResponse.products),
          voiceAndTone: mockCrawlerResponse.voice,
          crawlConfidence: JSON.stringify(mockCrawlerResponse.confidence_scores),
        },
      });

      console.log(`Crawler job ${jobId} completed successfully`);
    } catch (error) {
      throw error;
    }
  })();

  try {
    // Race between crawl and timeout
    await Promise.race([crawlPromise, timeoutPromise]);
  } catch (error: any) {
    console.error(`Crawler job ${jobId} failed:`, error);
    
    // Update status to failed
    await prisma.saasCreator.update({
      where: { id: saasCreatorId },
      data: {
        crawlStatus: "failed",
      },
    }).catch(err => console.error("Failed to update crawl status:", err));
  }
}

/**
 * Extract company name from URL
 */
function extractCompanyName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return "Your Company";
  }
}
