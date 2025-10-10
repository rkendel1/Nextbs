"use client";

import Link from "next/link";

interface Tier {
  id: string;
  productId?: string;
  name: string;
  description?: string;
  priceAmount: number;
  billingPeriod: string;
  features: string[];
  usageLimit?: number;
  stripePriceId?: string;
  isActive?: boolean;
  sortOrder?: number;
  createdAt?: Date;
  updatedAt?: Date;
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

const TestProducts = () => {
  // Hardcoded data from API response for domain='s'
  const creator: CreatorData = {
    id: "cmgjs22an000i11zjcvpwpkc2",
    businessName: "s",
    businessDescription: "",
    website: "",
    products: [
      {
        id: "cmgjs22an000i11zjcvpwpkc2",
        saasCreatorId: "cmgjs22an000i11zjcvpwpkc2",
        name: "Test Product",
        description: "Example product that should display on the products page",
        isActive: true,
        stripePriceId: null,
        stripeProductId: null,
        createdAt: new Date("2025-10-10T13:18:50.417Z"),
        updatedAt: new Date("2025-10-10T13:18:50.417Z"),
        tiers: [
          {
            id: "cmgkvhe0j000112pdsndo23ag",
            productId: "cmgjs22an000i11zjcvpwpkc2",
            name: "Basic",
            description: "Basic access to the product",
            priceAmount: 0,
            billingPeriod: "monthly",
            features: ["Embed access", "Basic features"],
            usageLimit: undefined,
            stripePriceId: undefined,
            isActive: true,
            sortOrder: 1,
            createdAt: new Date("2025-10-10T13:18:50.419Z"),
            updatedAt: new Date("2025-10-10T13:18:50.419Z"),
          },
        ],
        meteringConfig: undefined,
      },
      {
        id: "cmgktxbsy000114j39w9f1ehw",
        saasCreatorId: "cmgjs22an000i11zjcvpwpkc2",
        name: "Free plan",
        description: "free",
        isActive: true,
        stripePriceId: null,
        stripeProductId: "prod_TD5ihXDXl0lDZx",
        createdAt: new Date("2025-10-10T12:35:14.818Z"),
        updatedAt: new Date("2025-10-10T12:35:14.818Z"),
        tiers: [
          {
            id: "cmgktxbtl000314j32xx7tgnv",
            productId: "cmgktxbsy000114j39w9f1ehw",
            name: "free tier",
            description: undefined,
            priceAmount: 0,
            billingPeriod: "monthly",
            features: ["limited"],
            usageLimit: undefined,
            stripePriceId: undefined,
            isActive: true,
            sortOrder: 0,
            createdAt: new Date("2025-10-10T12:35:14.842Z"),
            updatedAt: new Date("2025-10-10T12:35:14.842Z"),
          },
        ],
        meteringConfig: undefined,
      },
    ],
    user: {
      id: "cmgjs21y0000e11zjkqo0ialc",
      name: "kuhmpel, inc",
      email: "randy@cvlcvc.com",
    },
    whiteLabel: {
      brandName: "s",
      primaryColor: "#667eea",
      secondaryColor: "#764ba2",
      logoUrl: "",
    },
    designTokens: {
      fonts: undefined,
      primaryColor: "",
      secondaryColor: "",
      logoUrl: "",
      faviconUrl: "",
      voiceAndTone: "",
    },
  };

  const primaryColor = creator.whiteLabel?.primaryColor || creator.designTokens?.primaryColor || '#667eea';
  const secondaryColor = creator.whiteLabel?.secondaryColor || creator.designTokens?.secondaryColor || '#f5f5f5';
  const activeProducts = creator.products; // All products for test

  return (
    <div className="min-h-screen py-12" style={{ backgroundColor: secondaryColor }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Test Products Page
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Hardcoded data to verify render - should show 2 products
          </p>
        </div>

        {/* Debug Info */}
        <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
          <strong>Test Debug:</strong><br />
          Total products: {activeProducts.length}<br />
          (Hardcoded from API data)
        </div>

        {/* Products Grid */}
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
                <Link
                  href={`/test-products/${product.id}`}
                  className="block w-full text-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  View Details & Subscribe
                </Link>

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

        {/* Contact Section */}
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <h3 className="text-2xl font-bold text-gray-900 mb-4">
            Have Questions?
          </h3>
          <p className="text-gray-600 mb-6">
            Contact us for more information about our products and pricing.
          </p>
          <a
            href={`mailto:${creator.user.email}`}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity"
            style={{ backgroundColor: primaryColor }}
          >
            Contact Us
          </a>
        </div>
      </div>
    </div>
  );
};

export default TestProducts;