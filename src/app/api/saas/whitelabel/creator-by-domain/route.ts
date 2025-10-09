import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/utils/prismaDB";

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

    // For local development, use the first available creator or a test creator
    if (isLocalDomain && process.env.NODE_ENV === 'development') {
      // Try to find a creator with a configured white label
      const devWhiteLabelConfig = await prisma.whiteLabelConfig.findFirst({
        where: { isActive: true },
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
              }
            }
          }
        }
      });

      if (devWhiteLabelConfig) {
        const fonts = devWhiteLabelConfig.saasCreator.fonts 
          ? JSON.parse(devWhiteLabelConfig.saasCreator.fonts) 
          : null;

        return NextResponse.json({
          creator: {
            ...devWhiteLabelConfig.saasCreator,
            user: devWhiteLabelConfig.saasCreator.user
          },
          whiteLabel: {
            brandName: devWhiteLabelConfig.brandName,
            primaryColor: devWhiteLabelConfig.primaryColor,
            secondaryColor: devWhiteLabelConfig.secondaryColor,
            logoUrl: devWhiteLabelConfig.logoUrl,
            faviconUrl: devWhiteLabelConfig.faviconUrl,
            customDomain: devWhiteLabelConfig.customDomain,
            subdomain: devWhiteLabelConfig.subdomain,
            customCss: devWhiteLabelConfig.customCss,
            isActive: devWhiteLabelConfig.isActive,
          },
          designTokens: {
            fonts: fonts,
            primaryColor: devWhiteLabelConfig.saasCreator.primaryColor,
            secondaryColor: devWhiteLabelConfig.saasCreator.secondaryColor,
            logoUrl: devWhiteLabelConfig.saasCreator.logoUrl,
            faviconUrl: devWhiteLabelConfig.saasCreator.faviconUrl,
            voiceAndTone: devWhiteLabelConfig.saasCreator.voiceAndTone,
          }
        });
      }
    }

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

    // Parse design tokens from SaasCreator
    const fonts = whiteLabelConfig.saasCreator.fonts 
      ? JSON.parse(whiteLabelConfig.saasCreator.fonts) 
      : null;

    // Return the creator data with white label config and design tokens
    return NextResponse.json({
      creator: {
        ...whiteLabelConfig.saasCreator,
        user: whiteLabelConfig.saasCreator.user
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
        isActive: whiteLabelConfig.isActive,
      },
      designTokens: {
        fonts: fonts,
        primaryColor: whiteLabelConfig.saasCreator.primaryColor,
        secondaryColor: whiteLabelConfig.saasCreator.secondaryColor,
        logoUrl: whiteLabelConfig.saasCreator.logoUrl,
        faviconUrl: whiteLabelConfig.saasCreator.faviconUrl,
        voiceAndTone: whiteLabelConfig.saasCreator.voiceAndTone,
      }
    });

  } catch (error: any) {
    console.error("Error fetching creator by domain:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch creator information" },
      { status: 500 }
    );
  }
}