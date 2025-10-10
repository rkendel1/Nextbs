"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WhiteLabelLayout from "@/components/WhiteLabel/WhiteLabelLayout";
import Link from "next/link";
import Image from "next/image";
import { EmbedViewer } from "@/components/EmbedViewer";

interface Tier {
  id: string;
  name: string;
  description?: string;
  priceAmount: number;
  billingPeriod: string;
  features: string[];
  stripePriceId?: string;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  tiers: Tier[];
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

const WhiteLabelProductDetails = () => {
  const params = useParams();
  const domain = params.domain as string;
  const productId = params.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [domain, productId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`/api/saas/whitelabel/creator-by-domain?domain=${encodeURIComponent(domain)}`);
      
      if (!response.ok) {
        throw new Error('Creator not found');
      }
      
      const data = await response.json();
      const fullCreator = {
        ...data.creator,
        whiteLabel: data.whiteLabel,
        designTokens: data.designTokens,
      };

      setCreator(fullCreator);

      const foundProduct = fullCreator.products.find((p: Product) => p.id === productId);
      if (!foundProduct) {
        throw new Error('Product not found');
      }
      setProduct(foundProduct);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (tierId: string) => {
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

  if (error || !product || !creator) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Product Not Found</h1>
            <p className="text-gray-600">{error || 'This product is not available.'}</p>
            <Link href={`/whitelabel/${domain}/products`} className="mt-4 inline-block text-blue-600 hover:underline">
              Back to Products
            </Link>
          </div>
        </div>
      </WhiteLabelLayout>
    );
  }

  const primaryColor = creator.whiteLabel?.primaryColor || creator.designTokens?.primaryColor || '#667eea';
  const secondaryColor = creator.whiteLabel?.secondaryColor || creator.designTokens?.secondaryColor || '#f5f5f5';

  return (
    <WhiteLabelLayout domain={domain}>
      <div className="min-h-screen py-12" style={{ backgroundColor: secondaryColor }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <Link href={`/whitelabel/${domain}/products`} className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-4">
              ← Back to Products
            </Link>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">{product.name}</h1>
            {product.description && (
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">{product.description}</p>
            )}
          </div>

          {/* Pricing Tiers */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {product.tiers.map((tier) => (
              <div key={tier.id} className="bg-white rounded-lg shadow-lg overflow-hidden border-t-4" style={{ borderTopColor: primaryColor }}>
                <div className="p-6">
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">{tier.name}</h3>
                  {tier.description && (
                    <p className="text-gray-600 mb-4">{tier.description}</p>
                  )}
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    ${(tier.priceAmount / 100).toFixed(0)}
                    <span className="text-lg font-normal text-gray-600">/{tier.billingPeriod}</span>
                  </div>
                  
                  {/* Features */}
                  {tier.features.length > 0 && (
                    <ul className="space-y-2 mb-6">
                      {tier.features.map((feature, index) => (
                        <li key={index} className="flex items-start">
                          <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Subscribe Button */}
                  <button
                    onClick={() => handleSubscribe(tier.id)}
                    disabled={submitting}
                    className="w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {submitting ? 'Processing...' : 'Checkout'}
                  </button>

                  {error && (
                    <p className="text-red-600 text-sm mt-2 text-center">{error}</p>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Embed Section */}
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Embed this Product</h2>
            <p className="text-gray-600 mb-4">Add this product to your website with our embed code.</p>
            <EmbedViewer product={product} saasCreator={creator} />
          </div>

          {/* Contact Section */}
          <div className="mt-12 text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Need Help?</h3>
            <p className="text-gray-600 mb-6">Contact us for more information or custom pricing.</p>
            <a
              href={`mailto:${creator.user.email}`}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Contact Support
            </a>
          </div>
        </div>
      </div>
    </WhiteLabelLayout>
  );
};

export default WhiteLabelProductDetails;