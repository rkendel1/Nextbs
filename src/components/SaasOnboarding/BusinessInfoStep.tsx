"use client";
import { useState } from "react";
import Loader from "@/components/Common/Loader";
import toast from "react-hot-toast";
import { Sparkles } from "lucide-react";

interface BusinessInfoStepProps {
  data: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

const BusinessInfoStep = ({ data, onComplete, loading }: BusinessInfoStepProps) => {
  const [formData, setFormData] = useState({
    website: data.website || "",
  });
  const [isValidating, setIsValidating] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.website) {
      toast.error("Please enter your website URL");
      return;
    }

    // Validate URL format
    try {
      new URL(formData.website);
    } catch {
      toast.error("Please enter a valid URL (e.g., https://example.com)");
      return;
    }

    setIsValidating(true);

    try {
      // Trigger the crawler
      const scrapeResponse = await fetch("/api/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: formData.website }),
      });

      if (!scrapeResponse.ok) {
        const errorData = await scrapeResponse.json();
        throw new Error(errorData.error || "Failed to start crawler");
      }

      const scrapeData = await scrapeResponse.json();
      console.log("Crawler started:", scrapeData);

      // Show toast notification
      toast.success("🪄 Preparing your workspace…", {
        duration: 4000,
        icon: "✨",
      });

      // Continue to next step
      onComplete({ website: formData.website });
    } catch (error: any) {
      console.error("Crawler start error:", error);
      toast.error(error.message || "Failed to process URL. Please try again.");
    } finally {
      setIsValidating(false);
    }
  };

  return (
    <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
      <h2 className="mb-3 text-center text-3xl font-bold text-dark dark:text-white">
        Just drop your URL
      </h2>
      <p className="mb-10 text-center text-base text-body-color dark:text-dark-6">
        Paste your website and we&apos;ll handle the rest. Your brand, your colors, your info — all automatically detected.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-8">
          <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
            Your website
          </label>
          <input
            type="url"
            placeholder="https://your-company.com"
            value={formData.website}
            onChange={(e) => setFormData({ website: e.target.value })}
            required
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          />
          <p className="mt-2 text-sm text-body-color dark:text-dark-6">
            We&apos;ll read your site and pull everything we need — you won&apos;t have to type it twice
          </p>
        </div>

        {/* Info Box */}
        <div className="mb-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <div className="flex gap-2">
            <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Here&apos;s what happens next
              </p>
              <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                While you&apos;re connecting Stripe, we&apos;ll scan your site for your logo, brand colors, 
                fonts, and company details. By the time you&apos;re back, everything will be ready to review.
              </p>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading || isValidating}
          className="flex w-full items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-dark disabled:opacity-50"
        >
          {isValidating ? (
            <>
              Validating URL... <Loader />
            </>
          ) : loading ? (
            <>
              Continue <Loader />
            </>
          ) : (
            "Continue to Stripe"
          )}
        </button>
      </form>
    </div>
  );
};

export default BusinessInfoStep;
