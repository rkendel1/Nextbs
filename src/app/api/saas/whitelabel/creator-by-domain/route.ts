import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/utils/prismaDB';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const domain = searchParams.get('domain');

    if (!domain) {
      return NextResponse.json({ error: 'Domain parameter required' }, { status: 400 });
    }

    // Find saasCreator by subdomain or customDomain match (case-insensitive)
    const saasCreator = await prisma.saasCreator.findFirst({
      where: {
        OR: [
          {
            whiteLabelConfig: {
              subdomain: {
                equals: domain,
                mode: 'insensitive'
              }
            }
          },
          {
            whiteLabelConfig: {
              customDomain: {
                equals: domain,
                mode: 'insensitive'
              }
            }
          }
        ]
      },
      include: {
        user: true,
        products: {
          include: {
            tiers: true
          }
        },
        whiteLabelConfig: true,
        designVersions: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!saasCreator) {
      return NextResponse.json({ error: 'Creator not found for domain' }, { status: 404 });
    }

    // Extract design tokens from latest version or fallback
    let designTokens = null;
    let unifiedData = null;
    if (saasCreator?.designVersions?.length > 0) {
      const latestVersion = saasCreator.designVersions[0];
      designTokens = latestVersion.scrapeJson?.designTokens || null;
      // Basic unified structure from scrape (expand as needed)
      unifiedData = {
        meta: {
          source: 'scrape',
          timestamp: latestVersion.createdAt.toISOString()
        },
        structure: {
          hero: {
            title: saasCreator.businessName,
            subtitle: saasCreator.businessDescription || 'Welcome to our platform'
          },
          sections: [
            {
              type: 'content',
              title: 'About Us',
              paragraphs: [saasCreator.businessDescription || 'We provide innovative solutions.']
            }
          ]
        },
        deepDesignTokens: designTokens || {
          color: { brand: { primary: saasCreator.whiteLabelConfig?.primaryColor || '#667eea' } },
          font: { family: { primary: 'Inter, sans-serif' } }
        }
      };
    }

    const whiteLabel = saasCreator?.whiteLabelConfig || {
      brandName: saasCreator?.businessName,
      primaryColor: '#667eea',
      secondaryColor: '#f5f5f5',
      logoUrl: null,
      pageVisibility: 'public'
    };

    return NextResponse.json({
      creator: {
        id: saasCreator.id,
        businessName: saasCreator.businessName,
        businessDescription: saasCreator.businessDescription,
        website: saasCreator.website,
        products: saasCreator.products || []
      },
      whiteLabel,
      designTokens,
      unifiedData
    });
  } catch (error) {
    console.error('Error fetching creator by domain:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}