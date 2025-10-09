import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as csstree from "css-tree";
import type { Declaration } from "css-tree";

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

    // Trigger crawler job (async)
    // This now performs actual web scraping to extract design tokens
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
 * Helper to fetch CSS content from a URL
 */
async function fetchCss(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    if (!response.ok) return "";
    return await response.text();
  } catch (error) {
    console.error(`Failed to fetch CSS from ${url}:`, error);
    return "";
  }
}

/**
 * Extract colors from CSS using css-tree
 */
function extractColorsFromCss(cssContent: string): string[] {
  const colors = new Set<string>();
  
  try {
    const ast = csstree.parse(cssContent);
    
    csstree.walk(ast, {
      visit: 'Declaration',
      enter(node) {
        const decl = node as Declaration;
        const value = csstree.generate(decl.value);
        
        // Match hex colors
        const hexMatches = value.match(/#[0-9a-fA-F]{3,8}/g);
        if (hexMatches) {
          hexMatches.forEach(color => colors.add(color.toUpperCase()));
        }
        
        // Match rgb/rgba colors
        const rgbMatches = value.match(/rgba?\([^)]+\)/g);
        if (rgbMatches) {
          rgbMatches.forEach(color => colors.add(color));
        }
      }
    });
  } catch (error) {
    console.error("Error parsing CSS:", error);
  }
  
  return Array.from(colors);
}

/**
 * Extract fonts from CSS and HTML
 */
function extractFonts($: cheerio.CheerioAPI, cssContents: string[]): string[] {
  const fonts = new Set<string>();
  
  // Extract from CSS
  cssContents.forEach(css => {
    try {
      const ast = csstree.parse(css);
      csstree.walk(ast, {
        visit: 'Declaration',
        enter(node) {
          const decl = node as Declaration;
          if (decl.property === 'font-family') {
            const value = csstree.generate(decl.value);
            // Extract font names, removing quotes and generic families
            const fontNames = value.split(',').map(f => f.trim().replace(/['"]/g, ''));
            fontNames.forEach(font => {
              if (!['sans-serif', 'serif', 'monospace', 'cursive', 'fantasy', 'system-ui'].includes(font.toLowerCase())) {
                fonts.add(font);
              }
            });
          }
        }
      });
    } catch (error) {
      console.error("Error parsing CSS for fonts:", error);
    }
  });
  
  // Extract from Google Fonts links
  $('link[href*="fonts.googleapis.com"]').each((_, elem) => {
    const href = $(elem).attr('href');
    if (href) {
      const familyMatch = href.match(/family=([^&:]+)/);
      if (familyMatch) {
        const fontName = familyMatch[1].replace(/\+/g, ' ');
        fonts.add(fontName);
      }
    }
  });
  
  return Array.from(fonts).slice(0, 5); // Limit to top 5 fonts
}

/**
 * Find logo from the page
 */
function findLogo($: cheerio.CheerioAPI, baseUrl: string): string | null {
  // Try common logo selectors
  const logoSelectors = [
    'img[alt*="logo" i]',
    'img[class*="logo" i]',
    'img[id*="logo" i]',
    '.logo img',
    '#logo img',
    'header img:first',
    '.header img:first',
    'nav img:first'
  ];
  
  for (const selector of logoSelectors) {
    const img = $(selector).first();
    if (img.length) {
      const src = img.attr('src');
      if (src) {
        try {
          return new URL(src, baseUrl).href;
        } catch {
          return src;
        }
      }
    }
  }
  
  // Fallback to clearbit
  try {
    const hostname = new URL(baseUrl).hostname;
    return `https://logo.clearbit.com/${hostname}`;
  } catch {
    return null;
  }
}

/**
 * Find favicon from the page
 */
function findFavicon($: cheerio.CheerioAPI, baseUrl: string): string {
  const faviconSelectors = [
    'link[rel="icon"]',
    'link[rel="shortcut icon"]',
    'link[rel="apple-touch-icon"]'
  ];
  
  for (const selector of faviconSelectors) {
    const link = $(selector).first();
    if (link.length) {
      const href = link.attr('href');
      if (href) {
        try {
          return new URL(href, baseUrl).href;
        } catch {
          return href;
        }
      }
    }
  }
  
  // Fallback to Google favicon service
  return `https://www.google.com/s2/favicons?domain=${baseUrl}&sz=128`;
}

/**
 * Actual crawler job that scrapes design tokens from a URL
 */
async function triggerCrawlerJob(jobId: string, url: string, saasCreatorId: string) {
  // Set a timeout of 20 seconds
  const TIMEOUT_MS = 20000;
  const timeoutPromise = new Promise((_, reject) => 
    setTimeout(() => reject(new Error("Crawler timeout")), TIMEOUT_MS)
  );

  const crawlPromise = (async () => {
    try {
      // Fetch the webpage
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch URL: ${response.status}`);
      }
      
      const html = await response.text();
      const $ = cheerio.load(html);
      
      // Extract CSS files
      const cssUrls: string[] = [];
      $('link[rel="stylesheet"]').each((_, elem) => {
        const href = $(elem).attr('href');
        if (href) {
          try {
            cssUrls.push(new URL(href, url).href);
          } catch (error) {
            console.error(`Invalid CSS URL: ${href}`);
          }
        }
      });
      
      // Also extract inline styles
      const inlineStyles: string[] = [];
      $('style').each((_, elem) => {
        inlineStyles.push($(elem).html() || '');
      });
      
      // Fetch external CSS files (limit to first 5 to avoid timeout)
      const cssContents = await Promise.all(
        cssUrls.slice(0, 5).map(cssUrl => fetchCss(cssUrl))
      );
      cssContents.push(...inlineStyles);
      
      // Extract colors from all CSS
      const allColors: string[] = [];
      cssContents.forEach(css => {
        allColors.push(...extractColorsFromCss(css));
      });
      
      // Find primary and secondary colors (use most common ones)
      const colorFrequency = new Map<string, number>();
      allColors.forEach(color => {
        colorFrequency.set(color, (colorFrequency.get(color) || 0) + 1);
      });
      
      const sortedColors = Array.from(colorFrequency.entries())
        .sort((a, b) => b[1] - a[1])
        .map(entry => entry[0])
        .filter(color => {
          // Filter out white, black, and very light grays
          const hex = color.replace('#', '');
          if (hex.length === 6 || hex.length === 8) {
            const r = parseInt(hex.substr(0, 2), 16);
            const g = parseInt(hex.substr(2, 2), 16);
            const b = parseInt(hex.substr(4, 2), 16);
            const brightness = (r + g + b) / 3;
            return brightness > 30 && brightness < 240;
          }
          return true;
        });
      
      const primaryColor = sortedColors[0] || "#1A73E8";
      const secondaryColor = sortedColors[1] || "#F5F5F5";
      
      // Extract fonts
      const fonts = extractFonts($, cssContents);
      
      // Find logo and favicon
      const logoUrl = findLogo($, url);
      const faviconUrl = findFavicon($, url);
      
      // Extract company information using Readability
      let companyName = extractCompanyName(url);
      let companyDescription = "";
      
      try {
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();
        
        if (article) {
          // Try to find company name from title or meta tags
          const titleMatch = $('title').text();
          if (titleMatch) {
            companyName = titleMatch.split('|')[0].split('-')[0].trim();
          }
          
          companyDescription = article.excerpt || "";
        }
      } catch (error) {
        console.error("Error parsing with Readability:", error);
      }
      
      // Extract meta information
      const metaDescription = $('meta[name="description"]').attr('content') || "";
      const ogTitle = $('meta[property="og:title"]').attr('content') || "";
      
      if (ogTitle) {
        companyName = ogTitle.split('|')[0].split('-')[0].trim();
      }
      
      // Extract contact info
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
      const phoneRegex = /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
      
      const bodyText = $('body').text();
      const emails = bodyText.match(emailRegex) || [];
      const phones = bodyText.match(phoneRegex) || [];
      
      const contactEmail = emails.find(e => e.includes('contact') || e.includes('info') || e.includes('hello')) 
        || emails[0] 
        || `contact@${new URL(url).hostname}`;
      
      const contactPhone = phones[0] || "+1 (555) 123-4567";
      
      // Try to extract address
      const addressRegex = /\d+\s+[\w\s]+,\s+[\w\s]+,\s+[A-Z]{2}\s+\d{5}/;
      const addressMatch = bodyText.match(addressRegex);
      const companyAddress = addressMatch ? addressMatch[0] : "";
      
      // Create crawler response
      const crawlerResponse = {
        logo_url: logoUrl,
        favicon_url: faviconUrl,
        colors: {
          primary: primaryColor,
          secondary: secondaryColor,
        },
        fonts: fonts.length > 0 ? fonts : ["Inter", "Roboto", "Arial"],
        company_name: companyName,
        company_address: companyAddress,
        contact_info: {
          email: contactEmail,
          phone: contactPhone,
        },
        products: [] as string[],
        voice: metaDescription || companyDescription || "Professional and customer-focused",
        confidence_scores: {
          logo: logoUrl && !logoUrl.includes('clearbit') ? 0.85 : 0.5,
          colors: sortedColors.length > 2 ? 0.8 : 0.5,
          fonts: fonts.length > 0 ? 0.75 : 0.4,
          company_info: companyAddress ? 0.7 : 0.4,
        },
      };

      // Store the crawl results
      await prisma.saasCreator.update({
        where: { id: saasCreatorId },
        data: {
          crawlStatus: "completed",
          crawlCompletedAt: new Date(),
          logoUrl: crawlerResponse.logo_url,
          faviconUrl: crawlerResponse.favicon_url,
          primaryColor: crawlerResponse.colors.primary,
          secondaryColor: crawlerResponse.colors.secondary,
          fonts: JSON.stringify(crawlerResponse.fonts),
          businessName: crawlerResponse.company_name || "Your Company",
          companyAddress: crawlerResponse.company_address,
          contactInfo: JSON.stringify(crawlerResponse.contact_info),
          productsParsed: JSON.stringify(crawlerResponse.products),
          voiceAndTone: crawlerResponse.voice,
          crawlConfidence: JSON.stringify(crawlerResponse.confidence_scores),
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
