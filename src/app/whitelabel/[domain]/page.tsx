"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
import WhiteLabelLayout from "@/components/WhiteLabel/WhiteLabelLayout";
import Hero from "@/components/WhiteLabel/Hero";
import DynamicSection from "@/components/WhiteLabel/DynamicSection";
import ProductsSection from "@/components/WhiteLabel/ProductsSection";
import CTASection from "@/components/WhiteLabel/CTASection";
import Link from "next/link";
import Image from "next/image";

interface HeroData {
  title: string;
  subtitle?: string;
  image?: string | null;
  cta?: { label: string; href: string } | null;
}

interface SectionData {
  type: 'content' | 'categoryGrid';
  title: string;
  paragraphs?: string[];
  items?: { name: string; image?: string | null; href: string }[];
}

interface UnifiedStructure {
  hero: HeroData;
  sections: SectionData[];
}

interface DeepDesignTokens {
  color: {
    brand: { primary: string };
    text: { primary: string };
    background: { default: string };
    link: { default: string };
  };
  font: {
    family: { primary: string };
    size: { body: string; heading: string };
    weight: { heading: number };
  };
  spacing: { scale: string[] };
  radius: { card: string };
  brandVoice: { tone: string; themes: string[] };
}

interface UnifiedData {
  meta: {
    source: string;
    timestamp: string;
  };
  structure: UnifiedStructure;
  deepDesignTokens: DeepDesignTokens;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  tiers: Array<{
    id: string;
    name: string;
    priceAmount: number;
    billingPeriod: string;
    features: string[];
  }>;
}

interface CreatorData {
  id: string;
  businessName: string;
  businessDescription?: string;
  website?: string;
  primaryLogo?: string;
  products: Product[];
  user?: {
    id: string;
    name?: string;
    email: string;
  };
  whiteLabel: {
    brandName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    pageVisibility?: 'public' | 'private' | 'unlisted';
  };
  designTokens?: {
    fonts?: string[];
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    voiceAndTone?: string;
  };
}

interface Product {
  id: string;
  name: string;
  description?: string;
  tiers: Array<{
    id: string;
    name: string;
    priceAmount: number;
    billingPeriod: string;
    features: string[];
  }>;
}

interface CreatorData {
  id: string;
  businessName: string;
  businessDescription?: string;
  website?: string;
  products: Product[];
  whiteLabel: {
    brandName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    pageVisibility?: 'public' | 'private' | 'unlisted';
  };
  designTokens?: {
    fonts?: string[];
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
    faviconUrl?: string;
    voiceAndTone?: string;
  };
}

const WhiteLabelHomepage = () => {
  const params = useParams();
  const domain = params.domain as string;
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [whiteLabel, setWhiteLabel] = useState<any>(null);
  const [designTokens, setDesignTokens] = useState<any>(null);
  const [unifiedData, setUnifiedData] = useState<UnifiedData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchCreatorData = async () => {
    try {
      const response = await fetch(`/api/saas/whitelabel/creator-by-domain?domain=${encodeURIComponent(domain)}`);
      
      if (!response.ok) {
        throw new Error('Creator not found');
      }
      
      const data = await response.json();
      setCreator(data.creator);
      setWhiteLabel(data.whiteLabel);
      setDesignTokens(data.designTokens);
      setUnifiedData(data.unifiedData);
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorData();
  }, [domain]);

  if (loading) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-text-primary)]"></div>
        </div>
      </WhiteLabelLayout>
    );
  }

  if (!creator) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[var(--color-text-primary)] mb-2">Creator Not Found</h1>
            <p className="text-[var(--color-text-primary)] opacity-70">This domain is not associated with any creator.</p>
          </div>
        </div>
      </WhiteLabelLayout>
    );
  }

  let primaryColor = whiteLabel?.primaryColor || designTokens?.primaryColor || '#667eea';
  let secondaryColor = whiteLabel?.secondaryColor || designTokens?.secondaryColor || '#f5f5f5';
  const brandName = whiteLabel?.brandName || creator.businessName;

  // Create a gradient color based on primary and secondary colors
  const gradientFrom = secondaryColor;
  const gradientTo = `${primaryColor}15`; // 15% opacity of primary color for subtle branding

  if (unifiedData?.structure) {
    const { hero, sections } = unifiedData.structure;
    const theme = unifiedData.deepDesignTokens;
    const brandVoice = theme?.brandVoice;

    // Extract tokens for CSS vars
    const primaryLogo = creator.primaryLogo || designTokens?.logoUrl;
    primaryColor = theme.color?.brand.primary || whiteLabel?.primaryColor || '#667eea';
    const fontFamily = theme.font?.family.primary || designTokens?.fonts?.[0] || 'sans-serif';
    const spacingSm = theme.spacing?.scale?.[0] || '1rem';

    // Adapt hero subtitle based on tone
    let adaptedSubtitle = hero.subtitle;
    if (brandVoice?.tone === 'friendly') {
      adaptedSubtitle = (adaptedSubtitle || '') + ' Let\'s get started!';
    }

    return (
      <>
        {whiteLabel?.pageVisibility === 'unlisted' && (
          <Head>
            <meta name="robots" content="noindex, nofollow" />
          </Head>
        )}
        <style jsx global>{`
          :root {
            --primary-color: ${primaryColor};
            --brand-font: ${fontFamily};
            --spacing-sm: ${spacingSm};
            --brand-logo: url(${primaryLogo});
          }
          .brand-logo {
            max-width: 150px;
            height: auto;
          }
        `}</style>
        <WhiteLabelLayout domain={domain} unifiedData={unifiedData}>
          <div className="min-h-screen">
            {/* Dynamic Hero */}
            <Hero data={{ ...hero, subtitle: adaptedSubtitle }} />

            {/* Dynamic Sections */}
            {sections.map((section, i) => (
              <DynamicSection key={i} data={section} />
            ))}

            {/* Products Section (from DB, if available) */}
            {creator.products && creator.products.length > 0 && (
              <ProductsSection products={creator.products} primaryColor={primaryColor} />
            )}

            {/* CTA Section */}
            <CTASection brandVoice={brandVoice} primaryColor={primaryColor} secondaryColor={secondaryColor} />
          </div>
        </WhiteLabelLayout>
      </>
    );
  }

  // Fallback to static layout
  let staticSubtitle = creator.businessDescription;
  if (designTokens?.voiceAndTone && !creator.businessDescription && designTokens.voiceAndTone.includes('friendly')) {
    staticSubtitle = designTokens.voiceAndTone + '!';
  }

  const primaryLogo = creator.primaryLogo || designTokens?.logoUrl;
  const fontFamily = designTokens?.fonts?.[0] || 'sans-serif';

  return (
    <>
      {whiteLabel?.pageVisibility === 'unlisted' && (
        <Head>
          <meta name="robots" content="noindex, nofollow" />
        </Head>
      )}
      <style jsx global>{`
        :root {
          --primary-color: ${primaryColor};
          --secondary-color: ${secondaryColor};
          --brand-font: ${fontFamily};
          --brand-logo: url(${primaryLogo});
        }
        .brand-logo {
          max-width: 150px;
          height: auto;
        }
      `}</style>
      <WhiteLabelLayout domain={domain} config={whiteLabel} creator={{ ...creator, user: creator.user || { id: creator.id, name: creator.businessName, email: `contact@${domain}` } }} designTokens={designTokens}>
        <div className="min-h-screen bg-[var(--color-background-default)]">
        {/* Hero Section */}
        <section 
          className="relative py-[var(--space-3)]"
          style={{
            background: `linear-gradient(135deg, ${secondaryColor} 0%, ${primaryColor}15 100%)`
          }}
        >
          <div className="max-w-7xl mx-auto px-[var(--space-3)] sm:px-[var(--space-3)] lg:px-[var(--space-3)]">
            <div className="text-center">
              {primaryLogo && (
                <div className="mb-[var(--space-2)] mx-auto">
                  <img src={primaryLogo} alt={brandName} className="brand-logo mx-auto" />
                </div>
              )}
              <h1 className="text-[var(--font-size-heading)] md:text-[calc(var(--font-size-heading)*1.5)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] mb-[var(--space-2)]" style={{ fontFamily: 'var(--brand-font)' }}>
                Welcome to {brandName}
              </h1>
              {staticSubtitle && (
                <p className="text-[var(--font-size-body)] text-[var(--color-text-primary)] mb-[var(--space-3)] max-w-3xl mx-auto">
                  {staticSubtitle}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-[var(--space-1)] justify-center">
                <Link
                  href={`/whitelabel/${domain}/products`}
                  className="inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] border border-transparent text-base font-medium rounded-[var(--radius-card)] text-[var(--color-background-default)] hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  View Products
                </Link>
                {creator.website && (
                  <a
                    href={creator.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] border border-[var(--color-text-primary)] opacity-70 text-base font-medium rounded-[var(--radius-card)] text-[var(--color-text-primary)] bg-[var(--color-background-default)] hover:bg-[var(--color-secondary)]"
                  >
                    Visit Website
                  </a>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        {creator.products && creator.products.length > 0 && (
          <section className="py-[var(--space-3)]" style={{ backgroundColor: secondaryColor }}>
            <div className="max-w-7xl mx-auto px-[var(--space-3)] sm:px-[var(--space-3)] lg:px-[var(--space-3)]">
              <div className="text-center mb-[var(--space-3)]">
                <h2 className="text-[var(--font-size-heading)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] mb-[var(--space-1)]">
                  Our Products
                </h2>
                <p className="text-[var(--font-size-body)] text-[var(--color-text-primary)] opacity-70">
                  Discover our range of solutions designed for your business
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-2)]">
                {creator.products.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-[var(--color-background-default)] rounded-[var(--radius-card)] shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-t-4"
                    style={{ borderTopColor: primaryColor }}
                  >
                    <div className="p-[var(--space-2)]">
                      <h3 className="text-[var(--font-size-body)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] mb-[var(--space-1)]">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-[var(--color-text-primary)] opacity-70 mb-[var(--space-1)] line-clamp-3">
                          {product.description}
                        </p>
                      )}
                      
                      {product.tiers && product.tiers.length > 0 && (
                        <div className="mb-[var(--space-1)]">
                          <p className="text-sm text-[var(--color-text-primary)] opacity-70 mb-[var(--space-0)]">Starting from:</p>
                          <div className="flex items-baseline">
                            <span className="text-[var(--font-size-heading)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)]">
                              ${(product.tiers[0].priceAmount / 100).toFixed(0)}
                            </span>
                            <span className="text-[var(--color-text-primary)] opacity-70 ml-1">
                              /{product.tiers[0].billingPeriod}
                            </span>
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/whitelabel/${domain}/products/${product.id}`}
                        className="block w-full text-center px-[var(--space-1)] py-[var(--space-0)] border border-transparent text-sm font-medium rounded-[var(--radius-card)] text-[var(--color-background-default)] hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-[var(--space-2)]">
                <Link
                  href={`/whitelabel/${domain}/products`}
                  className="inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] border border-[var(--color-text-primary)] opacity-70 text-base font-medium rounded-[var(--radius-card)] text-[var(--color-text-primary)] bg-[var(--color-background-default)] hover:bg-[var(--color-secondary)]"
                >
                  View All Products
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section 
          className="py-[var(--space-3)]" 
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` 
          }}
        >
          <div className="max-w-7xl mx-auto px-[var(--space-3)] sm:px-[var(--space-3)] lg:px-[var(--space-3)] text-center">
            <h2 className="text-[var(--font-size-heading)] font-[var(--font-weight-heading)] text-[var(--color-background-default)] mb-[var(--space-1)]">
              Ready to Get Started?
            </h2>
            <p className="text-[var(--font-size-body)] text-[var(--color-background-default)] opacity-90 mb-[var(--space-2)]">
              Join thousands of businesses already using our platform
            </p>
            <Link
              href={`/whitelabel/${domain}/products`}
              className="inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] border-2 border-[var(--color-background-default)] text-base font-medium rounded-[var(--radius-card)] hover:bg-[var(--color-background-default)] transition-colors"
              style={{ 
                color: primaryColor,
                backgroundColor: 'var(--color-background-default)'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = secondaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'var(--color-background-default)';
              }}
            >
              Explore Products
            </Link>
          </div>
        </section>
      </div>
    </WhiteLabelLayout>
    </>
  );
};

export default WhiteLabelHomepage;