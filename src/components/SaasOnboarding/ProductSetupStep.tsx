"use client";
import { useState } from "react";
import Loader from "@/components/Common/Loader";

interface ProductSetupStepProps {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  loading: boolean;
  onSkip?: () => void;
}

const ProductSetupStep = ({ data, onComplete, onBack, loading }: ProductSetupStepProps) => {
  const [formData, setFormData] = useState({
    productName: data.productName || "",
    productDescription: data.productDescription || "",
    skipForNow: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onComplete(formData);
  };

  const handleSkip = () => {
    onComplete({ ...formData, skipForNow: true });
  };

  return (
    <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
      <h2 className="mb-3 text-center text-3xl font-bold text-dark dark:text-white">
        Create your first product
      </h2>
      <p className="mb-10 text-center text-base text-body-color dark:text-dark-6">
        Set up your initial product offering (you can add more later)
      </p>

      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
            Product Name *
          </label>
          <input
            type="text"
            placeholder="e.g., API Access, Premium Plan"
            value={formData.productName}
            onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
            required
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          />
        </div>

        <div className="mb-8">
          <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
            Product Description
          </label>
          <textarea
            placeholder="Describe what customers get with this product..."
            value={formData.productDescription}
            onChange={(e) => setFormData({ ...formData, productDescription: e.target.value })}
            rows={4}
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          />
        </div>

        <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900/20">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <strong>Note:</strong> You&apos;ll be able to configure pricing tiers and detailed features in your dashboard after completing onboarding.
          </p>
        </div>

        <div className="mt-8 flex gap-4">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="flex flex-1 items-center justify-center rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white disabled:opacity-50"
          >
            Back
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex flex-1 items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-dark disabled:opacity-50"
          >
            Continue {loading && <Loader />}
          </button>
        </div>

        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={handleSkip}
            className="text-sm text-body-color hover:text-primary dark:text-dark-6 dark:hover:text-primary"
          >
            Skip for now (set up products later)
          </button>
        </div>
      </form>
    </div>
  );
};

export default ProductSetupStep;
