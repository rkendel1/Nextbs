"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WhiteLabelLayout from "@/components/WhiteLabel/WhiteLabelLayout";
import Link from "next/link";
import Image from "next/image";

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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCreatorData();
  }, [domain]);

  const fetchCreatorData = async () => {
    try {
      const response = await fetch(`/api/saas/whitelabel/creator-by-domain?domain=${encodeURIComponent(domain)}`);
      
      if (!response.ok) {
        throw new Error('Creator not found');
      }
      
      const data = await response.json();
      setCreator(data);
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </WhiteLabelLayout>
    );
  }

  if (!creator) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Creator Not Found</h1>
            <p className="text-gray-600">This domain is not associated with any creator.</p>
          </div>
        </div>
      </WhiteLabelLayout>
    );
  }

  const primaryColor = creator.whiteLabel?.primaryColor || creator.designTokens?.primaryColor || '#667eea';
  const secondaryColor = creator.whiteLabel?.secondaryColor || creator.designTokens?.secondaryColor || '#f5f5f5';
  const brandName = creator.whiteLabel?.brandName || creator.businessName;

  // Create a gradient color based on primary and secondary colors
  const gradientFrom = secondaryColor;
  const gradientTo = `${primaryColor}15`; // 15% opacity of primary color for subtle branding

  return (
    <WhiteLabelLayout domain={domain}>
      <div className="min-h-screen bg-white">
        {/* Hero Section */}
        <section 
          className="relative py-20"
          style={{
            background: `linear-gradient(135deg, ${gradientFrom} 0%, ${gradientTo} 100%)`
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
                Welcome to {brandName}
              </h1>
              {creator.businessDescription && (
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  {creator.businessDescription}
                </p>
              )}
              {/* Show voice and tone message if available */}
              {!creator.businessDescription && creator.designTokens?.voiceAndTone && (
                <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  {creator.designTokens.voiceAndTone}
                </p>
              )}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href={`/${domain}/products`}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  View Products
                </Link>
                {creator.website && (
                  <a
                    href={creator.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
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
          <section className="py-20" style={{ backgroundColor: secondaryColor }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="text-center mb-16">
                <h2 className="text-3xl font-bold text-gray-900 mb-4">
                  Our Products
                </h2>
                <p className="text-xl text-gray-600">
                  Discover our range of solutions designed for your business
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {creator.products.map((product) => (
                  <div 
                    key={product.id} 
                    className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-t-4"
                    style={{ borderTopColor: primaryColor }}
                  >
                    <div className="p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-3">
                        {product.name}
                      </h3>
                      {product.description && (
                        <p className="text-gray-600 mb-4 line-clamp-3">
                          {product.description}
                        </p>
                      )}
                      
                      {product.tiers && product.tiers.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm text-gray-500 mb-2">Starting from:</p>
                          <div className="flex items-baseline">
                            <span className="text-2xl font-bold text-gray-900">
                              ${(product.tiers[0].priceAmount / 100).toFixed(0)}
                            </span>
                            <span className="text-gray-600 ml-1">
                              /{product.tiers[0].billingPeriod}
                            </span>
                          </div>
                        </div>
                      )}

                      <Link
                        href={`/${domain}/products/${product.id}`}
                        className="block w-full text-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: primaryColor }}
                      >
                        Learn More
                      </Link>
                    </div>
                  </div>
                ))}
              </div>

              <div className="text-center mt-12">
                <Link
                  href={`/${domain}/products`}
                  className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                >
                  View All Products
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section 
          className="py-20" 
          style={{ 
            background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` 
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-white opacity-90 mb-8">
              Join thousands of businesses already using our platform
            </p>
            <Link
              href={`/${domain}/products`}
              className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md hover:bg-white transition-colors"
              style={{ 
                color: primaryColor,
                backgroundColor: 'white'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = secondaryColor;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Explore Products
            </Link>
          </div>
        </section>
      </div>
    </WhiteLabelLayout>
  );
};

export default WhiteLabelHomepage;