"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/Common/Loader";
import toast from "react-hot-toast";
import { CheckCircle, Edit2, Sparkles, User, MapPin, Mail, Phone, MessageCircle, Copy, Twitter, Linkedin, Facebook, Palette, Quote } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BrandData } from "@/types/saas";

interface CompanyInfoReviewStepProps {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  loading: boolean;
}

const CompanyInfoReviewStep = ({ data, onComplete, onBack, loading }: CompanyInfoReviewStepProps) => {
  const [brandData, setBrandData] = useState<BrandData | null>(null);
  const [crawlStatus, setCrawlStatus] = useState<string>("loading");
  const [hasStripeData, setHasStripeData] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [editedData, setEditedData] = useState<any>({
    primaryColor: "",
    secondaryColor: "",
    fonts: "",
    voiceAndTone: "",
    spacingValues: "",
  });
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    fetchPrefillData();
  }, [data]);

  const fetchPrefillData = async () => {
    try {
      const response = await fetch("/api/setup/prefill");
      const result = await response.json();

      setCrawlStatus(result.crawlStatus || "not_started");
      setHasStripeData(result.hasStripeData || false);

      if (result.success && result.data && Object.keys(result.data).length > 0) {
        const scrapeData = result.data;
        setBrandData(scrapeData);
        
        setEditedData({
          primaryColor: scrapeData.colors?.primary || data.primaryColor || "",
          secondaryColor: scrapeData.colors?.secondary || data.secondaryColor || "",
          fonts: scrapeData.fonts ? JSON.stringify(scrapeData.fonts) : data.fonts || "",
          voiceAndTone: scrapeData.voice || data.voiceAndTone || "",
          spacingValues: scrapeData.spacingValues ? JSON.stringify(scrapeData.spacingValues) : data.spacingValues || "",
        });

        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 3000);

        if (result.crawlStatus === "completed") {
          toast.success("✨ Your brand design captured perfectly!", { duration: 4000, icon: "🎨" });
          toast.success("We've got your colors, fonts, and style locked in", { duration: 4000, icon: "🔒" });
        } else if (result.crawlStatus === "processing" || result.crawlStatus === "pending") {
          toast("⏳ Still analyzing your brand — we'll have everything ready soon", { icon: "⏳" });
        }
      } else {
        setBrandData(null);
        setEditedData({
          primaryColor: data.primaryColor || "",
          secondaryColor: data.secondaryColor || "",
          fonts: data.fonts || "",
          voiceAndTone: data.voiceAndTone || "",
          spacingValues: data.spacingValues || "",
        });
        if (result.crawlStatus === "deep_failed" || result.crawlStatus === "failed") {
          toast("⚠️ Site analysis failed — customize your brand manually, Stripe profile ready", { icon: "⚠️", duration: 5000 });
        } else {
          toast("No problem — you can customize your brand settings manually", { icon: "ℹ️" });
        }
      }
    } catch (error) {
      console.error("Error fetching prefill data:", error);
      setCrawlStatus("failed");
      setBrandData(null);
      setEditedData({
        primaryColor: data.primaryColor || "",
        secondaryColor: data.secondaryColor || "",
        fonts: data.fonts || "",
        voiceAndTone: data.voiceAndTone || "",
        spacingValues: data.spacingValues || "",
      });
      toast.error("Failed to load prefill data — using defaults");
    }
  };

  const toggleEdit = (field: string) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFieldUpdate = (field: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    onComplete({
      ...data,
      primaryColor: editedData.primaryColor,
      secondaryColor: editedData.secondaryColor,
      fonts: editedData.fonts,
      voiceAndTone: editedData.voiceAndTone,
      spacingValues: editedData.spacingValues,
      logoUrl: brandData?.logo_url || data.logoUrl,
      faviconUrl: brandData?.favicon_url || data.faviconUrl,
    });
  };

  const renderEditableField = (
    label: string,
    field: keyof typeof editedData,
    placeholder: string,
    required: boolean = false,
    multiline: boolean = false,
    isColor: boolean = false
  ) => {
    const fieldName = String(field);
    const value = editedData[field] || "";
    const isFieldEditing = isEditing[fieldName];
    const confidence = brandData?.confidence_scores?.[field as keyof typeof brandData.confidence_scores];

    return (
      <div className="mb-6 rounded-lg border border-stroke bg-gray-50 p-4 dark:border-dark-3 dark:bg-dark">
        <div className="mb-2 flex items-center justify-between">
          <label className="text-sm font-medium text-dark dark:text-white flex items-center gap-2">
            {label}
            {required && <span className="text-red-500">*</span>}
            {confidence && (
              <span className="text-xs text-body-color dark:text-dark-6">
                (confidence: {Math.round(confidence * 100)}%)
              </span>
            )}
          </label>
          <div className="flex gap-2">
            {value && !isFieldEditing && (
              <button
                onClick={() => toggleEdit(fieldName)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {isFieldEditing && (
              <button
                onClick={() => toggleEdit(fieldName)}
                className="text-green-600 hover:text-green-700 dark:text-green-400"
                title="Save"
              >
                <CheckCircle className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
        {multiline ? (
          <textarea
            value={value}
            onChange={(e) => handleFieldUpdate(fieldName, e.target.value)}
            placeholder={placeholder}
            disabled={!isFieldEditing && value !== ""}
            rows={3}
            className="w-full rounded-md border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary disabled:bg-gray-100 disabled:text-gray-700 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark-3"
          />
        ) : isColor ? (
          <input
            type="color"
            value={value}
            onChange={(e) => handleFieldUpdate(fieldName, e.target.value)}
            disabled={!isFieldEditing && value !== ""}
            className="w-full h-10 rounded-md border border-stroke bg-white p-1"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldUpdate(fieldName, e.target.value)}
            placeholder={placeholder}
            disabled={!isFieldEditing && value !== ""}
            className="w-full rounded-md border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary disabled:bg-gray-100 disabled:text-gray-700 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark-3"
          />
        )}
      </div>
    );
  };

  return (
    <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
      {/* Header with Animation */}
      <div className={`text-center mb-8 ${showAnimation ? 'animate-fade-in' : ''}`}>
        <h2 className="mb-3 text-3xl font-bold text-dark dark:text-white">
          Review Your Captured Setup
        </h2>
        <p className="text-base text-body-color dark:text-dark-6">
          See your brand design from the site analysis and creator profile from Stripe
        </p>
      </div>

      {/* Success Message */}
      {crawlStatus === "completed" && brandData && (
        <div className="mb-6 rounded-lg bg-gradient-to-r from-purple-50 to-blue-50 p-4 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800">
          <div className="flex gap-2">
            <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                Your brand identity is locked in
              </p>
              <p className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                We analyzed your website and captured your unique design language — no need to repeat yourself!
              </p>
            </div>
          </div>
        </div>
      )}

      {(crawlStatus === "failed" || crawlStatus === "deep_failed") && (
        <div className="mb-6 rounded-lg bg-gradient-to-r from-yellow-50 to-orange-50 p-4 dark:from-yellow-900/20 dark:to-orange-900/20 border border-yellow-200 dark:border-yellow-800">
          <div className="flex gap-2">
            <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Brand analysis incomplete
              </p>
              <p className="text-xs text-yellow-700 dark:text-yellow-300 mt-1">
                Site scrape failed — customize your design manually below
              </p>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="brand" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="brand">Brand Design</TabsTrigger>
          <TabsTrigger value="profile">Creator Profile</TabsTrigger>
        </TabsList>
        <TabsContent value="brand" className="mt-6">
          <div className="space-y-8">
            {brandData ? (
              <>
                {/* Logo & Visual Identity */}
                {brandData.logo_url && (
                  <div className="rounded-lg border-2 border-dashed border-stroke p-6 dark:border-dark-3 bg-gradient-to-br from-gray-50 to-white dark:from-dark-3 dark:to-dark">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={brandData.logo_url}
                          alt="Your Logo"
                          className="h-24 w-24 rounded-lg object-contain border border-stroke dark:border-dark-3 bg-white dark:bg-dark-2 p-2"
                          onError={(e) => {
                            (e.target as HTMLImageElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-dark dark:text-white">Your Logo</h3>
                        <p className="text-sm text-body-color dark:text-dark-6">Automatically detected from your site</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Color Palette Showcase */}
                {(editedData.primaryColor || editedData.secondaryColor) && (
                  <div className="rounded-lg border-2 border-dashed border-stroke p-6 dark:border-dark-3 bg-gradient-to-br from-gray-50 to-white dark:from-dark-3 dark:to-dark">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: editedData.primaryColor || '#3B82F6' }}>🎨 Your Color Palette</h3>
                    <div className="flex gap-6 mb-4">
                      {editedData.primaryColor && (
                        <div className="flex-1">
                          <div
                            className="h-32 w-full rounded-lg shadow-lg border-2 border-white dark:border-dark-2 hover:scale-105 transition-transform duration-200 cursor-pointer"
                            style={{ backgroundColor: editedData.primaryColor }}
                          ></div>
                          <p className="mt-2 text-center text-sm font-medium text-dark dark:text-white">Primary Color</p>
                          <p className="text-center text-xs text-body-color dark:text-dark-6 font-mono">{editedData.primaryColor}</p>
                        </div>
                      )}
                      {editedData.secondaryColor && (
                        <div className="flex-1">
                          <div
                            className="h-32 w-full rounded-lg shadow-lg border-2 border-white dark:border-dark-2 hover:scale-105 transition-transform duration-200 cursor-pointer"
                            style={{ backgroundColor: editedData.secondaryColor }}
                          ></div>
                          <p className="mt-2 text-center text-sm font-medium text-dark dark:text-white">Secondary Color</p>
                          <p className="text-center text-xs text-body-color dark:text-dark-6 font-mono">{editedData.secondaryColor}</p>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      {renderEditableField("Primary Color", "primaryColor", "#3B82F6", false, false, true)}
                      {renderEditableField("Secondary Color", "secondaryColor", "#1D4ED8", false, false, true)}
                    </div>
                  </div>
                )}

                {/* Typography Showcase */}
                {editedData.fonts && (
                  <div className="rounded-lg border-2 border-dashed border-stroke p-6 dark:border-dark-3 bg-gradient-to-br from-gray-50 to-white dark:from-dark-3 dark:to-dark">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: editedData.primaryColor || '#3B82F6' }}>✍️ Your Typography</h3>
                    <div className="space-y-3 mb-4">
                      {JSON.parse(editedData.fonts || '[]').slice(0, 3).map((font: string, i: number) => (
                        <div key={i} className="p-4 bg-white rounded-lg shadow-sm dark:bg-dark-2 border border-stroke dark:border-dark-3 hover:scale-105 transition-transform duration-200 cursor-pointer">
                          <p className="text-xs text-body-color dark:text-dark-6 mb-1">Font {i + 1}</p>
                          <p style={{ fontFamily: font }} className="text-2xl font-medium text-dark dark:text-white">
                            The quick brown fox jumps
                          </p>
                          <p className="text-xs text-body-color dark:text-dark-6 mt-1 font-mono">{font}</p>
                        </div>
                      ))}
                    </div>
                    {renderEditableField("Font Stack (JSON)", "fonts", '["Font Name 1", "Font Name 2"]', false, true)}
                  </div>
                )}

                {/* Voice & Tone */}
                {editedData.voiceAndTone && (
                  <div className="rounded-lg border-2 border-dashed border-purple-200 p-6 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-dark">
                    <h3 className="text-lg font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center gap-2">
                      🎯 Brand Voice & Tone
                    </h3>
                    <p className="text-base text-purple-700 dark:text-purple-300 mb-4 italic">&quot;{editedData.voiceAndTone}&quot;</p>
                    {renderEditableField("Voice & Tone", "voiceAndTone", "Your brand's voice description", false, true)}
                  </div>
                )}

                {/* Spacing Tokens */}
                {editedData.spacingValues && JSON.parse(editedData.spacingValues || '[]').length > 0 && (
                  <div className="rounded-lg border-2 border-dashed border-stroke p-6 dark:border-dark-3 bg-gradient-to-br from-gray-50 to-white dark:from-dark-3 dark:to-dark">
                    <h3 className="text-lg font-semibold mb-4" style={{ color: editedData.primaryColor || '#3B82F6' }}>📏 Spacing System</h3>
                    <div className="grid grid-cols-4 gap-3 mb-4">
                      {JSON.parse(editedData.spacingValues || '[]').slice(0, 8).map((spacing: string, i: number) => (
                        <div
                          key={i}
                          className="p-3 border-2 border-stroke rounded-lg dark:border-dark-3 bg-white dark:bg-dark-2 flex flex-col items-center justify-center hover:scale-105 transition-transform duration-200 cursor-pointer"
                        >
                          <div
                            className="bg-primary/20 rounded"
                            style={{ width: spacing, height: spacing, minWidth: '20px', minHeight: '20px' }}
                          ></div>
                          <span className="text-xs mt-2 font-mono text-body-color dark:text-dark-6">{spacing}</span>
                        </div>
                      ))}
                    </div>
                    {renderEditableField("Spacing Values (JSON)", "spacingValues", '["8px", "16px", "24px"]', false, true)}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8 bg-gray-50 rounded-lg p-6 dark:bg-dark-3">
                <h3 className="text-lg font-semibold text-dark dark:text-white mb-2">Customize Your Brand</h3>
                <p className="text-sm text-muted-foreground mb-6">Analysis incomplete — set your design details manually</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
                  {renderEditableField("Primary Color", "primaryColor", "#3B82F6", false, false, true)}
                  {renderEditableField("Secondary Color", "secondaryColor", "#1D4ED8", false, false, true)}
                  {renderEditableField("Font Stack (JSON)", "fonts", '["Inter", "sans-serif"]', false, true)}
                  {renderEditableField("Voice & Tone", "voiceAndTone", "Your brand's voice description", false, true)}
                  {renderEditableField("Spacing Values (JSON)", "spacingValues", '["4px", "8px", "16px", "24px", "32px"]', false, true)}
                </div>
              </div>
            )}
          </div>
        </TabsContent>
        <TabsContent value="profile" className="mt-6">
          <div className="rounded-lg border-2 border-dashed border-stroke p-6 dark:border-dark-3 bg-gradient-to-br from-blue-50 to-white dark:from-dark-3 dark:to-dark">
            <h3 className="text-lg font-semibold text-dark dark:text-white mb-4">👤 Your Creator Profile</h3>
            <div className="flex items-start gap-6">
              <div className="flex-shrink-0">
                {data.logoUrl ? (
                  <img
                    src={data.logoUrl}
                    alt="Profile Avatar"
                    className="h-20 w-20 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                    {data.businessName ? data.businessName.charAt(0).toUpperCase() : 'C'}
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-4">
                <div>
                  <h4 className="text-xl font-bold text-dark dark:text-white">{data.businessName || 'Business Name'}</h4>
                  <p className="text-sm text-muted-foreground">From your Stripe account</p>
                </div>
                {data.companyAddress && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-dark dark:text-white">Address</p>
                    <p className="text-sm text-body-color dark:text-dark-6">{data.companyAddress}</p>
                  </div>
                )}
                {data.contactEmail && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-dark dark:text-white">Email</p>
                    <p className="text-sm text-body-color dark:text-dark-6">{data.contactEmail}</p>
                  </div>
                )}
                {data.contactPhone && (
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-dark dark:text-white">Phone</p>
                    <p className="text-sm text-body-color dark:text-dark-6">{data.contactPhone}</p>
                  </div>
                )}
                {data.stripeAccountId && (
                  <div className="space-y-1 pt-2 border-t border-muted">
                    <p className="text-sm font-medium text-dark dark:text-white">Stripe Account</p>
                    <p className="text-xs text-muted-foreground font-mono">acct_{data.stripeAccountId.slice(-8)}</p>
                  </div>
                )}
                {!data.stripeAccountId && (
                  <p className="text-sm text-muted-foreground italic">Connect Stripe to see your full profile details</p>
                )}
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="mt-8 flex gap-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex flex-1 items-center justify-center rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex flex-1 items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-dark disabled:opacity-50"
        >
          {loading ? (
            <>
              Saving... <Loader />
            </>
          ) : (
            "Complete Setup ✨"
          )}
        </button>
      </div>
    </div>
  );
};

export default CompanyInfoReviewStep;