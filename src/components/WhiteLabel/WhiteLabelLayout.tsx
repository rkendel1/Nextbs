"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

interface WhiteLabelConfig {
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

interface CreatorData {
  id: string;
  businessName: string;
  businessDescription?: string;
  website?: string;
  user: {
    id: string;
    name?: string;
    email: string;
  };
}

interface WhiteLabelLayoutProps {
  children: React.ReactNode;
  domain: string;
}

const WhiteLabelLayout = ({ children, domain }: WhiteLabelLayoutProps) => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WhiteLabelConfig | null>(null);
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const pathname = usePathname();

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
      setConfig(data.whiteLabel);
      setCreator(data.creator);
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
      // Redirect to main site if creator not found - handle both dev and prod
      const currentHost = window.location.host;
      const isDevelopment = currentHost === 'localhost:3000' || currentHost === '127.0.0.1:3000';
      const mainUrl = isDevelopment ? `http://${currentHost}` : 'https://saasinasnap.com';
      window.location.href = mainUrl;
    } finally {
      setLoading(false);
    }
  };

  // Apply custom CSS if provided
  useEffect(() => {
    if (config?.customCss) {
      const styleElement = document.createElement('style');
      styleElement.textContent = config.customCss;
      document.head.appendChild(styleElement);
      
      return () => {
        document.head.removeChild(styleElement);
      };
    }
  }, [config?.customCss]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!config || !creator) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Creator Not Found</h1>
          <p className="text-gray-600">This domain is not associated with any creator.</p>
        </div>
      </div>
    );
  }

  const primaryColor = config.primaryColor || '#667eea';
  const brandName = config.brandName || creator.businessName;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with creator branding */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo/Brand */}
            <div className="flex items-center">
              {config.logoUrl ? (
                <Image
                  src={config.logoUrl}
                  alt={brandName}
                  width={150}
                  height={40}
                  className="h-10 w-auto"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <h1 className="text-2xl font-bold text-gray-900">{brandName}</h1>
              )}
            </div>

            {/* Navigation */}
            <nav className="hidden md:flex space-x-8">
              <Link 
                href={`/whitelabel/${domain}/`}
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium ${
                  pathname === `/whitelabel/${domain}/` ? 'text-gray-900' : ''
                }`}
              >
                Home
              </Link>
              <Link 
                href={`/whitelabel/${domain}/products`}
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium ${
                  pathname?.includes('/products') ? 'text-gray-900' : ''
                }`}
              >
                Products
              </Link>
              <Link 
                href={`/whitelabel/${domain}/account`}
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium ${
                  pathname?.includes('/account') ? 'text-gray-900' : ''
                }`}
              >
                My Account
              </Link>
            </nav>

            {/* CTA Button */}
            <Link
              href={`/whitelabel/${domain}/products`}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: primaryColor }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Footer with creator branding */}
      <footer className="bg-gray-50 border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-600 text-sm">
                © 2024 {brandName}. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6">
              {creator.website && (
                <a
                  href={creator.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-600 hover:text-gray-900 text-sm"
                >
                  Website
                </a>
              )}
              <Link
                href={`/whitelabel/${domain}/privacy`}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href={`/whitelabel/${domain}/terms`}
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default WhiteLabelLayout;