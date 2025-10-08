"use client";
import { useState } from "react";
import { X, Package, DollarSign, Tag, Sparkles, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface GuidedProductWizardProps {
  onClose: (updated: boolean) => void;
}

const GuidedProductWizard = ({ onClose }: GuidedProductWizardProps) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [tierData, setTierData] = useState({
    name: "",
    priceAmount: "",
    interval: "monthly" as "monthly" | "yearly",
    features: [""],
  });

  const addFeature = () => {
    setTierData({
      ...tierData,
      features: [...tierData.features, ""],
    });
  };

  const updateFeature = (index: number, value: string) => {
    const newFeatures = [...tierData.features];
    newFeatures[index] = value;
    setTierData({ ...tierData, features: newFeatures });
  };

  const removeFeature = (index: number) => {
    setTierData({
      ...tierData,
      features: tierData.features.filter((_, i) => i !== index),
    });
  };

  const handleCreateProduct = async () => {
    setLoading(true);
    try {
      // Create product
      const productResponse = await fetch("/api/saas/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(productData),
      });

      if (!productResponse.ok) {
        throw new Error("Failed to create product");
      }

      const product = await productResponse.json();

      // Create tier
      const tierResponse = await fetch("/api/saas/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId: product.product.id,
          name: tierData.name,
          priceAmount: Math.round(parseFloat(tierData.priceAmount) * 100), // Convert to cents
          interval: tierData.interval,
          features: tierData.features.filter((f) => f.trim() !== ""),
        }),
      });

      if (!tierResponse.ok) {
        throw new Error("Failed to create pricing tier");
      }

      setStep(4); // Move to success step
      setTimeout(() => {
        toast.success("Product created successfully! 🎉");
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                Name Your Product
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                What are you offering to your customers? Give it a clear, memorable name.
              </p>
            </div>

            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="e.g., API Access, Premium Plan, Pro Subscription"
                value={productData.name}
                onChange={(e) =>
                  setProductData({ ...productData, name: e.target.value })
                }
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                autoFocus
              />
            </div>

            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Description
              </label>
              <textarea
                placeholder="Describe what makes this product valuable..."
                value={productData.description}
                onChange={(e) =>
                  setProductData({ ...productData, description: e.target.value })
                }
                rows={3}
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Pro Tip
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    A great product name is specific, benefit-focused, and easy to remember. 
                    Think about what problem you're solving for your customers.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onClose(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!productData.name.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Next: Pricing
              </Button>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <DollarSign className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                Set Your Pricing
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                Create your first pricing tier. You can add more tiers later.
              </p>
            </div>

            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Tier Name *
              </label>
              <input
                type="text"
                placeholder="e.g., Starter, Professional, Enterprise"
                value={tierData.name}
                onChange={(e) =>
                  setTierData({ ...tierData, name: e.target.value })
                }
                className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                  Price (USD) *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="9.99"
                  value={tierData.priceAmount}
                  onChange={(e) =>
                    setTierData({ ...tierData, priceAmount: e.target.value })
                  }
                  className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                />
              </div>

              <div>
                <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                  Billing Period *
                </label>
                <select
                  value={tierData.interval}
                  onChange={(e) =>
                    setTierData({
                      ...tierData,
                      interval: e.target.value as "monthly" | "yearly",
                    })
                  }
                  className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                >
                  <option value="monthly">Monthly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>
            </div>

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Stripe Integration
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Your pricing will automatically sync with Stripe for seamless billing. 
                    We handle all the payment processing for you!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(3)}
                disabled={!tierData.name.trim() || !tierData.priceAmount}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Next: Features
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Tag className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                Add Features
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                What features are included in this tier? List the key benefits.
              </p>
            </div>

            <div className="space-y-3">
              {tierData.features.map((feature, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    placeholder={`Feature ${index + 1}`}
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    className="flex-1 rounded-md border border-stroke bg-transparent px-4 py-2 text-sm text-dark outline-none transition placeholder:text-dark-6 focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                  />
                  {tierData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            <Button
              type="button"
              variant="outline"
              onClick={addFeature}
              className="w-full"
            >
              + Add Another Feature
            </Button>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Quick Tip
                  </p>
                  <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                    Focus on value, not just features. Instead of "10 API calls", 
                    try "10,000 API calls per month" to be more specific.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={loading || tierData.features.every((f) => !f.trim())}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {loading ? <Loader /> : "Create Product"}
              </Button>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 mb-4">
              <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            
            <div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                Product Created! 🎉
              </h3>
              <p className="text-base text-body-color dark:text-dark-6 mb-6">
                Your product <strong>{productData.name}</strong> is now live and ready to sell!
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg">
              <h4 className="font-semibold text-dark dark:text-white mb-3">
                What's Next?
              </h4>
              <div className="space-y-2 text-sm text-left">
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-body-color dark:text-dark-6">
                    Synced with Stripe - billing is ready to go
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-body-color dark:text-dark-6">
                    Available on your white-label site
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-body-color dark:text-dark-6">
                    Ready to accept subscribers
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setStep(1);
                  setProductData({ name: "", description: "", isActive: true });
                  setTierData({ name: "", priceAmount: "", interval: "monthly", features: [""] });
                  setLoading(false);
                }}
                className="flex-1"
              >
                Create Another
              </Button>
              <Button
                onClick={() => onClose(true)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Done
              </Button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl dark:bg-dark-2 my-8">
        {/* Progress Indicator */}
        {step < 4 && (
          <div className="mb-8">
            <div className="flex justify-between mb-2">
              {[1, 2, 3].map((s) => (
                <div
                  key={s}
                  className={`flex-1 h-2 rounded-full mx-1 ${
                    s <= step
                      ? "bg-primary"
                      : "bg-gray-200 dark:bg-gray-700"
                  }`}
                />
              ))}
            </div>
            <p className="text-xs text-center text-body-color dark:text-dark-6">
              Step {step} of 3
            </p>
          </div>
        )}

        {renderStep()}
      </div>
    </div>
  );
};

export default GuidedProductWizard;
