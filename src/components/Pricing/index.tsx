"use client";
import { useEffect, useState } from "react";
import SectionTitle from "../Common/SectionTitle";
import PricingBox from "./PricingBox";
import { Price } from "@/types/price";

const Pricing = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tiers, setTiers] = useState<Price[]>([]);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await fetch("/api/saas/tiers");
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch tiers");
        }

        // Use the tiers directly as they are already formatted by the API
        // Only filter out tiers without stripePriceId (though API already does this)
        const validTiers = data.tiers.filter((tier: any) => tier.id && tier.stripePriceId);

        setTiers(validTiers);
      } catch (err: any) {
        console.error("Error fetching tiers:", err);
        setError(err.message || "Failed to load pricing tiers");
      } finally {
        setLoading(false);
      }
    };

    fetchTiers();
  }, []);

  if (loading) {
    return (
      <section className="relative z-20 overflow-hidden bg-white pb-12 pt-20 dark:bg-dark lg:pb-[90px] lg:pt-[120px]">
        <div className="container">
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="relative z-20 overflow-hidden bg-white pb-12 pt-20 dark:bg-dark lg:pb-[90px] lg:pt-[120px]">
        <div className="container">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-red-500">Failed to load pricing tiers. Please try again later.</p>
          </div>
        </div>
      </section>
    );
  }

  if (tiers.length === 0) {
    return null; // Don't show pricing section if no tiers available
  }

  return (
    <section
      id="pricing"
      className="relative z-20 overflow-hidden bg-white pb-12 pt-20 dark:bg-dark lg:pb-[90px] lg:pt-[120px]"
    >
      <div className="container">
        <div className="mb-[60px]">
          <SectionTitle
            subtitle="Available Plans"
            title="Choose Your Subscription"
            paragraph="Select a plan that best fits your needs. All plans include access to our platform's core features and dedicated support."
            center
          />
        </div>

        <div className="-mx-4 flex flex-wrap justify-center">
          {tiers.map((tier) => (
            <PricingBox key={tier.id} product={tier} />
          ))}     
        </div>
      </div>
    </section>
  );
};

export default Pricing;