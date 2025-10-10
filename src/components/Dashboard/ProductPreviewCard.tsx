"use client";
import React from "react";
import { Check } from "lucide-react"; // For potential icons, but use inline SVG to match whitelabel

interface ProductPreviewCardProps {
  productName: string;
  description?: string;
  tierName: string;
  price: number;
  billingPeriod: string;
  features: string[];
  primaryColor: string;
  businessName?: string;
  logoUrl?: string;
  isActive?: boolean;
}

const ProductPreviewCard: React.FC<ProductPreviewCardProps> = ({
  productName,
  description,
  tierName,
  price,
  billingPeriod,
  features,
  primaryColor,
  businessName = "Your Brand",
  logoUrl,
  isActive = true,
}) => {
  if (!productName || !tierName || price === 0) {
    return (
      <div className="w-full max-w-md mx-auto bg-gray-50 dark:bg-gray-800 p-8 rounded-lg shadow-lg text-center">
        <div className="text-gray-500 dark:text-gray-400">
          <p className="text-lg font-semibold mb-2">Product Preview</p>
          <p>Enter product and pricing details to see a live preview of your card.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden border-t-4" style={{ borderTopColor: primaryColor }}>
      {/* Header */}
      <div className="p-6 text-center border-b border-gray-200 dark:border-gray-700">
        {logoUrl && (
          <img 
            src={logoUrl} 
            alt={businessName}
            className="w-16 h-16 mx-auto mb-4 rounded-full shadow-md"
          />
        )}
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{productName}</h2>
        {description && (
          <p className="text-gray-600 dark:text-gray-300 text-sm">{description}</p>
        )}
      </div>

      {/* Tier Card */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{tierName}</h3>
        
        <div className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
          ${price.toFixed(2)}
          <span className="text-lg font-normal text-gray-600 dark:text-gray-400"> /{billingPeriod}</span>
        </div>
        
        {/* Features */}
        {features.length > 0 && features.some(f => f.trim()) && (
          <ul className="space-y-2 mb-6">
            {features.filter(f => f.trim()).map((feature, index) => (
              <li key={index} className="flex items-start">
                <svg className="h-5 w-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Mock Subscribe Button */}
        <button
          disabled={!isActive}
          className="w-full px-4 py-3 border border-transparent text-base font-medium rounded-md text-white hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-gray-400"
          style={{ backgroundColor: primaryColor }}
        >
          {isActive ? "Preview Subscribe" : "Activate to Preview"}
        </button>
      </div>

      {/* Footer Note */}
      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-700 text-xs text-gray-500 dark:text-gray-400 text-center">
        This is a live preview of your product card on the whitelabel site.
      </div>
    </div>
  );
};

export default ProductPreviewCard;