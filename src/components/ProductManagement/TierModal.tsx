"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface TierModalProps {
  productId: string;
  tier?: any;
  onClose: (updated: boolean) => void;
}

const TierModal = ({ productId, tier, onClose }: TierModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: tier?.name || "",
    description: tier?.description || "",
    priceAmount: tier ? tier.priceAmount / 100 : 0,
    billingPeriod: tier?.billingPeriod || "monthly",
    usageLimit: tier?.usageLimit || "",
    features: tier?.features || [],
    isActive: tier?.isActive ?? true,
    sortOrder: tier?.sortOrder ?? 0,
    // Limit enforcement fields
    limitAction: tier?.limitAction || "warn",
    softLimitPercent: tier?.softLimitPercent || 0.8,
    overageAllowed: tier?.overageAllowed || false,
    overageRate: tier?.overageRate ? tier.overageRate / 100 : "",
  });
  const [featureInput, setFeatureInput] = useState("");

  const handleAddFeature = () => {
    if (featureInput.trim()) {
      setFormData({
        ...formData,
        features: [...formData.features, featureInput.trim()],
      });
      setFeatureInput("");
    }
  };

  const handleRemoveFeature = (index: number) => {
    setFormData({
      ...formData,
      features: formData.features.filter((_: any, i: number) => i !== index),
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = tier
        ? `/api/saas/tiers/${tier.id}`
        : "/api/saas/tiers";
      const method = tier ? "PUT" : "POST";

      const payload: any = {
        ...formData,
        productId,
        priceAmount: Math.round(formData.priceAmount * 100), // Convert to cents
        usageLimit: formData.usageLimit ? parseInt(formData.usageLimit as any) : null,
      };

      // Add limit enforcement fields if usage limit is set
      if (formData.usageLimit) {
        payload.limitAction = formData.limitAction;
        payload.softLimitPercent = formData.softLimitPercent;
        payload.overageAllowed = formData.limitAction === "overage";
        
        if (formData.limitAction === "overage" && formData.overageRate) {
          payload.overageRate = Math.round(parseFloat(formData.overageRate as any) * 100);
        }
      }

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${tier ? "update" : "create"} tier`);
      }

      toast.success(`Tier ${tier ? "updated" : "created"} successfully`);
      onClose(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to save tier");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-8 shadow-xl dark:bg-dark-2">
        <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
          {tier ? "Edit Pricing Tier" : "Create New Pricing Tier"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Tier Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Basic, Pro, Enterprise"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Price (USD) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                placeholder="9.99"
                value={formData.priceAmount}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    priceAmount: parseFloat(e.target.value),
                  })
                }
                required
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Billing Period *
              </label>
              <select
                value={formData.billingPeriod}
                onChange={(e) =>
                  setFormData({ ...formData, billingPeriod: e.target.value })
                }
                required
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="quarterly">Quarterly</option>
                <option value="one-time">One-time</option>
              </select>
            </div>

            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Usage Limit (optional)
              </label>
              <input
                type="number"
                min="0"
                placeholder="e.g., 10000"
                value={formData.usageLimit}
                onChange={(e) =>
                  setFormData({ ...formData, usageLimit: e.target.value })
                }
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>
          </div>

          <div className="mt-6">
            <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
              Description
            </label>
            <textarea
              placeholder="Describe what's included in this tier..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
            />
          </div>

          {/* Limit Enforcement Configuration - Only show if usage limit is set */}
          {formData.usageLimit && (
            <div className="mt-6 p-4 bg-gradient-to-r from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-900/30">
              <h3 className="text-base font-semibold text-dark dark:text-white mb-3">
                Usage Limit Enforcement
              </h3>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
                    Limit Action
                  </label>
                  <select
                    value={formData.limitAction}
                    onChange={(e) =>
                      setFormData({ ...formData, limitAction: e.target.value })
                    }
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                  >
                    <option value="warn">Soft Limit - Warn only</option>
                    <option value="block">Hard Limit - Block usage</option>
                    <option value="overage">Allow Overage - Charge extra</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
                    Warning Threshold (%)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formData.softLimitPercent * 100}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        softLimitPercent: parseFloat(e.target.value) / 100,
                      })
                    }
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                  />
                </div>
              </div>

              {formData.limitAction === "overage" && (
                <div className="mt-4">
                  <label className="mb-2.5 block text-sm font-medium text-dark dark:text-white">
                    Overage Rate (USD per unit)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.01"
                    value={formData.overageRate}
                    onChange={(e) =>
                      setFormData({ ...formData, overageRate: e.target.value })
                    }
                    className="w-full rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                  />
                  <p className="mt-1 text-xs text-body-color dark:text-dark-6">
                    Charge this amount for each unit used over the limit
                  </p>
                </div>
              )}

              <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs text-blue-700 dark:text-blue-300">
                <strong>💡 Tip:</strong> Soft limits (warn) provide the best user experience. Hard limits (block) protect your infrastructure. Overage pricing offers flexibility.
              </div>
            </div>
          )}

          <div className="mt-6">
            <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
              Features
            </label>
            <div className="mb-3 flex gap-2">
              <input
                type="text"
                placeholder="Add a feature..."
                value={featureInput}
                onChange={(e) => setFeatureInput(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddFeature();
                  }
                }}
                className="flex-1 rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
              <button
                type="button"
                onClick={handleAddFeature}
                className="rounded-md bg-primary px-4 py-3 text-sm font-medium text-white transition hover:bg-blue-dark"
              >
                Add
              </button>
            </div>
            {formData.features.length > 0 && (
              <div className="space-y-2">
                {formData.features.map((feature: string, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between rounded-md border border-stroke bg-gray-50 px-4 py-2 dark:border-dark-3 dark:bg-dark"
                  >
                    <span className="text-sm text-dark dark:text-white">
                      {feature}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveFeature(idx)}
                      className="text-red-600 transition hover:text-red-700 dark:text-red-400"
                    >
                      <svg
                        className="h-4 w-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Sort Order
              </label>
              <input
                type="number"
                min="0"
                value={formData.sortOrder}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sortOrder: parseInt(e.target.value),
                  })
                }
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            <div className="flex items-end">
              <label className="flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData({ ...formData, isActive: e.target.checked })
                  }
                  className="mr-3 h-5 w-5 rounded border-stroke text-primary focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:border-dark-3"
                />
                <span className="text-base text-dark dark:text-white">
                  Active (visible to subscribers)
                </span>
              </label>
            </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={loading}
              className="flex flex-1 items-center justify-center rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex flex-1 items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-dark disabled:opacity-50"
            >
              {loading ? <Loader /> : tier ? "Update Tier" : "Create Tier"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TierModal;
