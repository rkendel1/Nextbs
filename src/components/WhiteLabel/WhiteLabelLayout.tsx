"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { extractDesignTokens } from "@/utils/designTokenExtractor";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";

interface WhiteLabelConfig {
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customCss?: string;
}

interface DesignTokens {
  fonts?: string[];
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  voiceAndTone?: string;
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
  config?: WhiteLabelConfig;
  creator?: CreatorData;
  designTokens?: DesignTokens;
}

const WhiteLabelLayout = ({ children, domain, config: propConfig, creator: propCreator, designTokens: propDesignTokens }: WhiteLabelLayoutProps) => {
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<WhiteLabelConfig | null>(propConfig || null);
  const [creator, setCreator] = useState<CreatorData | null>(propCreator || null);
  const [designTokens, setDesignTokens] = useState<DesignTokens | null>(propDesignTokens || null);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    if (!propConfig && !propCreator) {
      fetchCreatorData();
    } else {
      setLoading(false);
    }
  }, [domain, propConfig, propCreator]);

  const fetchCreatorData = async () => {
    try {
      const response = await fetch(`/api/saas/whitelabel/creator-by-domain?domain=${encodeURIComponent(domain)}`);
      
      if (!response.ok) {
        throw new Error('Creator not found');
      }
      
      const data = await response.json();
      setConfig(data.whiteLabel);
      setCreator(data.creator);
      setDesignTokens(data.designTokens);
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

  // Apply dynamic fonts from design tokens
  useEffect(() => {
    if (designTokens?.fonts && designTokens.fonts.length > 0) {
      // Load fonts from Google Fonts
      const fontFamilies = designTokens.fonts
        .filter(font => font && font.trim()) // Remove empty fonts
        .map(font => font.replace(/\s+/g, '+'))
        .join('&family=');
      
      if (fontFamilies) {
        const linkElement = document.createElement('link');
        linkElement.href = `https://fonts.googleapis.com/css2?family=${fontFamilies}&display=swap`;
        linkElement.rel = 'stylesheet';
        document.head.appendChild(linkElement);
        
        // Apply primary font to body
        const styleElement = document.createElement('style');
        styleElement.textContent = `
          body, .white-label-content {
            font-family: '${designTokens.fonts[0]}', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;
          }
        `;
        document.head.appendChild(styleElement);
        
        return () => {
          document.head.removeChild(linkElement);
          document.head.removeChild(styleElement);
        };
      }
    }
  }, [designTokens?.fonts]);

  // Apply favicon from design tokens
  useEffect(() => {
    const faviconUrl = designTokens?.faviconUrl || config?.faviconUrl;
    if (faviconUrl) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = faviconUrl;
    }
  }, [designTokens?.faviconUrl, config?.faviconUrl]);

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

  const primaryColor = config.primaryColor || designTokens?.primaryColor || '#667eea';
  const secondaryColor = config.secondaryColor || designTokens?.secondaryColor || '#f5f5f5';
  const brandName = config.brandName || creator.businessName;
  const logoUrl = config.logoUrl || designTokens?.logoUrl;

  return (
    <div className="min-h-screen bg-white white-label-content">{/* Added white-label-content class for font inheritance */}
      {/* Header with creator branding */}
      <header className="border-b border-gray-200 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            {/* Logo/Brand */}
            <div className="flex items-center">
              {logoUrl ? (
                <Image
                  src={logoUrl}
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

            
            <nav className="hidden md:flex space-x-8">
              {/* Home link */}
              <Link
                href={`/${domain}`}
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium ${
                  pathname === `/${domain}` || pathname === `/${domain}/` ? 'text-gray-900' : ''
                }`}
              >
                Home
              </Link>

              {/* Products link */}
              <Link
                href={`/${domain}/products`}
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium ${
                  pathname?.startsWith(`/${domain}/products`) ? 'text-gray-900' : ''
                }`}
              >
                Products
              </Link>

              {/* My Account link */}
              <Link
                href={`/${domain}/account`}
                className={`text-gray-600 hover:text-gray-900 px-3 py-2 text-sm font-medium ${
                  pathname?.startsWith(`/${domain}/account`) ? 'text-gray-900' : ''
                }`}
              >
                My Account
              </Link>
            </nav>
            

            {/* CTA Button */}
            <Link
              href="/pricing"
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
      <footer className="border-t border-gray-200" style={{ backgroundColor: secondaryColor }}>
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
                href="/privacy"
                className="text-gray-600 hover:text-gray-900 text-sm"
              >
                Privacy Policy
              </Link>
              <Link
                href="/terms"
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