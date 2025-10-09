/**
 * Lightweight Design Token Extractor
 * 
 * This utility extracts basic design tokens (colors, fonts, logo, favicon) 
 * from a website using frontend-only techniques for immediate feedback
 * during the onboarding process.
 */

export interface ExtractedDesignTokens {
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fonts?: string[];
  companyName?: string;
  confidenceScores?: {
    logo: number;
    colors: number;
    fonts: number;
  };
}

/**
 * Extract colors from a website by analyzing computed styles
 */
async function extractColorsFromWebsite(url: string): Promise<string[]> {
  try {
    // Create a hidden iframe to load the website
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    document.body.appendChild(iframe);

    return new Promise((resolve) => {
      iframe.onload = () => {
        try {
          const colors = new Set<string>();
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (!iframeDoc) {
            document.body.removeChild(iframe);
            resolve([]);
            return;
          }

          // Get computed styles for common elements
          const elements = iframeDoc.querySelectorAll('body, header, nav, main, footer, .header, .nav, .footer');
          
          elements.forEach((element) => {
            const computedStyle = iframeDoc.defaultView?.getComputedStyle(element);
            if (computedStyle) {
              // Extract background colors
              const bgColor = computedStyle.backgroundColor;
              if (bgColor && bgColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'transparent') {
                colors.add(bgColor);
              }
              
              // Extract text colors
              const textColor = computedStyle.color;
              if (textColor && textColor !== 'rgba(0, 0, 0, 0)' && textColor !== 'transparent') {
                colors.add(textColor);
              }
              
              // Extract border colors
              const borderColor = computedStyle.borderColor;
              if (borderColor && borderColor !== 'rgba(0, 0, 0, 0)' && borderColor !== 'transparent') {
                colors.add(borderColor);
              }
            }
          });

          document.body.removeChild(iframe);
          resolve(Array.from(colors));
        } catch (error) {
          console.error('Error extracting colors:', error);
          document.body.removeChild(iframe);
          resolve([]);
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        resolve([]);
      };

      // Load the website
      iframe.src = url;
    });
  } catch (error) {
    console.error('Error in extractColorsFromWebsite:', error);
    return [];
  }
}

/**
 * Extract fonts from a website by analyzing computed styles
 */
async function extractFontsFromWebsite(url: string): Promise<string[]> {
  try {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.left = '-9999px';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    document.body.appendChild(iframe);

    return new Promise((resolve) => {
      iframe.onload = () => {
        try {
          const fonts = new Set<string>();
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          
          if (!iframeDoc) {
            document.body.removeChild(iframe);
            resolve([]);
            return;
          }

          // Get computed styles for text elements
          const textElements = iframeDoc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, a, button');
          
          textElements.forEach((element) => {
            const computedStyle = iframeDoc.defaultView?.getComputedStyle(element);
            if (computedStyle) {
              const fontFamily = computedStyle.fontFamily;
              if (fontFamily && fontFamily !== 'initial' && fontFamily !== 'inherit') {
                // Clean up font family string
                const cleanFont = fontFamily.replace(/['"]/g, '').split(',')[0].trim();
                if (cleanFont && !['serif', 'sans-serif', 'monospace', 'cursive', 'fantasy'].includes(cleanFont.toLowerCase())) {
                  fonts.add(cleanFont);
                }
              }
            }
          });

          document.body.removeChild(iframe);
          resolve(Array.from(fonts).slice(0, 5)); // Limit to top 5 fonts
        } catch (error) {
          console.error('Error extracting fonts:', error);
          document.body.removeChild(iframe);
          resolve([]);
        }
      };

      iframe.onerror = () => {
        document.body.removeChild(iframe);
        resolve([]);
      };

      iframe.src = url;
    });
  } catch (error) {
    console.error('Error in extractFontsFromWebsite:', error);
    return [];
  }
}

/**
 * Find logo URL from a website
 */
async function findLogoUrl(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Try common logo selectors
    const logoSelectors = [
      'img[alt*="logo" i]',
      'img[class*="logo" i]',
      'img[id*="logo" i]',
      '.logo img',
      '#logo img',
      'header img:first-of-type',
      '.header img:first-of-type',
      'nav img:first-of-type',
      '.brand img',
      '.site-logo img'
    ];

    for (const selector of logoSelectors) {
      const img = doc.querySelector(selector);
      if (img) {
        const src = img.getAttribute('src');
        if (src) {
          try {
            return new URL(src, url).href;
          } catch {
            return src;
          }
        }
      }
    }

    // Fallback to clearbit logo service
    try {
      const hostname = new URL(url).hostname;
      return `https://logo.clearbit.com/${hostname}`;
    } catch {
      return undefined;
    }
  } catch (error) {
    console.error('Error finding logo:', error);
    return undefined;
  }
}

/**
 * Find favicon URL from a website
 */
async function findFaviconUrl(url: string): Promise<string | undefined> {
  try {
    const response = await fetch(`/api/proxy?url=${encodeURIComponent(url)}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/html',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Look for favicon links
    const faviconSelectors = [
      'link[rel="icon"]',
      'link[rel="shortcut icon"]',
      'link[rel="apple-touch-icon"]',
      'link[rel="apple-touch-icon-precomposed"]'
    ];

    for (const selector of faviconSelectors) {
      const link = doc.querySelector(selector);
      if (link) {
        const href = link.getAttribute('href');
        if (href) {
          try {
            return new URL(href, url).href;
          } catch {
            return href;
          }
        }
      }
    }

    // Fallback to Google favicon service
    return `https://www.google.com/s2/favicons?domain=${url}&sz=128`;
  } catch (error) {
    console.error('Error finding favicon:', error);
    return undefined;
  }
}

/**
 * Extract company name from URL
 */
function extractCompanyName(url: string): string {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split('.');
    const domain = parts.length > 2 ? parts[parts.length - 2] : parts[0];
    return domain.charAt(0).toUpperCase() + domain.slice(1);
  } catch {
    return 'Your Company';
  }
}

/**
 * Process colors to find primary and secondary colors
 */
function processColors(colors: string[]): { primary?: string; secondary?: string } {
  if (colors.length === 0) {
    return {};
  }

  // Convert colors to a more standard format and filter
  const processedColors = colors
    .map(color => {
      // Convert rgb/rgba to hex if needed
      if (color.startsWith('rgb')) {
        const matches = color.match(/\d+/g);
        if (matches && matches.length >= 3) {
          const r = parseInt(matches[0]);
          const g = parseInt(matches[1]);
          const b = parseInt(matches[2]);
          return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`.toUpperCase();
        }
      }
      return color;
    })
    .filter(color => {
      // Filter out white, black, and very light grays
      if (color.startsWith('#')) {
        const hex = color.replace('#', '');
        if (hex.length === 6) {
          const r = parseInt(hex.substr(0, 2), 16);
          const g = parseInt(hex.substr(2, 2), 16);
          const b = parseInt(hex.substr(4, 2), 16);
          const brightness = (r + g + b) / 3;
          return brightness > 30 && brightness < 240;
        }
      }
      return true;
    });

  // Count color frequency
  const colorFrequency = new Map<string, number>();
  processedColors.forEach(color => {
    colorFrequency.set(color, (colorFrequency.get(color) || 0) + 1);
  });

  // Get most common colors
  const sortedColors = Array.from(colorFrequency.entries())
    .sort((a, b) => b[1] - a[1])
    .map(entry => entry[0]);

  return {
    primary: sortedColors[0] || '#1A73E8',
    secondary: sortedColors[1] || '#F5F5F5'
  };
}

/**
 * Main function to extract design tokens from a website
 */
export async function extractDesignTokens(url: string): Promise<ExtractedDesignTokens> {
  try {
    console.log('Extracting design tokens from:', url);

    // Extract colors and fonts in parallel
    const [colors, fonts, logoUrl, faviconUrl] = await Promise.all([
      extractColorsFromWebsite(url),
      extractFontsFromWebsite(url),
      findLogoUrl(url),
      findFaviconUrl(url)
    ]);

    const { primary, secondary } = processColors(colors);

    const result: ExtractedDesignTokens = {
      logoUrl,
      faviconUrl,
      primaryColor: primary,
      secondaryColor: secondary,
      fonts: fonts.length > 0 ? fonts : ['Inter', 'Roboto', 'Arial'],
      companyName: extractCompanyName(url),
      confidenceScores: {
        logo: logoUrl && !logoUrl.includes('clearbit') ? 0.8 : 0.4,
        colors: colors.length > 2 ? 0.7 : 0.5,
        fonts: fonts.length > 0 ? 0.6 : 0.4
      }
    };

    console.log('Extracted design tokens:', result);
    return result;
  } catch (error) {
    console.error('Error extracting design tokens:', error);
    
    // Return fallback values
    return {
      logoUrl: undefined,
      faviconUrl: undefined,
      primaryColor: '#1A73E8',
      secondaryColor: '#F5F5F5',
      fonts: ['Inter', 'Roboto', 'Arial'],
      companyName: extractCompanyName(url),
      confidenceScores: {
        logo: 0.1,
        colors: 0.1,
        fonts: 0.1
      }
    };
  }
}

/**
 * Create a simple proxy endpoint for CORS-restricted requests
 * This should be implemented as an API route
 */
export function createDesignTokenProxy() {
  // This function would be used to create the API proxy endpoint
  // Implementation would be in an API route file
  return `
// app/api/design-tokens/proxy/route.ts
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const url = searchParams.get('url');
  
  if (!url) {
    return NextResponse.json({ error: "URL is required" }, { status: 400 });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });
    
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch URL" }, { status: response.status });
    }
    
    const html = await response.text();
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      }
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to proxy request" }, { status: 500 });
  }
}
`;
}