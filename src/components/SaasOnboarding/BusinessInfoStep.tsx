"use client";
import { useState } from "react";
import Loader from "@/components/Common/Loader";

interface BusinessInfoStepProps {
  data: any;
  onComplete: (data: any) => void;
  loading: boolean;
}

const BusinessInfoStep = ({ data, onComplete, loading }: BusinessInfoStepProps) => {
  const [formData, setFormData] = useState({
    businessName: data.businessName || "",
    businessDescription: data.businessDescription || "",
    website: data.website || "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  return (
    <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
      <h2 className="mb-3 text-center text-3xl font-bold text-dark dark:text-white">
        Tell us about your SaaS business
      </h2>
      <p className="mb-10 text-center text-base text-body-color dark:text-dark-6">
        Let&apos;s start by gathering some basic information about your business
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
            Business Name *
          </label>
          <input
            type="text"
            placeholder="Acme SaaS Inc."
            value={formData.businessName}
            onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
            required
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          />
        </div>

        <div className="mb-6">
          <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
            Business Description
          </label>
          <textarea
            placeholder="Describe what your SaaS product does..."
            value={formData.businessDescription}
            onChange={(e) => setFormData({ ...formData, businessDescription: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          />
        </div>

        <div className="mb-8">
          <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
            Website URL
          </label>
          <input
            type="url"
            placeholder="https://example.com"
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-dark disabled:opacity-50"
        >
          Continue {loading && <Loader />}
        </button>
      </form>
    </div>
  );
};

export default BusinessInfoStep;
