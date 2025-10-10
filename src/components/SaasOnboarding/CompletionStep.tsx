"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { Sparkles, Palette, Type, ExternalLink } from "lucide-react";

interface BrandData {
  logo_url?: string;
  favicon_url?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  fonts?: string[];
  voice?: string;
  spacingValues?: string[];
}

const CompletionStep = () => {
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [crawlStatus, setCrawlStatus] = useState<string>("loading");
  const [whiteLabelDomain, setWhiteLabelDomain] = useState<string>("");

  useEffect(() => {
    fetchBrandData();
    fetchWhiteLabelConfig();
  }, []);

  const fetchBrandData = async () => {
    try {
      const response = await fetch("/api/setup/prefill");
      const result = await response.json();
      
      setCrawlStatus(result.crawlStatus || "not_started");
      
      if (result.success && result.data) {
        setBrandData(result.data);
      }
    } catch (error) {
      console.error("Error fetching brand data:", error);
      setCrawlStatus("failed");
    }
  };

  const fetchWhiteLabelConfig = async () => {
    try {
      const response = await fetch("/api/saas/white-label");
      if (response.ok) {
        const data = await response.json();
        if (data.config?.subdomain) {
          setWhiteLabelDomain(data.config.subdomain);
        }
      }
    } catch (error) {
      console.error("Error fetching white-label config:", error);
    }
  };

  return (
    <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
          <svg
            className="h-16 w-16 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h2 className="mb-4 text-3xl font-bold text-dark dark:text-white">
          Welcome to SaaS for SaaS! 🎉
        </h2>
        
        <p className="mb-8 text-lg text-body-color dark:text-dark-6">
          Your account is now set up. You&apos;re ready to start managing your SaaS products and subscribers.
        </p>

        {/* Brand Design Showcase */}
        {brandData && (crawlStatus === "completed" || crawlStatus === "lightweight_completed") && (
          <div className="mb-8 rounded-lg bg-gradient-to-br from-purple-50 to-blue-50 p-6 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100">
                Your Brand Design is Ready!
              </h3>
            </div>
            <p className="text-sm text-purple-700 dark:text-purple-300 mb-6">
              We&apos;ve captured your unique design language and it&apos;s already applied to your white-label pages
            </p>

            <div className="grid gap-4 md:grid-cols-2 mb-4">
              {/* Colors */}
              {(brandData.colors?.primary || brandData.colors?.secondary) && (
                <div className="rounded-lg bg-white dark:bg-dark-2 p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Palette className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-sm font-semibold text-dark dark:text-white">Color Palette</h4>
                  </div>
                  <div className="flex gap-3">
                    {brandData.colors.primary && (
                      <div className="flex-1">
                        <div
                          className="h-16 w-full rounded-lg shadow-sm border border-stroke dark:border-dark-3"
                          style={{ backgroundColor: brandData.colors.primary }}
                        ></div>
                        <p className="text-xs mt-2 text-center text-body-color dark:text-dark-6 font-mono">
                          {brandData.colors.primary}
                        </p>
                      </div>
                    )}
                    {brandData.colors.secondary && (
                      <div className="flex-1">
                        <div
                          className="h-16 w-full rounded-lg shadow-sm border border-stroke dark:border-dark-3"
                          style={{ backgroundColor: brandData.colors.secondary }}
                        ></div>
                        <p className="text-xs mt-2 text-center text-body-color dark:text-dark-6 font-mono">
                          {brandData.colors.secondary}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Fonts */}
              {brandData.fonts && brandData.fonts.length > 0 && (
                <div className="rounded-lg bg-white dark:bg-dark-2 p-4 border border-purple-200 dark:border-purple-700">
                  <div className="flex items-center gap-2 mb-3">
                    <Type className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <h4 className="text-sm font-semibold text-dark dark:text-white">Typography</h4>
                  </div>
                  <div className="space-y-2">
                    {brandData.fonts.slice(0, 2).map((font, i) => (
                      <div key={i} className="text-left">
                        <p className="text-xs text-body-color dark:text-dark-6 mb-1">Font {i + 1}</p>
                        <p 
                          style={{ fontFamily: font }} 
                          className="text-base font-medium text-dark dark:text-white truncate"
                        >
                          {font}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* White-label domain link */}
            {whiteLabelDomain && (
              <div className="mt-4 pt-4 border-t border-purple-200 dark:border-purple-700">
                <p className="text-sm text-purple-700 dark:text-purple-300 mb-2">
                  Your white-label site is live at:
                </p>
                <a
                  href={`/whitelabel/${whiteLabelDomain}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
                >
                  {whiteLabelDomain}
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}
          </div>
        )}

        {/* Design Still Processing */}
        {crawlStatus === "processing" && (
          <div className="mb-8 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 border border-blue-200 dark:border-blue-800">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ⏳ We&apos;re still analyzing your brand design in the background. 
              You&apos;ll see it in your dashboard once complete!
            </p>
          </div>
        )}

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-stroke bg-gray-50 p-6 dark:border-dark-3 dark:bg-dark">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
              Add Products
            </h3>
            <p className="text-sm text-body-color dark:text-dark-6">
              Create and manage your SaaS products and pricing tiers
            </p>
          </div>

          <div className="rounded-lg border border-stroke bg-gray-50 p-6 dark:border-dark-3 dark:bg-dark">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
              Manage Subscribers
            </h3>
            <p className="text-sm text-body-color dark:text-dark-6">
              View and manage your customer subscriptions
            </p>
          </div>

          <div className="rounded-lg border border-stroke bg-gray-50 p-6 dark:border-dark-3 dark:bg-dark">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
              Track Usage
            </h3>
            <p className="text-sm text-body-color dark:text-dark-6">
              Monitor usage metrics and metering data
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-primary bg-primary px-8 py-3 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-blue-dark"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default CompletionStep;
