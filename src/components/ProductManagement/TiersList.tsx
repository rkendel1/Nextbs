"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Eye, EyeOff } from "lucide-react";
import TierModal from "./TierModal";

interface TiersListProps {
  productId: string;
  tiers: any[];
  onUpdate: () => void;
}

const TiersList = ({ productId, tiers, onUpdate }: TiersListProps) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedTier, setSelectedTier] = useState<any>(null);

  const handleCreateTier = () => {
    setSelectedTier(null);
    setShowModal(true);
  };

  const handleEditTier = (tier: any) => {
    setSelectedTier(tier);
    setShowModal(true);
  };

  const handleToggleTierStatus = async (tierId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/saas/tiers/${tierId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update tier status");
      }

      toast.success(`Tier ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to update tier status");
    }
  };

  const handleDeleteTier = async (tierId: string) => {
    if (!confirm("Are you sure you want to delete this pricing tier?")) {
      return;
    }

    try {
      const response = await fetch(`/api/saas/tiers/${tierId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete tier");
      }

      toast.success("Tier deleted successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete tier");
    }
  };

  const handleModalClose = (updated: boolean) => {
    setShowModal(false);
    setSelectedTier(null);
    if (updated) {
      onUpdate();
    }
  };

  return (
    <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Pricing Tiers
          </h2>
          <p className="mt-1 text-sm text-body-color dark:text-dark-6">
            Configure pricing plans for your subscribers
          </p>
        </div>
        <button
          onClick={handleCreateTier}
          className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-dark"
        >
          <svg
            className="mr-2 h-5 w-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          Add Tier
        </button>
      </div>

      {/* Tiers List */}
      {tiers.length === 0 ? (
        <div className="py-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-3">
            <svg
              className="h-8 w-8 text-body-color dark:text-dark-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
            No pricing tiers yet
          </h3>
          <p className="mb-4 text-sm text-body-color dark:text-dark-6">
            Create your first pricing tier to start accepting subscriptions
          </p>
          <button
            onClick={handleCreateTier}
            className="inline-flex items-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-dark"
          >
            Create Tier
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tiers
            .sort((a, b) => a.sortOrder - b.sortOrder)
            .map((tier) => (
              <div
                key={tier.id}
                className={`rounded-lg border p-6 transition ${
                  tier.isActive 
                    ? "border-stroke hover:border-primary dark:border-dark-3 dark:hover:border-primary" 
                    : "border-dashed border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/20 opacity-75"
                }`}
              >
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className={`text-xl font-bold ${tier.isActive ? "text-dark dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                      {tier.name}
                    </h3>
                    {!tier.isActive && (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                  <button
                    onClick={() => handleToggleTierStatus(tier.id, tier.isActive)}
                    className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      tier.isActive
                        ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                        : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/30"
                    }`}
                    title={tier.isActive ? "Click to deactivate" : "Click to activate"}
                  >
                    {tier.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                    {tier.isActive ? "Live" : "Hidden"}
                  </button>
                </div>

                {tier.description && (
                  <p className="mb-4 text-sm text-body-color dark:text-dark-6">
                    {tier.description}
                  </p>
                )}

                <div className="mb-4">
                  <div className="mb-1 flex items-baseline">
                    <span className="text-3xl font-bold text-dark dark:text-white">
                      ${(tier.priceAmount / 100).toFixed(2)}
                    </span>
                    <span className="ml-2 text-sm text-body-color dark:text-dark-6">
                      / {tier.billingPeriod}
                    </span>
                  </div>
                  {tier.usageLimit && (
                    <p className="text-xs text-body-color dark:text-dark-6">
                      Up to {tier.usageLimit.toLocaleString()} usage units
                    </p>
                  )}
                </div>

                {tier.features && tier.features.length > 0 && (
                  <div className="mb-4 border-t border-stroke pt-4 dark:border-dark-3">
                    <h4 className="mb-2 text-sm font-semibold text-dark dark:text-white">
                      Features
                    </h4>
                    <ul className="space-y-2">
                      {tier.features.slice(0, 3).map((feature: string, idx: number) => (
                        <li
                          key={idx}
                          className="flex items-start text-sm text-body-color dark:text-dark-6"
                        >
                          <svg
                            className="mr-2 mt-0.5 h-4 w-4 flex-shrink-0 text-green-600 dark:text-green-400"
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
                      {tier.features.length > 3 && (
                        <li className="text-xs text-body-color dark:text-dark-6">
                          +{tier.features.length - 3} more features
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2 border-t border-stroke pt-4 dark:border-dark-3">
                  <button
                    onClick={() => handleEditTier(tier)}
                    className="flex-1 rounded-md border border-stroke px-3 py-2 text-sm text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white dark:hover:border-primary dark:hover:text-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleToggleTierStatus(tier.id, tier.isActive)}
                    className={`flex-1 rounded-md border px-3 py-2 text-sm transition ${
                      tier.isActive
                        ? "border-orange-200 text-orange-600 hover:border-orange-600 hover:bg-orange-50 dark:border-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/10"
                        : "border-green-200 text-green-600 hover:border-green-600 hover:bg-green-50 dark:border-green-900/20 dark:text-green-400 dark:hover:bg-green-900/10"
                    }`}
                  >
                    {tier.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => handleDeleteTier(tier.id)}
                    className="rounded-md border border-red-200 px-3 py-2 text-sm text-red-600 transition hover:border-red-600 hover:bg-red-50 dark:border-red-900/20 dark:text-red-400 dark:hover:border-red-600 dark:hover:bg-red-900/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Tier Modal */}
      {showModal && (
        <TierModal
          productId={productId}
          tier={selectedTier}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default TiersList;
