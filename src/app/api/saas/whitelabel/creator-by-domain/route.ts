import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prismaDB";

interface Hero {
  title: string;
  subtitle?: string;
  image?: string | null;
  cta?: { label: string; href: string } | null;
}

interface SectionItem {
  name: string;
  image?: string | null;
  href: string;
}

interface Section {
  type: 'content' | 'categoryGrid';
  title: string;
  paragraphs?: string[];
  items?: SectionItem[];
}

interface UnifiedStructure {
  hero: Hero;
  sections: Section[];
}

// GET /api/saas/whitelabel/creator-by-domain?domain=example.com
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');
    
    if (!domain) {
      return NextResponse.json(
        { error: "Domain parameter is required" },
        { status: 400 }
      );
    }

    // Check if this is a local/development domain
    const isLocalDomain = domain.includes('localhost') || 
                          domain.includes('127.0.0.1') || 
                          domain.includes('0.0.0.0') ||
                          domain.startsWith('192.168.');

    // Always query by domain, even in local dev for test subdomains
    // Try to find creator by custom domain first
    let whiteLabelConfig = await prisma.whiteLabelConfig.findFirst({
      where: {
        customDomain: domain,
        isActive: true,
      },
      include: {
        saasCreator: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              }
            },
            products: {
              where: { isActive: true },
              include: {
                tiers: {
                  where: { isActive: true },
                  orderBy: { sortOrder: 'asc' }
                },
                meteringConfig: true,
              },
              orderBy: { createdAt: 'desc' }
            },
            stripeAccount: {
              select: {
                stripeAccountId: true,
                isActive: true,
              }
            },
            scrapedSite: {
              include: {
                designTokens: { take: 20 },
                brandVoice: true,
                scrapedProducts: true,
                companyInfo: true
              }
            }
          }
        }
      }
    });

    // If not found by custom domain, try subdomain
    if (!whiteLabelConfig) {
      // Extract subdomain from domain
      const subdomain = domain.split('.')[0];
      
      whiteLabelConfig = await prisma.whiteLabelConfig.findFirst({
        where: {
          subdomain: subdomain,
          isActive: true,
        },
        include: {
          saasCreator: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                }
              },
              products: {
                where: { isActive: true },
                include: {
                  tiers: {
                    where: { isActive: true },
                    orderBy: { sortOrder: 'asc' }
                  },
                  meteringConfig: true,
                },
                orderBy: { createdAt: 'desc' }
              },
              stripeAccount: {
                select: {
                  stripeAccountId: true,
                  isActive: true,
                }
              },
              scrapedSite: {
                include: {
                  designTokens: { take: 20 },
                  brandVoice: true,
                  scrapedProducts: true,
                  companyInfo: true
                }
              }
            }
          }
        }
      });
    }

    if (!whiteLabelConfig) {
      return NextResponse.json(
        { error: "Creator not found for this domain" },
        { status: 404 }
      );
    }

    const saasCreator = whiteLabelConfig.saasCreator;

    // Reconcile unified data if scrapes available
    let unifiedData = null;
    if (saasCreator.lightweightScrape && saasCreator.deepDesignTokens) {
      try {
        let lightweight = {};
        if (typeof saasCreator.lightweightScrape === 'string') {
          lightweight = JSON.parse(saasCreator.lightweightScrape);
        }
        let deep = {};
        if (typeof saasCreator.deepDesignTokens === 'string') {
          deep = JSON.parse(saasCreator.deepDesignTokens);
        }
        const scrapedSite = saasCreator.scrapedSite || {};
        const brandVoice = (scrapedSite as any)?.brandVoice || { tone: 'neutral', themes: [] };
        const scrapedProducts = (scrapedSite as any)?.scrapedProducts || [];

        // Parse structure from lightweight
        const structure: UnifiedStructure = {
          hero: {
            title: (lightweight as any).headings?.[0] || saasCreator.businessName,
            subtitle: (lightweight as any).headings?.[1] || saasCreator.businessDescription || saasCreator.voiceAndTone,
            image: (lightweight as any).images?.[0]?.src || null,
            cta: (lightweight as any).links?.[0] ? { label: (lightweight as any).links[0].text, href: (lightweight as any).links[0].href } : null
          },
          sections: []
        };

        // Create up to 4 sections: alternate content and categoryGrid
        for (let i = 2; i < Math.min((lightweight as any).headings?.length || 0, 6); i += 2) {
          const title = (lightweight as any).headings?.[i] || `Section ${i/2 + 1}`;
          let sectionType: 'content' | 'categoryGrid' = 'content';
          const data: { title: string; paragraphs?: string[]; items?: SectionItem[] } = { title };

          if (scrapedProducts.length > 0 && i % 4 === 2) {
            sectionType = 'categoryGrid';
            data.items = scrapedProducts.slice((i-2)/2 * 3, (i-2)/2 * 3 + 3).map((p: any) => ({
              name: p.name,
              image: (p.metadata as any)?.image || (lightweight as any).images?.[i]?.src || null,
              href: p.productUrl || (lightweight as any).links?.[i]?.href || '#'
            }));
          } else {
            data.paragraphs = [(lightweight as any).mainText?.substring(0, 200) || 'Discover our offerings.'];
          }

          structure.sections.push({ type: sectionType, ...data });
        }

        // Format deepDesignTokens
        const deepDesignTokens = {
          color: {
            brand: { primary: saasCreator.primaryColor || (deep as any).majorColors?.text || '#F96302' },
            text: { primary: (deep as any).majorColors?.text || '#111' },
            background: { default: (deep as any).majorColors?.background || '#fff' },
            link: { default: (deep as any).majorColors?.link || '#0645AD' }
          },
          font: {
            family: { primary: (deep as any).majorFonts?.[0] || (JSON.parse(saasCreator.fonts || '[]'))[0] || 'Inter, sans-serif' },
            size: { body: '16px', heading: '32px' },
            weight: { heading: 700 }
          },
          spacing: { scale: (deep as any).spacingScale || ['8px', '16px', '24px', '32px'] },
          radius: { card: '8px' },
          brandVoice: {
            tone: brandVoice.tone || (lightweight as any).tone || 'neutral',
            themes: brandVoice.themes || []
          }
        };

        unifiedData = {
          meta: {
            source: saasCreator.website,
            timestamp: saasCreator.crawlCompletedAt?.toISOString() || new Date().toISOString()
          },
          structure,
          deepDesignTokens
        };
      } catch (parseError) {
        console.error('Error reconciling unified data:', parseError);
        unifiedData = null;
      }
    }

    // Check visibility settings
    if (whiteLabelConfig.pageVisibility === 'private') {
      return NextResponse.json(
        { error: "This white label page is currently private" },
        { status: 403 }
      );
    }

    // For unlisted pages, we still allow access but could add noindex meta tags in the frontend
    // This is just a data check - the frontend can handle adding noindex meta tags

    // Parse design tokens from SaasCreator
    const fonts = saasCreator.fonts 
      ? JSON.parse(saasCreator.fonts) 
      : null;

    // Return the creator data with white label config and design tokens
    return NextResponse.json({
      creator: {
        ...saasCreator,
        user: saasCreator.user
      },
      whiteLabel: {
        brandName: whiteLabelConfig.brandName,
        primaryColor: whiteLabelConfig.primaryColor,
        secondaryColor: whiteLabelConfig.secondaryColor,
        logoUrl: whiteLabelConfig.logoUrl,
        faviconUrl: whiteLabelConfig.faviconUrl,
        customDomain: whiteLabelConfig.customDomain,
        subdomain: whiteLabelConfig.subdomain,
        customCss: whiteLabelConfig.customCss,
        successRedirect: whiteLabelConfig.successRedirect,
        isActive: whiteLabelConfig.isActive,
        pageVisibility: whiteLabelConfig.pageVisibility,
      },
      designTokens: {
        fonts: fonts,
        primaryColor: saasCreator.primaryColor,
        secondaryColor: saasCreator.secondaryColor,
        logoUrl: saasCreator.logoUrl,
        faviconUrl: saasCreator.faviconUrl,
        voiceAndTone: saasCreator.voiceAndTone,
      },
      unifiedData
    });

  } catch (error: any) {
    console.error("Error fetching creator by domain:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch creator information" },
      { status: 500 }
    );
  }
}