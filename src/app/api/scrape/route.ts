import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as csstree from "css-tree";
import type { Declaration, CssNode } from "css-tree";
import { generateText } from "ai";
import { openai } from '@ai-sdk/openai';
import type { FeelData } from "@/types/saas";

// Helper to extract domain name from URL for subdomain
function extractDomainForSubdomain(url: string): string {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname;
    // Remove 'www.' if present
    const cleanHostname = hostname.replace(/^www\./, '');
    // Get the main domain part (without TLD)
    const parts = cleanHostname.split('.');
    const domain = parts.length > 1 ? parts[0] : cleanHostname;
    // Clean it to only allow alphanumeric and hyphens
    const cleaned = domain.toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    return cleaned.substring(0, 30) || 'mysite';
  } catch (error) {
    console.error('Error extracting domain:', error);
    return 'mysite';
  }
}

// Helper to fetch CSS content
async function fetchCss(url: string): Promise<string | null> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Failed to fetch CSS from ${url}: ${response.statusText}`);
      return null;
    }
    return response.text();
  } catch (error) {
    console.error(`Error fetching CSS from ${url}:`, error);
    return null;
  }
}

// Helper to validate and clean color strings
function isValidColor(color: string): boolean {
  const trimmed = color.trim().toLowerCase();
  // Exclude CSS keywords that are not actual colors
  const excludedKeywords = ["inherit", "initial", "unset", "revert", "revert-layer", "currentcolor", "transparent"];
  if (excludedKeywords.includes(trimmed)) {
    return false;
  }
  // Basic check for hex, rgb, rgba, hsl, hsla, or common named colors
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb(") ||
    trimmed.startsWith("rgba(") ||
    trimmed.startsWith("hsl(") ||
    trimmed.startsWith("hsla(") ||
    ["red", "blue", "green", "black", "white", "gray", "cyan", "amber", "orange", "purple", "pink", "yellow", "teal", "indigo", "violet", "lime", "emerald", "rose"].includes(trimmed)
  );
}

// Helper to validate and clean font strings
function isValidFont(font: string): boolean {
  const trimmed = font.trim().toLowerCase();
  // Exclude CSS keywords and generic font families
  const excludedKeywordsAndGenerics = [
    "inherit", "initial", "unset", "revert", "revert-layer",
    "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
    "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "ubuntu", "cantarell", "fira sans", "droid sans", "helvetica neue" // Common system fonts
  ];
  if (excludedKeywordsAndGenerics.includes(trimmed)) {
    return false;
  }
  // Check if it contains at least one letter or a quote, indicating a specific font name
  return /[a-z]/.test(trimmed) || trimmed.includes("'") || trimmed.includes('"');
}

// Helper to validate and clean spacing values
function isValidSpacingValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  // Exclude CSS keywords and common non-token values
  const excluded = ["inherit", "initial", "unset", "revert", "revert-layer", "auto", "0", "0px", "0em", "0rem"];
  if (excluded.includes(trimmed)) {
    return false;
  }
  // Check if it looks like a numerical value with a unit, or a variable
  return /^-?(\d*\.?\d+)(px|em|rem|%|vh|vw|ch|ex|cap|ic|lh|rlh|svw|svh|lvw|lvh|dvw|dvh|vmin|vmax|fr|pt|pc|in|cm|mm)?$|^var\(--[\w-]+\)$/.test(trimmed);
}

// Function to process declarations
function processDeclaration(node: Declaration, extractedColors: Set<string>, extractedFonts: Set<string>, extractedSpacing: Set<string>) {
  const rawValue = csstree.generate(node.value);
  const trimmedLowerValue = rawValue.trim().toLowerCase();

  if (node.property === "color" || node.property === "background-color") {
    if (isValidColor(rawValue)) {
      extractedColors.add(rawValue);
    }
  } else if (node.property === "font-family") {
    const fontNames = rawValue.split(',').map(f => f.trim().replace(/['"]/g, ''));
    fontNames.forEach((fontName: string) => {
      if (isValidFont(fontName)) {
        extractedFonts.add(fontName);
      }
    });
  } else if (
    node.property.startsWith("padding") ||
    node.property.startsWith("margin") ||
    node.property === "gap" ||
    node.property === "line-height" ||
    node.property.startsWith("border-width")
  ) {
    if (isValidSpacingValue(rawValue)) {
      extractedSpacing.add(rawValue);
    }
  }
}

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

    // Kick off both lightweight and deep scraping in the background
    // This allows the API to return immediately
    (async () => {
      try {
        // Lightweight extraction
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`Failed to fetch URL: ${response.statusText}`);
        }
        const html = await response.text();

        // Parse HTML with JSDOM for Readability
        const dom = new JSDOM(html, { url });
        const reader = new Readability(dom.window.document);
        const article = reader.parse();

        // Extract main text using Readability
        const mainText = article?.textContent?.substring(0, 1000) || "";

        // Parse HTML with Cheerio for structural elements
        const $ = cheerio.load(html);

        const headings: string[] = [];
        $("h1, h2, h3, h4, h5, h6").each((index: number, element) => {
          const text = $(element).text().trim();
          if (text) headings.push(text);
        });

        const links: { href: string; text: string }[] = [];
        $("a").each((index: number, element) => {
          const href = $(element).attr("href") || "";
          const text = $(element).text().trim();
          if (href && text) links.push({ href, text });
        });

        const images: { src: string; alt: string }[] = [];
        $("img").each((index: number, element) => {
          const src = $(element).attr("src") || "";
          const alt = $(element).attr("alt") || "";
          if (src) images.push({ src, alt });
        });

        // Extract colors, fonts, and spacing using css-tree
        const extractedColors = new Set<string>();
        const extractedFonts = new Set<string>();
        const extractedSpacing = new Set<string>();

        // Process inline styles
        $("[style]").each((index: number, element) => {
          const style = $(element).attr("style");
          if (style) {
            try {
              const ast = csstree.parse(style, { context: "declarationList" });
              csstree.walk(ast, {
                visit: "Declaration",
                enter: (node: CssNode) => {
                  if (node.type === 'Declaration') {
                    processDeclaration(node as Declaration, extractedColors, extractedFonts, extractedSpacing);
                  }
                },
              });
            } catch (e) {
              console.warn("Error parsing inline style:", style, e);
            }
          }
        });

        // Process <style> tags
        $("style").each((index: number, element) => {
          const styleContent = $(element).html() || "";
          if (styleContent) {
            try {
              const ast = csstree.parse(styleContent);
              csstree.walk(ast, {
                visit: "Declaration",
                enter: (node: CssNode) => {
                  if (node.type === 'Declaration') {
                    processDeclaration(node as Declaration, extractedColors, extractedFonts, extractedSpacing);
                  }
                },
              });
            } catch (e) {
              console.warn("Error parsing <style> content:", e);
            }
          }
        });

        // Process <link rel="stylesheet"> tags
        const cssUrls: string[] = [];
        $('link[rel="stylesheet"]').each((index: number, element) => {
          const href = $(element).attr("href") || "";
          if (href) {
            try {
              const absoluteUrl = new URL(href, url).href;
              cssUrls.push(absoluteUrl);
            } catch (e) {
              console.warn(`Invalid CSS link href: ${href}`, e);
            }
          }
        });

        const allCssContents = await Promise.all(cssUrls.map(fetchCss));
        for (const cssContent of allCssContents) {
          if (cssContent) {
            try {
              const ast = csstree.parse(cssContent);
              csstree.walk(ast, {
                visit: "Declaration",
                enter: (node: CssNode) => {
                  if (node.type === 'Declaration') {
                    processDeclaration(node as Declaration, extractedColors, extractedFonts, extractedSpacing);
                  }
                },
              });
            } catch (e) {
              console.warn("Error parsing linked CSS content:", e);
            }
          }
        }

        // Deduplicate and limit
        const uniqueColors = Array.from(extractedColors).slice(0, 5);
        const uniqueFonts = Array.from(extractedFonts).slice(0, 3);
        const uniqueSpacing = Array.from(extractedSpacing).slice(0, 5);

        // Infer tone using AI
        let tone = "neutral";
        if (mainText.length > 50) {
          const { text: aiTone } = await generateText({
            model: openai("gpt-4o-mini"),
            messages: [
              {
            role: "system",
            content: `Analyze the following text and determine its overall tone. Respond with a single word: casual, formal, friendly, professional, playful, serious, urgent, calm. If unsure, default to 'neutral'.

Example:
Text: "Hey there! Hope you're having a fantastic day. Just wanted to quickly check in."
Tone: friendly

Text: "We are pleased to announce the release of our Q3 earnings report, demonstrating robust growth."
Tone: formal

Text: "Don't miss out! Limited time offer ends tonight!"
Tone: urgent

Text: "The serene landscape offered a moment of quiet reflection."
Tone: calm

Text: "Our new product is super cool and will make your life awesome!"
Tone: playful

Text: "Please provide a detailed analysis of the market trends for the upcoming fiscal year."
Tone: professional

Text: "Just wanted to see how things are going."
Tone: casual

Text: "The situation requires immediate attention and a comprehensive strategy."
Tone: serious

Text: "This is a generic piece of text."
Tone: neutral

Text: "${mainText}"
Tone:`,
              },
            ],
          });
          tone = aiTone.trim().toLowerCase();
          const validTones = ["casual", "formal", "friendly", "professional", "playful", "serious", "urgent", "calm", "neutral"];
          if (!validTones.includes(tone)) {
            tone = "neutral";
          }
        }

        const feelData: FeelData = {
          url,
          headings,
          mainText,
          links,
          images,
          colors: uniqueColors,
          fonts: uniqueFonts,
          tone,
          spacingValues: uniqueSpacing,
        };

        // Save lightweight data to individual fields
        const primaryColor = uniqueColors[0] || "#3B82F6";
        const secondaryColor = uniqueColors[1] || "#1D4ED8";
        const logoUrl = images[0]?.src ? new URL(images[0].src, url).href : null;
        const faviconUrl = images.find(img => img.src.includes('favicon'))?.src ? new URL(images.find(img => img.src.includes('favicon'))!.src, url).href : null;

        await prisma.saasCreator.update({
          where: { id: saasCreator.id },
          data: {
            lightweightScrape: feelData as any,
            primaryColor,
            secondaryColor,
            fonts: JSON.stringify(uniqueFonts),
            voiceAndTone: tone,
            logoUrl,
            faviconUrl,
            crawlStatus: "lightweight_completed",
          },
        });

        // Create or update WhiteLabelConfig with subdomain from URL
        const subdomain = extractDomainForSubdomain(url);
        const whiteLabelConfig = await prisma.whiteLabelConfig.upsert({
          where: { saasCreatorId: saasCreator.id },
          update: { subdomain },
          create: {
            saasCreatorId: saasCreator.id,
            subdomain,
            isActive: true,
            pageVisibility: "public",
          },
        });

        // Parallel deep trigger
        const deepPromise = fetch("http://localhost:3030/api/crawl", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url, depth: 1 }),
        }).then((res) => {
          if (!res.ok) throw new Error("Deep scrape failed");
          return res.json();
        }).then(async (deepData) => {
          // Merge logic
          const mergedColors = deepData.designTokens
            ?.filter((t: any) => t.tokenType === "color")
            .map((t: any) => t.tokenValue)
            .slice(0, 5) || feelData.colors;
          const mergedFonts = deepData.designTokens
            ?.filter((t: any) => t.tokenType === "typography")
            .map((t: any) => t.tokenValue)
            .slice(0, 3) || feelData.fonts;
          const mergedSpacing = deepData.designTokens
            ?.filter((t: any) => t.tokenType === "spacing")
            .map((t: any) => t.tokenValue)
            .slice(0, 5) || feelData.spacingValues;
          const mergedTone = deepData.brandVoice?.tone || feelData.tone;
          const primaryColor = mergedColors[0] || "#1A73E8";
          const secondaryColor = mergedColors[1] || "#F5F5F5";
          const merged = {
            colors: mergedColors,
            fonts: mergedFonts,
            tone: mergedTone,
            spacingValues: mergedSpacing,
          };
          const voiceAndToneString = Array.isArray(mergedTone) ? JSON.stringify(mergedTone) : mergedTone;
          await prisma.saasCreator.update({
            where: { id: saasCreator.id },
            data: {
              deepDesignTokens: deepData,
              mergedScrapeData: {
                lightweight: feelData,
                deep: deepData,
                merged,
              } as any,
              primaryColor,
              secondaryColor,
              fonts: JSON.stringify(mergedFonts),
              voiceAndTone: voiceAndToneString,
              crawlStatus: "completed",
              crawlCompletedAt: new Date(),
            },
          });

          // Update WhiteLabelConfig with design tokens if it exists
          const whiteLabelConfig = await prisma.whiteLabelConfig.findUnique({
            where: { saasCreatorId: saasCreator.id },
          });

          if (whiteLabelConfig) {
            await prisma.whiteLabelConfig.update({
              where: { id: whiteLabelConfig.id },
              data: {
                primaryColor,
                secondaryColor,
                logoUrl: deepData.logo_url || whiteLabelConfig.logoUrl,
                faviconUrl: deepData.favicon_url || whiteLabelConfig.faviconUrl,
              },
            });
          }

          console.log(`Deep job ${jobId} completed`);
        }).catch(async (err) => {
          console.error("Deep scrape error:", err);
          await prisma.saasCreator.update({
            where: { id: saasCreator.id },
            data: { crawlStatus: "deep_failed" },
          });
        });
      } catch (error: any) {
        console.error("Background scrape error:", error);
        await prisma.saasCreator.update({
          where: { id: saasCreator.id },
          data: { crawlStatus: "failed" },
        }).catch(err => {
          console.error("Failed to update crawl status after error:", err);
        });
      }
    })().catch(err => {
      // Final catch to prevent unhandled promise rejection
      console.error("Unhandled error in background scrape:", err);
    });

    // Return immediately without waiting for scraping to complete
    return NextResponse.json({
      success: true,
      jobId,
      message: "Scraping started in background. You can continue with onboarding.",
    });
  } catch (error: any) {
    console.error("Scrape API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start crawler" },
      { status: 500 }
    );
  }
}