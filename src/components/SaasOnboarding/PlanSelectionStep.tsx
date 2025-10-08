"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface Tier {
  id: string;
  nickname: string;
  unit_amount: number;
  offers: string[];
  product: {
    name: string;
    description?: string;
  };
  isActive: boolean;
  stripePriceId: string;
}

interface PlanSelectionStepProps {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  loading: boolean;
}

const PlanSelectionStep = ({ data, onComplete, onBack, loading }: PlanSelectionStepProps) => {
  const [selectedTierId, setSelectedTierId] = useState<string | null>(data.tierId || null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await fetch("/api/saas/tiers");
        if (!response.ok) {
          throw new Error("Failed to fetch plans");
        }
        const result = await response.json();
        setTiers(result.tiers || []);
      } catch (error: any) {
        console.error("Error fetching tiers:", error);
        toast.error("Failed to load available plans");
      } finally {
        setIsLoading(false);
      }
    };

    fetchTiers();
  }, []);

  const handleSelectTier = (tierId: string) => {
    setSelectedTierId(tierId);
  };

  const handleContinue = async () => {
    if (!selectedTierId) {
      toast.error("Please select a plan to continue");
      return;
    }

    if (submitting) return;

    setSubmitting(true);
    try {
      // Create subscription
      const subResponse = await fetch("/api/saas/my-subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tierId: selectedTierId }),
      });

      if (!subResponse.ok) {
        const errorData = await subResponse.json();
        throw new Error(errorData.error || "Failed to subscribe to plan");
      }

      const subResult = await subResponse.json();
      toast.success("Plan selected successfully!");

      // Advance to next step
      onComplete({ tierId: selectedTierId });
    } catch (error: any) {
      console.error("Error selecting plan:", error);
      toast.error(error.message || "Failed to select plan");
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
        <Loader />
      </div>
    );
  }

  if (tiers.length === 0) {
    return (
      <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
        <h2 className="mb-3 text-center text-3xl font-bold text-dark dark:text-white">
          Select Your Platform Plan
        </h2>
        <p className="mb-10 text-center text-base text-body-color dark:text-dark-6">
          No plans available at the moment. Please contact support.
        </p>
        <div className="flex gap-4">
          <button
            onClick={onBack}
            disabled={loading}
            className="flex flex-1 items-center justify-center rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white disabled:opacity-50"
          >
            Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
      <h2 className="mb-3 text-center text-3xl font-bold text-dark dark:text-white">
        Select Your Platform Plan
      </h2>
      <p className="mb-10 text-center text-base text-body-color dark:text-dark-6">
        Choose a plan to access platform features like product creation and usage metering. This is required to continue.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
        {tiers.map((tier) => {
          const isSelected = selectedTierId === tier.id;
          const price = tier.unit_amount / 100;
          const isFree = price === 0;
          const priceDisplay = isFree ? "Free" : `$${price}/month`;

          return (
            <div
              key={tier.id}
              className={`rounded-lg border p-6 transition-all ${
                isSelected
                  ? "border-primary bg-primary/5 shadow-lg"
                  : "border-gray-200 hover:border-primary/50 dark:border-dark-3"
              }`}
            >
              <div className="mb-4">
                <h3 className="text-xl font-semibold text-dark dark:text-white">
                  {tier.nickname}
                </h3>
                <p className="text-3xl font-bold text-primary mt-2">
                  {priceDisplay}
                </p>
                {tier.product.description && (
                  <p className="mt-2 text-sm text-body-color dark:text-dark-6">
                    {tier.product.description}
                  </p>
                )}
              </div>

              <ul className="mb-6 space-y-2">
                {tier.offers.map((feature, index) => (
                  <li key={index} className="flex items-center text-sm">
                    <svg
                      className="mr-2 h-4 w-4 text-green-500"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => handleSelectTier(tier.id)}
                className={`w-full rounded-md py-3 font-semibold transition ${
                  isSelected
                    ? "bg-primary text-white"
                    : isFree
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "border border-primary bg-transparent text-primary hover:bg-primary hover:text-white"
                }`}
              >
                {isSelected ? "Selected" : "Select Plan"}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={loading || submitting}
          className="flex flex-1 items-center justify-center rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={loading || submitting || !selectedTierId}
          className="flex flex-1 items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-dark disabled:opacity-50"
        >
          Continue {submitting && <Loader />}
        </button>
      </div>
    </div>
  );
};

export default PlanSelectionStep;