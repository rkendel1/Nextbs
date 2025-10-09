"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/Common/Loader";
import toast from "react-hot-toast";
import { CheckCircle, Edit2, X, Sparkles } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
    businessName: "",
    businessType: "",
    businessDescription: "",
    website: "",
    industryCategory: "",
    companyAddress: "",
    contactEmail: "",
    contactPhone: "",
    businessTaxId: "",
    ownerName: "",
    primaryColor: "",
    secondaryColor: "",
    fonts: "",
    voiceAndTone: "",
    bankLast4: "",
    bankType: "",
    currency: "",
    payoutSchedule: "",
    verificationStatus: "",
    billingEmail: "",
    spacingValues: "",
  });
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    fetchPrefillData();
  }, []);

  const fetchPrefillData = async () => {
    try {
      const response = await fetch("/api/setup/prefill");
      const result = await response.json();

      setCrawlStatus(result.crawlStatus || "not_started");
      setHasStripeData(result.hasStripeData || false);

      if (result.success && result.data) {
        const data = result.data;
        setBrandData(data);
        
        // Set initial edited data from comprehensive prefill (scrape + Stripe)
        setEditedData({
          businessName: data.company_name || data.business_name || "",
          businessType: data.business_type || "",
          businessDescription: data.meta_description || data.business_description || "",
          website: data.website || "",
          industryCategory: data.industry_category || data.meta_keywords || "",
          companyAddress: data.company_address || data.address?.full || "",
          contactEmail: data.contact_info?.email || data.email || "",
          contactPhone: data.contact_info?.phone || data.phone || "",
          businessTaxId: data.business_tax_id || "",
          ownerName: data.owner_name || "",
          primaryColor: data.colors?.primary || "",
          secondaryColor: data.colors?.secondary || "",
          fonts: data.fonts ? JSON.stringify(data.fonts) : "",
          voiceAndTone: data.voice || "",
          bankLast4: data.bank_last4 || "",
          bankType: data.bank_type || "",
          currency: data.currency || "",
          payoutSchedule: data.payout_schedule || "",
          verificationStatus: data.verification_status || "pending",
          billingEmail: data.billing_email || "",
        });

        // Show magic animation
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 3000);

        // Enhanced success message showing sources
        let message = "Ready to review your full profile";
        if (result.hasStripeData && result.crawlStatus === "completed") {
          message += " — from your site and Stripe";
          toast.success("Profile ready from Stripe 💳", { duration: 3000, icon: "💳" });
          toast.success("Brand captured from site 🎨", { duration: 3000, icon: "🎨" });
        } else if (result.hasStripeData) {
          message += " — from your Stripe account";
          toast.success("Profile prepopulated from Stripe 💳", { duration: 4000, icon: "💳" });
        } else if (result.crawlStatus === "completed") {
          message += " — from your website";
          toast.success("Brand analyzed from your site 🎨", { duration: 4000, icon: "🎨" });
        }
        toast.success(message, {
          duration: 5000,
          icon: "✨",
        });
      } else if (result.crawlStatus === "processing" || result.crawlStatus === "pending") {
        // Still processing, show message
        toast("Still analyzing your site — we'll have everything ready soon", {
          icon: "⏳",
        });
      } else {
        // Failed or not started
        toast("No problem — we'll prepopulate what we can and you can fill in the rest", {
          icon: "ℹ️",
        });
      }
    } catch (error) {
      console.error("Error fetching prefill data:", error);
      setCrawlStatus("failed");
      toast.error("Failed to load profile data");
    }
  };

  const toggleEdit = (field: string) => {
    setIsEditing((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const handleFieldUpdate = (field: string, value: string) => {
    setEditedData((prev: any) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    if (!editedData.businessName.trim()) {
      toast.error("Business name is required");
      return;
    }

    // Pass full edited profile data to complete onboarding
    onComplete({
      businessName: editedData.businessName,
      businessType: editedData.businessType,
      businessDescription: editedData.businessDescription,
      website: editedData.website,
      industryCategory: editedData.industryCategory,
      companyAddress: editedData.companyAddress,
      contactEmail: editedData.contactEmail,
      contactPhone: editedData.contactPhone,
      businessTaxId: editedData.businessTaxId,
      ownerName: editedData.ownerName,
      primaryColor: editedData.primaryColor,
      secondaryColor: editedData.secondaryColor,
      fonts: editedData.fonts,
      voiceAndTone: editedData.voiceAndTone,
      bankLast4: editedData.bankLast4,
      bankType: editedData.bankType,
      currency: editedData.currency,
      payoutSchedule: editedData.payoutSchedule,
      verificationStatus: editedData.verificationStatus,
      billingEmail: editedData.billingEmail,
      logoUrl: brandData?.logo_url,
      faviconUrl: brandData?.favicon_url,
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
          We've got you covered
        </h2>
        <p className="text-base text-body-color dark:text-dark-6">
          Your profile and brand are ready – review and edit as needed
        </p>
      </div>

      {/* Success Message */}
      {(crawlStatus === "completed" || hasStripeData) && brandData && (
        <div className="mb-6 rounded-lg bg-gradient-to-r from-green-50 to-blue-50 p-4 dark:from-green-900/20 dark:to-blue-900/20 border border-green-200 dark:border-green-800">
          <div className="flex gap-2">
            <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                {hasStripeData && crawlStatus === "completed"
                  ? "Account ready + brand recognized"
                  : hasStripeData
                  ? "Your business details from Stripe"
                  : "Your brand from your website"}
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Switch tabs to see everything we've prepared
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Brand Preview - Global */}
      {brandData && (brandData.logo_url || brandData.colors) && (
        <div className="mb-8 rounded-lg border border-stroke p-6 dark:border-dark-3">
          <h3 className="mb-4 text-sm font-semibold text-dark dark:text-white">Quick Brand Snapshot</h3>
          <div className="flex items-center gap-6">
            {brandData.logo_url && (
              <div className="flex-shrink-0">
                <img
                  src={brandData.logo_url}
                  alt="Company Logo"
                  className="h-16 w-16 rounded-md object-contain border border-stroke dark:border-dark-3"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              </div>
            )}
            {brandData.colors && (
              <div className="flex gap-3">
                {brandData.colors.primary && (
                  <div className="text-center">
                    <div
                      className="h-12 w-12 rounded-md border border-stroke dark:border-dark-3"
                      style={{ backgroundColor: brandData.colors.primary }}
                    ></div>
                    <p className="mt-1 text-xs text-body-color dark:text-dark-6">Primary</p>
                  </div>
                )}
                {brandData.colors.secondary && (
                  <div className="text-center">
                    <div
                      className="h-12 w-12 rounded-md border border-stroke dark:border-dark-3"
                      style={{ backgroundColor: brandData.colors.secondary }}
                    ></div>
                    <p className="mt-1 text-xs text-body-color dark:text-dark-6">Secondary</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tabs for Profile and Brand */}
      <Tabs defaultValue="profile" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="brand">Brand</TabsTrigger>
        </TabsList>

        {/* Profile Tab - Stripe Data */}
        <TabsContent value="profile" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Your account is fully set up and ready to transact. Edit any details below.
          </p>
          <div className="space-y-4">
            {renderEditableField("Business Name", "businessName", "Enter your business name", true)}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderEditableField("Business Type", "businessType", "Individual / Company / Nonprofit")}
              {renderEditableField("Verification Status", "verificationStatus", "Verified / Pending")}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderEditableField("Account Email", "contactEmail", "contact@example.com", false)}
              {renderEditableField("Billing Email", "billingEmail", "billing@example.com", false)}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {renderEditableField("Currency", "currency", "USD", false)}
              {renderEditableField("Payout Schedule", "payoutSchedule", "Daily / Weekly / Monthly", false)}
            </div>
            {hasStripeData && (
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                  Stripe Status: {editedData.verificationStatus === 'verified' ? '✅ Verified & Ready' : '⚠️ Pending Verification'}
                </p>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Your account is {editedData.verificationStatus}. Payouts in {editedData.currency} on {editedData.payoutSchedule} schedule.
                </p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Brand Tab - Scrape Data */}
        <TabsContent value="brand" className="space-y-6">
          <p className="text-sm text-muted-foreground">
            We've analyzed your site to capture your unique brand identity. See the snapshot and edit as needed.
          </p>
          {/* Visual Brand Snapshot */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            {/* Colors Palette */}
            {editedData.primaryColor || editedData.secondaryColor ? (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-dark dark:text-white">Color Palette</h4>
                <div className="flex gap-2">
                  {editedData.primaryColor && (
                    <div className="flex flex-col items-center">
                      <div
                        className="h-16 w-16 rounded-md border border-stroke dark:border-dark-3"
                        style={{ backgroundColor: editedData.primaryColor }}
                      ></div>
                      <p className="mt-1 text-xs text-muted-foreground">{editedData.primaryColor}</p>
                    </div>
                  )}
                  {editedData.secondaryColor && (
                    <div className="flex flex-col items-center">
                      <div
                        className="h-16 w-16 rounded-md border border-stroke dark:border-dark-3"
                        style={{ backgroundColor: editedData.secondaryColor }}
                      ></div>
                      <p className="mt-1 text-xs text-muted-foreground">{editedData.secondaryColor}</p>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {renderEditableField("Primary Color", "primaryColor", "#3B82F6", false, false, true)}
                  {renderEditableField("Secondary Color", "secondaryColor", "#1D4ED8", false, false, true)}
                </div>
              </div>
            ) : null}

            {/* Fonts Preview */}
            {editedData.fonts && (
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-dark dark:text-white">Typography</h4>
                <div className="space-y-2">
                  {JSON.parse(editedData.fonts || '[]').slice(0, 3).map((font: string, i: number) => (
                    <div key={i} className="p-2 bg-gray-50 rounded dark:bg-dark">
                      <p style={{ fontFamily: font }} className="text-sm">
                        Sample text in {font}
                      </p>
                    </div>
                  ))}
                </div>
                {renderEditableField("Fonts", "fonts", "JSON array of font families", false, true)}
              </div>
            )}
          </div>

          {/* Spacing Tokens Preview */}
          {editedData.spacingValues && editedData.spacingValues.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-dark dark:text-white">Spacing Tokens</h4>
              <div className="grid grid-cols-4 gap-2">
                {editedData.spacingValues.slice(0, 8).map((spacing: string, i: number) => (
                  <div
                    key={i}
                    className="h-8 border border-stroke rounded dark:border-dark-3 flex items-center justify-center"
                    style={{ padding: spacing }}
                  >
                    <span className="text-xs">{spacing}</span>
                  </div>
                ))}
              </div>
              {renderEditableField("Spacing Values", "spacingValues", "JSON array of spacing tokens", false, true)}
            </div>
          )}

          {/* Logo & Images */}
          {brandData?.logo_url && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-dark dark:text-white">Logo</h4>
              <img
                src={brandData.logo_url}
                alt="Detected Logo"
                className="max-h-32 object-contain border border-stroke rounded dark:border-dark-3"
              />
              {renderEditableField("Logo URL", "logoUrl", "Your logo URL", false)}
            </div>
          )}

          {brandData?.images && brandData.images.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-dark dark:text-white">Site Images</h4>
              <div className="grid grid-cols-3 gap-2">
                {brandData.images.slice(0, 6).map((img: any, i: number) => (
                  <img
                    key={i}
                    src={img.src}
                    alt={img.alt}
                    className="h-20 w-20 object-cover rounded border border-stroke dark:border-dark-3"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Voice & Tone */}
          {editedData.voiceAndTone && (
            <div className="mb-6 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
              <h4 className="mb-2 text-sm font-medium text-purple-900 dark:text-purple-100">
                🎯 Detected Brand Voice & Tone
              </h4>
              <p className="text-sm text-purple-700 dark:text-purple-300">{editedData.voiceAndTone}</p>
              {renderEditableField("Voice & Tone", "voiceAndTone", "Your brand's voice description", false, true)}
            </div>
          )}
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
            "Complete Setup"
          )}
        </button>
      </div>
    </div>
  );
};

export default CompanyInfoReviewStep;
