import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/utils/auth";
import { prisma } from "@/utils/prismaDB";
import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import * as csstree from "css-tree";
import { generateText } from "ai";
import { openai } from '@ai-sdk/openai';
import puppeteer from "puppeteer";

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
}

interface DeepData {
  designTokens: Array<{
    tokenKey: string;
    tokenType: string;
    tokenValue: string;
    source: string;
  }>;
  brandVoice: {
    tone: string;
    personality: string[];
    themes: string[];
  };
  screenshot: string;
  majorColors: {
    background: string;
    text: string;
    link: string;
  };
  majorFonts: string[];
  spacingScale: string[];
}

async function lightweightScrape(url: string): Promise<FeelData> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch URL: ${response.statusText}`);
  }
  const html = await response.text();

  const $ = cheerio.load(html);
  const headings: string[] = [];
  $("h1, h2, h3, h4, h5, h6").each((index, element) => {
    const text = $(element).text().trim();
    if (text) headings.push(text);
  });

  const links: { href: string; text: string }[] = [];
  $("a").each((index, element) => {
    const href = $(element).attr("href") || "";
    const text = $(element).text().trim();
    if (href && text) links.push({ href, text });
  });

  const images: { src: string; alt: string }[] = [];
  $("img").each((index, element) => {
    const src = $(element).attr("src") || "";
    const alt = $(element).attr("alt") || "";
    if (src) images.push({ src, alt });
  });

  const extractedColors = new Set<string>();
  const extractedFonts = new Set<string>();
  const extractedSpacing = new Set<string>();

  // Process inline styles
  $("[style]").each((index, element) => {
    const style = $(element).attr("style");
    if (style) {
      try {
        const ast = csstree.parse(style, { context: "declarationList" });
        csstree.walk(ast, {
          visit: "Declaration",
          enter: (node: any) => {
            if (node.type === 'Declaration') {
              const rawValue = csstree.generate(node.value);
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
          },
        });
      } catch (e) {
        console.warn("Error parsing inline style:", style, e);
      }
    }
  });

  // Process <style> tags
  $("style").each((index, element) => {
    const styleContent = $(element).html() || "";
    if (styleContent) {
      try {
        const ast = csstree.parse(styleContent);
        csstree.walk(ast, {
          visit: "Declaration",
          enter: (node: any) => {
            if (node.type === 'Declaration') {
              const rawValue = csstree.generate(node.value);
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
          },
        });
      } catch (e) {
        console.warn("Error parsing <style> content:", e);
      }
    }
  });

  const uniqueColors = Array.from(extractedColors).slice(0, 5);
  const uniqueFonts = Array.from(extractedFonts).slice(0, 3);
  const uniqueSpacing = Array.from(extractedSpacing).slice(0, 5);

  let tone = "neutral";
  if (headings.length > 0) {
    const textForTone = headings.join(" ");
    const { text: aiTone } = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: `Analyze the following text and determine its overall tone. Respond with a single word: casual, formal, friendly, professional, playful, serious, urgent, calm. If unsure, default to 'neutral'.

Text: "${textForTone}"`,
        },
      ],
    });
    tone = aiTone.trim().toLowerCase();
    if (!["casual", "formal", "friendly", "professional", "playful", "serious", "urgent", "calm", "neutral"].includes(tone)) {
      tone = "neutral";
    }
  }

  const feelData: FeelData = {
    url,
    headings,
    mainText: headings.join(" "),
    links,
    images,
    colors: uniqueColors,
    fonts: uniqueFonts,
    tone,
    spacingValues: uniqueSpacing,
  };

  return feelData;
}

async function deepScrape(url: string): Promise<DeepData> {
  let deepData: DeepData = {
    designTokens: [],
    brandVoice: { tone: 'neutral', personality: [], themes: [] },
    screenshot: '',
    majorColors: { background: 'white', text: 'black', link: 'blue' },
    majorFonts: ['Inter'],
    spacingScale: ['16px'],
  };

  try {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    // Get CSS variables from :root
    const cssVars = await page.evaluate(() => {
      const root = getComputedStyle(document.documentElement);
      const vars: Record<string, string> = {};
      for (let i = 0; i < root.length; i++) {
        const prop = root[i];
        if (prop.startsWith('--')) {
          vars[prop] = root.getPropertyValue(prop).trim();
        }
      }
      return vars;
    });

    // Get major colors from body background and text
    const majorColors = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return {
        background: body.backgroundColor,
        text: body.color,
        link: getComputedStyle(document.body).color, // approximate
      };
    });

    // Get major fonts
    const majorFonts = await page.evaluate(() => {
      const body = getComputedStyle(document.body);
      return body.fontFamily.split(',').map(f => f.trim().replace(/['"]/g, ''));
    });

    // Get spacing scale from common elements
    const spacingScale = await page.evaluate(() => {
      const elements = document.querySelectorAll('body, .container, .card, button, input');
      const spacings = new Set();
      elements.forEach(el => {
        const style = getComputedStyle(el);
        ['padding-top', 'padding-right', 'padding-bottom', 'padding-left', 'margin-top', 'margin-right', 'margin-bottom', 'margin-left', 'gap'].forEach(prop => {
          const value = style.getPropertyValue(prop);
          if (value && value !== '0px' && !value.includes('calc')) {
            spacings.add(value);
          }
        });
      });
      return Array.from(spacings).slice(0, 10);
    });

    // Screenshot
    const screenshot = await page.screenshot({ fullPage: true });
    const screenshotBase64 = (screenshot as Buffer).toString('base64');

    await browser.close();

    // Design tokens from CSS vars and extracted
    const designTokens = Object.entries(cssVars).map(([key, value]) => ({
      tokenKey: key,
      tokenType: 'css-variable',
      tokenValue: value as string,
      source: 'root'
    }));

    // Brand voice from main text (use headings or body text)
    const mainText = await page.evaluate(() => document.body.innerText.substring(0, 2000));
    const { text: brandVoiceText } = await generateText({
      model: openai("gpt-4o-mini"),
      messages: [
        {
          role: "system",
          content: "Analyze this website content and describe the brand voice in JSON: { \"tone\": \"word\", \"personality\": [\"traits\"], \"themes\": [\"themes\"] }",
        },
        { role: "user", content: mainText },
      ],
    });
    const brandVoice = JSON.parse(brandVoiceText);

    deepData = {
      designTokens,
      brandVoice,
      screenshot: `data:image/png;base64,${screenshotBase64}`,
      majorColors,
      majorFonts,
      spacingScale: spacingScale as string[],
    };
  } catch (error) {
    console.error('Deep scrape failed, using defaults:', error);
    // deepData already set to defaults
  }

  return deepData;
}

function isValidColor(color: string): boolean {
  const trimmed = color.trim().toLowerCase();
  const excludedKeywords = ["inherit", "initial", "unset", "revert", "revert-layer", "currentcolor", "transparent"];
  if (excludedKeywords.includes(trimmed)) {
    return false;
  }
  return (
    trimmed.startsWith("#") ||
    trimmed.startsWith("rgb(") ||
    trimmed.startsWith("rgba(") ||
    trimmed.startsWith("hsl(") ||
    trimmed.startsWith("hsla(") ||
    ["red", "blue", "green", "black", "white", "gray", "cyan", "amber", "orange", "purple", "pink", "yellow", "teal", "indigo", "violet", "lime", "emerald", "rose"].includes(trimmed)
  );
}

function isValidFont(font: string): boolean {
  const trimmed = font.trim().toLowerCase();
  const excludedKeywordsAndGenerics = [
    "inherit", "initial", "unset", "revert", "revert-layer",
    "serif", "sans-serif", "monospace", "cursive", "fantasy", "system-ui",
    "-apple-system", "blinkmacsystemfont", "segoe ui", "roboto", "ubuntu", "cantarell", "fira sans", "droid sans", "helvetica neue"
  ];
  if (excludedKeywordsAndGenerics.includes(trimmed)) {
    return false;
  }
  return /[a-z]/.test(trimmed) || trimmed.includes("'") || trimmed.includes('"');
}

function isValidSpacingValue(value: string): boolean {
  const trimmed = value.trim().toLowerCase();
  const excluded = ["inherit", "initial", "unset", "revert", "revert-layer", "auto", "0", "0px", "0em", "0rem"];
  if (excluded.includes(trimmed)) {
    return false;
  }
  return /^-?(\d*\.?\d+)(px|em|rem|%|vh|vw|ch|ex|cap|ic|lh|rlh|svw|svh|lvw|lvh|dvw|dvh|vmin|vmax|fr|pt|pc|in|cm|mm)?$/.test(trimmed);
}

export async function POST(request: NextRequest) {
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

    // Kick off lightweight and deep scraping in parallel
    (async () => {
      try {
        // Lightweight scrape
        const feelData = await lightweightScrape(url);

        // Save lightweight
        await prisma.saasCreator.update({
          where: { id: saasCreator.id },
          data: {
            lightweightScrape: JSON.stringify(feelData),
            crawlStatus: "lightweight_completed",
          },
        });

        console.log(`Lightweight scrape for job ${jobId} completed`);
      } catch (error) {
        console.error("Lightweight scrape error:", error);
        await prisma.saasCreator.update({
          where: { id: saasCreator.id },
          data: { crawlStatus: "lightweight_failed" },
        });
      }
    })();

    // Deep scrape in background
    (async () => {
      try {
        const deepData = await deepScrape(url);

        // Derive primary and secondary colors from deepData
        const primaryColor = deepData.majorColors.text || deepData.majorColors.link || '#667eea';
        const secondaryColor = deepData.majorColors.background || '#f5f5f5';

        // Save deep and derived colors
        await prisma.saasCreator.update({
          where: { id: saasCreator.id },
          data: {
            deepDesignTokens: JSON.stringify(deepData),
            primaryColor,
            secondaryColor,
            crawlStatus: "completed",
            crawlCompletedAt: new Date(),
          },
        });

        console.log(`Deep scrape for job ${jobId} completed`);
      } catch (error) {
        console.error("Deep scrape error:", error);
        await prisma.saasCreator.update({
          where: { id: saasCreator.id },
          data: { 
            crawlStatus: "deep_failed",
            primaryColor: '#667eea',
            secondaryColor: '#f5f5f5',
          },
        });
      }
    })().catch(err => {
      console.error("Unhandled error in deep scrape:", err);
    });

    // Return immediately without waiting for scraping to complete
    return NextResponse.json({
      success: true,
      jobId,
      message: "Scraping started in background. Lightweight data available, deep processing continues.",
    });
  } catch (error: any) {
    console.error("Scrape API error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to start crawler" },
      { status: 500 }
    );
  }
}