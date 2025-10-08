/**
 * Production Crawler Integration Example
 * 
 * This file shows how to integrate the actual rkendel1/designtokens crawler service
 * Replace the mock implementation in /api/scrape/route.ts with this code
 */

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

    // PRODUCTION: Call the actual designtokens crawler service
    triggerProductionCrawler(jobId, url, saasCreator.id).catch((error) => {
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
 * PRODUCTION CRAWLER INTEGRATION
 * 
 * This function calls the actual rkendel1/designtokens crawler service
 */
async function triggerProductionCrawler(jobId: string, url: string, saasCreatorId: string) {
  // Get crawler service URL from environment
  const CRAWLER_SERVICE_URL = process.env.DESIGNTOKENS_CRAWLER_URL || 'https://designtokens-service.example.com';
  const CRAWLER_API_KEY = process.env.DESIGNTOKENS_API_KEY;
  const TIMEOUT_MS = 20000; // 20 seconds

  try {
    // Call the designtokens crawler service
    const response = await fetch(`${CRAWLER_SERVICE_URL}/api/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CRAWLER_API_KEY && { 'Authorization': `Bearer ${CRAWLER_API_KEY}` }),
      },
      body: JSON.stringify({
        url: url,
        user_id: saasCreatorId,
        job_id: jobId,
        options: {
          extract_logo: true,
          extract_favicon: true,
          extract_colors: true,
          extract_fonts: true,
          extract_company_info: true,
          extract_products: true,
          analyze_voice: true,
          timeout: TIMEOUT_MS,
        }
      }),
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Crawler service returned ${response.status}`);
    }

    const crawlerData = await response.json();

    // Map crawler response to our schema
    // Adjust field mapping based on actual crawler API response
    const mappedData = {
      logo_url: crawlerData.assets?.logo || crawlerData.logo_url,
      favicon_url: crawlerData.assets?.favicon || crawlerData.favicon_url,
      colors: {
        primary: crawlerData.design_tokens?.colors?.primary || crawlerData.primary_color,
        secondary: crawlerData.design_tokens?.colors?.secondary || crawlerData.secondary_color,
      },
      fonts: crawlerData.design_tokens?.fonts || crawlerData.fonts || [],
      company_name: crawlerData.company?.name || crawlerData.company_name,
      company_address: crawlerData.company?.address || crawlerData.address,
      contact_info: {
        email: crawlerData.contact?.email || crawlerData.email,
        phone: crawlerData.contact?.phone || crawlerData.phone,
      },
      products: crawlerData.products || [],
      voice: crawlerData.brand_analysis?.voice || crawlerData.voice,
      confidence_scores: crawlerData.confidence || crawlerData.confidence_scores || {},
    };

    // Store the crawl results in database
    await prisma.saasCreator.update({
      where: { id: saasCreatorId },
      data: {
        crawlStatus: "completed",
        crawlCompletedAt: new Date(),
        logoUrl: mappedData.logo_url,
        faviconUrl: mappedData.favicon_url,
        primaryColor: mappedData.colors.primary,
        secondaryColor: mappedData.colors.secondary,
        fonts: JSON.stringify(mappedData.fonts),
        businessName: mappedData.company_name || "Your Company",
        companyAddress: mappedData.company_address,
        contactInfo: JSON.stringify(mappedData.contact_info),
        productsParsed: JSON.stringify(mappedData.products),
        voiceAndTone: mappedData.voice,
        crawlConfidence: JSON.stringify(mappedData.confidence_scores),
      },
    });

    console.log(`Crawler job ${jobId} completed successfully`);

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
 * ALTERNATIVE: Webhook-based Integration
 * 
 * If the crawler service supports webhooks, use this approach instead:
 */
async function triggerCrawlerWithWebhook(jobId: string, url: string, saasCreatorId: string) {
  const CRAWLER_SERVICE_URL = process.env.DESIGNTOKENS_CRAWLER_URL;
  const CRAWLER_API_KEY = process.env.DESIGNTOKENS_API_KEY;
  const WEBHOOK_URL = `${process.env.SITE_URL}/api/webhooks/crawler`;

  try {
    // Submit job to crawler with webhook callback
    const response = await fetch(`${CRAWLER_SERVICE_URL}/api/crawl`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(CRAWLER_API_KEY && { 'Authorization': `Bearer ${CRAWLER_API_KEY}` }),
      },
      body: JSON.stringify({
        url: url,
        job_id: jobId,
        webhook_url: WEBHOOK_URL,
        webhook_secret: process.env.CRAWLER_WEBHOOK_SECRET,
      }),
    });

    const result = await response.json();
    
    console.log(`Crawler job ${jobId} submitted, webhook will be called when complete`);
    
    // The crawler will POST to /api/webhooks/crawler when done
    // See example webhook handler below

  } catch (error) {
    console.error(`Failed to submit crawler job ${jobId}:`, error);
    
    await prisma.saasCreator.update({
      where: { id: saasCreatorId },
      data: { crawlStatus: "failed" },
    }).catch(err => console.error("Failed to update status:", err));
  }
}

/**
 * WEBHOOK HANDLER EXAMPLE
 * 
 * Create this file: /api/webhooks/crawler/route.ts
 */
/*
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prismaDB";
import crypto from "crypto";

export async function POST(request: NextRequest) {
  try {
    // Verify webhook signature
    const signature = request.headers.get('x-crawler-signature');
    const secret = process.env.CRAWLER_WEBHOOK_SECRET;
    
    const body = await request.text();
    const expectedSignature = crypto
      .createHmac('sha256', secret!)
      .update(body)
      .digest('hex');
    
    if (signature !== expectedSignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const payload = JSON.parse(body);
    
    // Process crawler results
    const { job_id, status, data, error } = payload;
    
    // Find SaaS creator by job ID
    const saasCreator = await prisma.saasCreator.findFirst({
      where: { crawlJobId: job_id }
    });
    
    if (!saasCreator) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    
    if (status === 'completed' && data) {
      // Store results
      await prisma.saasCreator.update({
        where: { id: saasCreator.id },
        data: {
          crawlStatus: "completed",
          crawlCompletedAt: new Date(),
          logoUrl: data.logo_url,
          faviconUrl: data.favicon_url,
          // ... map other fields
        },
      });
    } else {
      // Mark as failed
      await prisma.saasCreator.update({
        where: { id: saasCreator.id },
        data: { crawlStatus: "failed" },
      });
    }
    
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
*/

/**
 * ENVIRONMENT VARIABLES REQUIRED
 * 
 * Add these to your .env file:
 * 
 * # DesignTokens Crawler Service
 * DESIGNTOKENS_CRAWLER_URL=https://designtokens-service.example.com
 * DESIGNTOKENS_API_KEY=your-api-key-here
 * 
 * # For webhook-based integration
 * CRAWLER_WEBHOOK_SECRET=your-webhook-secret
 * SITE_URL=https://your-app.com
 */

/**
 * TESTING THE INTEGRATION
 * 
 * 1. Start your app: npm run dev
 * 2. Navigate to /onboarding
 * 3. Enter a test URL
 * 4. Check console logs for crawler requests
 * 5. Verify data appears in Step 3
 * 
 * For debugging:
 * - Check network tab for API calls
 * - Verify crawler service is accessible
 * - Check database for stored results
 * - Review server logs for errors
 */
