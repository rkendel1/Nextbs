"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WhiteLabelLayout from "@/components/WhiteLabel/WhiteLabelLayout";
import Link from "next/link";

interface Tier {
  id: string;
  name: string;
  description?: string;
  priceAmount: number;
  billingPeriod: string;
  features: string[];
  usageLimit?: number;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  tiers: Tier[];
  meteringConfig?: {
    meteringType: string;
    meteringUnit: string;
    aggregationType: string;
  };
}

interface CreatorData {
  id: string;
  businessName: string;
  businessDescription?: string;
  website?: string;
  products: Product[];
  user: {
    id: string;
    name?: string;
    email: string;
  };
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

const BrandedProducts = () => {
  const params = useParams();
  const domain = params.domain as string;
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setCreator({
        ...data.creator,
        whiteLabel: data.whiteLabel,
        designTokens: data.designTokens,
      });
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (productId: string, tierId: string) => {
    if (submitting) return;
    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/whitelabel/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId, tierId, domain }),
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Failed to create subscription');
      }

      const { url } = await response.json();
      if (url) {
        window.location.href = url;
      } else {
        throw new Error('No checkout URL received');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Subscription failed');
    } finally {
      setSubmitting(false);
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
  const activeProducts = creator?.products?.filter(product => product.isActive && product.tiers.length > 0) || [];

  return (
    <WhiteLabelLayout domain={domain}>
      <div className="min-h-screen py-12" style={{ backgroundColor: secondaryColor }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Our Products
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect solution for your business needs
            </p>
          </div>

          {/* Products Grid */}
          {activeProducts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 mb-12">
              {activeProducts.map((product) => (
                <div 
                  key={product.id} 
                  className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4"
                  style={{ borderTopColor: primaryColor }}
                >
                  <div className="p-6">
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                      {product.name}
                    </h3>
                    {product.description && (
                      <p className="text-gray-600 mb-6">
                        {product.description}
                      </p>
                    )}
                    
                    {/* Pricing Tiers */}
                    <div className="space-y-4 mb-6">
                      {product.tiers.map((tier) => (
                        <div key={tier.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-semibold text-gray-900">{tier.name}</h4>
                            <div className="text-right">
                              <span className="text-2xl font-bold text-gray-900">
                                ${(tier.priceAmount / 100).toFixed(0)}
                              </span>
                              <span className="text-gray-600 text-sm ml-1">
                                /{tier.billingPeriod}
                              </span>
                            </div>
                          </div>
                          
                          {tier.description && (
                            <p className="text-sm text-gray-600 mb-3">{tier.description}</p>
                          )}
                          
                          {/* Features */}
                          {tier.features.length > 0 && (
                            <ul className="space-y-1">
                              {tier.features.map((feature, index) => (
                                <li key={index} className="flex items-start">
                                  <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                  <span className="text-sm text-gray-700">{feature}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* CTA Button */}
                    <button
                      onClick={() => handleSubscribe(product.id, product.tiers[0].id)}
                      disabled={submitting}
                      className="block w-full text-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{ backgroundColor: primaryColor }}
                    >
                      {submitting ? 'Processing...' : 'Checkout'}
                    </button>

                    {/* Embed Section */}
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h4 className="text-lg font-semibold text-gray-900 mb-3">Embed this product</h4>
                      <p className="text-sm text-gray-600 mb-3">Copy the embed code to add this product to your site.</p>
                      <textarea
                        readOnly
                        value={`<iframe src="/embed/product/${product.id}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>`}
                        className="w-full p-2 border border-gray-300 rounded-md text-sm mb-3 resize-none bg-gray-50"
                        rows={3}
                      />
                      <div className="border rounded-md overflow-hidden">
                        <iframe
                          src={`/embed/product/${product.id}`}
                          width="100%"
                          height="600"
                          style={{ border: 'none' }}
                          loading="lazy"
                          allowFullScreen
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
                <div className="text-gray-400 mb-4">
                  <svg className="h-16 w-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Products Available</h3>
                <p className="text-gray-600">
                  No active products are currently available. Please check back later!
                </p>
              </div>
            </div>
          )}

          {/* Contact Section */}
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Have Questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Contact us for more information about our products and pricing.
            </p>
            <a
              href={`mailto:${creator.user?.email}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Contact Us
            </a>
          </div>
        </div>
      </div>
    </WhiteLabelLayout>
  );
};

export default BrandedProducts;