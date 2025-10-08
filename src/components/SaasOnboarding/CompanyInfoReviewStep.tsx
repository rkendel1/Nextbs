"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/Common/Loader";
import toast from "react-hot-toast";
import { CheckCircle, Edit2, X, Sparkles } from "lucide-react";
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
  const [isEditing, setIsEditing] = useState<Record<string, boolean>>({});
  const [editedData, setEditedData] = useState<any>({
    businessName: "",
    businessDescription: "",
    companyAddress: "",
    contactEmail: "",
    contactPhone: "",
    primaryColor: "",
    secondaryColor: "",
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

      if (result.success && result.data) {
        const data = result.data;
        setBrandData(data);
        
        // Set initial edited data
        setEditedData({
          businessName: data.company_name || "",
          businessDescription: "",
          companyAddress: data.company_address || "",
          contactEmail: data.contact_info?.email || "",
          contactPhone: data.contact_info?.phone || "",
          primaryColor: data.colors?.primary || "",
          secondaryColor: data.colors?.secondary || "",
        });

        // Show magic animation
        setShowAnimation(true);
        setTimeout(() => setShowAnimation(false), 3000);

        toast.success("✨ We matched your brand automatically — ready to review?", {
          duration: 5000,
          icon: "🪄",
        });
      } else if (result.crawlStatus === "processing" || result.crawlStatus === "pending") {
        // Still processing, show message
        toast("Still fetching your brand info...", {
          icon: "⏳",
        });
      } else {
        // Failed or not started
        toast("Couldn't fetch automatically — please enter your info below", {
          icon: "ℹ️",
        });
      }
    } catch (error) {
      console.error("Error fetching prefill data:", error);
      setCrawlStatus("failed");
      toast.error("Failed to load brand data");
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

    // Pass the edited data to complete onboarding
    onComplete({
      businessName: editedData.businessName,
      businessDescription: editedData.businessDescription,
      companyAddress: editedData.companyAddress,
      contactEmail: editedData.contactEmail,
      contactPhone: editedData.contactPhone,
      primaryColor: editedData.primaryColor,
      secondaryColor: editedData.secondaryColor,
      logoUrl: brandData?.logo_url,
      faviconUrl: brandData?.favicon_url,
      fonts: brandData?.fonts ? JSON.stringify(brandData.fonts) : undefined,
      voiceAndTone: brandData?.voice,
    });
  };

  const renderEditableField = (
    label: string,
    field: keyof typeof editedData,
    placeholder: string,
    required: boolean = false,
    multiline: boolean = false
  ) => {
    const value = editedData[field] || "";
    const isFieldEditing = isEditing[field];
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
                onClick={() => toggleEdit(field)}
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400"
                title="Edit"
              >
                <Edit2 className="h-4 w-4" />
              </button>
            )}
            {isFieldEditing && (
              <button
                onClick={() => toggleEdit(field)}
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
            onChange={(e) => handleFieldUpdate(field, e.target.value)}
            placeholder={placeholder}
            disabled={!isFieldEditing && value !== ""}
            rows={3}
            className="w-full rounded-md border border-stroke bg-white px-3 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary disabled:bg-gray-100 disabled:text-gray-700 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:disabled:bg-dark-3"
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => handleFieldUpdate(field, e.target.value)}
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
          Review Your Company Info
        </h2>
        <p className="text-base text-body-color dark:text-dark-6">
          {crawlStatus === "completed"
            ? "We've pre-filled your company information. Review and edit as needed."
            : "Please enter your company information below"}
        </p>
      </div>

      {/* Success Message */}
      {crawlStatus === "completed" && brandData && (
        <div className="mb-6 rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
          <div className="flex gap-2">
            <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-900 dark:text-green-100">
                Nice! While you were connecting Stripe, we fetched your brand and company info.
              </p>
              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                Click the edit icon to modify any field, or accept and continue.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Brand Preview */}
      {brandData && (brandData.logo_url || brandData.colors) && (
        <div className="mb-8 rounded-lg border border-stroke p-6 dark:border-dark-3">
          <h3 className="mb-4 text-sm font-semibold text-dark dark:text-white">Brand Preview</h3>
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

      {/* Form Fields */}
      <div className="space-y-4">
        {renderEditableField("Business Name", "businessName", "Enter your business name", true)}
        {renderEditableField("Business Description", "businessDescription", "Describe what your business does", false, true)}
        {renderEditableField("Company Address", "companyAddress", "123 Main St, City, State ZIP", false)}
        {renderEditableField("Contact Email", "contactEmail", "contact@example.com", false)}
        {renderEditableField("Contact Phone", "contactPhone", "+1 (555) 123-4567", false)}
      </div>

      {/* Voice & Tone */}
      {brandData?.voice && (
        <div className="mb-6 rounded-lg bg-purple-50 p-4 dark:bg-purple-900/20">
          <h4 className="mb-2 text-sm font-medium text-purple-900 dark:text-purple-100">
            🎯 Detected Brand Voice
          </h4>
          <p className="text-sm text-purple-700 dark:text-purple-300">{brandData.voice}</p>
        </div>
      )}

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
