"use client";
import { useState, useEffect } from "react";
import { X, Package, DollarSign, Tag, Sparkles, CheckCircle2, Zap, Clock, TrendingUp, Code, Rocket, Activity, Settings, Copy, CopyCheck, Eye, Webhook, Key, AlertTriangle, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";
import ProductPreviewCard from "./ProductPreviewCard";

interface GuidedProductWizardProps {
  onClose: (updated: boolean) => void;
}

type ProductType = "subscription" | "one-time" | "usage-based" | "metered";
type BillingPeriod = "monthly" | "yearly" | "quarterly" | "one-time";

const GuidedProductWizard = ({ onClose }: GuidedProductWizardProps) => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [productType, setProductType] = useState<ProductType>("subscription");
  const [productData, setProductData] = useState({
    name: "",
    description: "",
    isActive: true,
  });
  const [tierData, setTierData] = useState({
    name: "",
    priceAmount: "",
    billingPeriod: "monthly" as BillingPeriod,
    features: [""],
    usageLimit: "",
  });
  const [meteringConfig, setMeteringConfig] = useState({
    meteringType: "requests",
    meteringUnit: "count",
    aggregationType: "sum",
  });
  const [limitConfig, setLimitConfig] = useState({
    limitAction: "warn" as "warn" | "block" | "overage",
    softLimitPercent: 80,
    overageRate: "",
  });
  const [webhookConfig, setWebhookConfig] = useState({
    enabled: false,
    url: "",
    events: [] as string[],
  });
  const [apiKeyConfig, setApiKeyConfig] = useState({
    requiresApiKey: false,
    apiKeyName: "",
  });
  const [createdProductId, setCreatedProductId] = useState<string>("");
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [embedCode, setEmbedCode] = useState("");
  const [showEmbedPreview, setShowEmbedPreview] = useState(false);

  useEffect(() => {
    // Fetch white-label config on mount for preview card
    const fetchWhiteLabelConfig = async () => {
      try {
        const response = await fetch("/api/saas/white-label");
        if (response.ok) {
          const data = await response.json();
          setWhiteLabelConfig(data.whiteLabel);
        }
      } catch (error) {
        console.error("Failed to fetch white-label config:", error);
      }
    };
    fetchWhiteLabelConfig();
  }, []);

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
      setCreatedProductId(product.product.id);

      // Create tier based on product type
      const tierPayload: any = {
        productId: product.product.id,
        name: tierData.name,
        priceAmount: productType === "one-time" 
          ? Math.round(parseFloat(tierData.priceAmount) * 100)
          : Math.round(parseFloat(tierData.priceAmount) * 100),
        billingPeriod: productType === "one-time" ? "one-time" : tierData.billingPeriod,
        features: tierData.features.filter((f) => f.trim() !== ""),
      };

      // Add usage limit for usage-based products
      if ((productType === "usage-based" || productType === "metered") && tierData.usageLimit) {
        tierPayload.usageLimit = parseInt(tierData.usageLimit);
        // Add limit enforcement configuration
        tierPayload.limitAction = limitConfig.limitAction;
        tierPayload.softLimitPercent = limitConfig.softLimitPercent / 100; // Convert to decimal
        if (limitConfig.limitAction === "overage" && limitConfig.overageRate) {
          tierPayload.overageRate = Math.round(parseFloat(limitConfig.overageRate) * 100); // Convert to cents
        }
      }

      const tierResponse = await fetch("/api/saas/tiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tierPayload),
      });

      if (!tierResponse.ok) {
        throw new Error("Failed to create pricing tier");
      }

      // Create metering config for metered/usage-based products
      if (productType === "metered" || productType === "usage-based") {
        const meteringPayload: any = {
          productId: product.product.id,
          ...meteringConfig,
        };

        // Add webhook URL if configured
        if (webhookConfig.enabled && webhookConfig.url) {
          meteringPayload.usageReportingUrl = webhookConfig.url;
          meteringPayload.webhookEvents = webhookConfig.events;
        }

        const meteringResponse = await fetch("/api/saas/metering", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(meteringPayload),
        });

        if (!meteringResponse.ok) {
          console.warn("Failed to create metering config, but product was created");
        }
      }

      // Create API key if required
      if (apiKeyConfig.requiresApiKey && apiKeyConfig.apiKeyName) {
        try {
          const apiKeyResponse = await fetch("/api/saas/api-keys", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: apiKeyConfig.apiKeyName,
              productId: product.product.id,
              permissions: ["usage:read", "usage:write"],
            }),
          });

          if (!apiKeyResponse.ok) {
            console.warn("Failed to create API key, but product was created");
          }
        } catch (error) {
          console.warn("Error creating API key:", error);
        }
      }

      // Fetch white-label config for the creator
      const creatorResponse = await fetch("/api/saas/white-label");
      if (creatorResponse.ok) {
        const creatorData = await creatorResponse.json();
        setWhiteLabelConfig(creatorData.whiteLabel);
      }

      setStep(6); // Move to success step
      setTimeout(() => {
        toast.success("Product created successfully! 🎉");
      }, 500);
    } catch (error: any) {
      toast.error(error.message || "Failed to create product");
      setLoading(false);
    }
  };

  const productTypeOptions = [
    {
      type: "subscription" as ProductType,
      icon: Clock,
      title: "Recurring Subscription",
      description: "Monthly or yearly recurring payments",
      example: "SaaS platform, membership site, newsletter",
      color: "blue",
    },
    {
      type: "one-time" as ProductType,
      icon: DollarSign,
      title: "One-time Payment",
      description: "Single purchase, no recurring charges",
      example: "E-book, course, lifetime access",
      color: "green",
    },
    {
      type: "usage-based" as ProductType,
      icon: TrendingUp,
      title: "Usage-based Billing",
      description: "Pay per use (API calls, storage, etc.)",
      example: "API service, cloud storage, SMS credits",
      color: "purple",
    },
    {
      type: "metered" as ProductType,
      icon: Activity,
      title: "Metered Billing",
      description: "Base fee + usage charges",
      example: "Platform with base + API overages",
      color: "orange",
    },
  ];

  const renderStep = () => {
    switch (step) {
      case 0:
        return (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Rocket className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                Choose Your Product Type
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                Select the billing model that best fits your product
              </p>
            </div>

            <div className="grid gap-4">
              {productTypeOptions.map((option) => {
                const Icon = option.icon;
                const isSelected = productType === option.type;
                return (
                  <button
                    key={option.type}
                    onClick={() => setProductType(option.type)}
                    className={`relative p-6 rounded-xl border-2 transition-all text-left ${
                      isSelected
                        ? "border-primary bg-primary/5 dark:bg-primary/10"
                        : "border-stroke hover:border-primary/50 dark:border-dark-3"
                    }`}
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-semibold text-dark dark:text-white mb-1">
                          {option.title}
                        </h4>
                        <p className="text-sm text-body-color dark:text-dark-6 mb-2">
                          {option.description}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-body-color dark:text-dark-6">
                          <Sparkles className="h-3 w-3" />
                          <span>Example: {option.example}</span>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="h-6 w-6 text-primary" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                    Not sure which to choose?
                  </p>
                  <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                    Most SaaS products start with <strong>Recurring Subscription</strong>. 
                    You can always add more product types later!
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
                onClick={() => setStep(1)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Continue
              </Button>
            </div>
          </div>
        );

      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Package className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                Product Information
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                Enter the name and description for your {productTypeOptions.find(p => p.type === productType)?.title.toLowerCase()}
              </p>
            </div>

            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Product Name *
              </label>
              <input
                type="text"
                placeholder={
                  productType === "subscription" ? "e.g., Pro Plan, Premium Access" :
                  productType === "one-time" ? "e.g., Complete Course, Lifetime Access" :
                  productType === "usage-based" ? "e.g., API Credits, Storage Package" :
                  "e.g., Platform Access + Usage"
                }
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
                    Product Name Best Practices
                  </p>
                  <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                    <li>• Keep it short and memorable (2-4 words)</li>
                    <li>• Clearly indicate the value tier (Starter, Pro, Enterprise)</li>
                    <li>• Avoid technical jargon unless targeting developers</li>
                    <li>• Make it easy to say and spell</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Package className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                    Description Tips for Product Cards
                  </p>
                  <ul className="text-sm text-purple-700 dark:text-purple-300 mt-2 space-y-1">
                    <li>• Lead with the main benefit, not features</li>
                    <li>• Keep it under 150 characters for best display</li>
                    <li>• Use action words that inspire confidence</li>
                    <li>• Example: "Everything you need to scale your business" vs "Includes API access and support"</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(0)}
                className="flex-1"
              >
                Back
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
                Configure pricing for your {productTypeOptions.find(p => p.type === productType)?.title.toLowerCase()}
              </p>
            </div>

            <div>
              <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                Tier Name *
              </label>
              <input
                type="text"
                placeholder={
                  productType === "subscription" ? "e.g., Starter, Professional, Enterprise" :
                  productType === "one-time" ? "e.g., Standard, Premium, Complete" :
                  "e.g., Pay-as-you-go, Volume Tier"
                }
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
                  placeholder={productType === "usage-based" ? "0.01 per unit" : "9.99"}
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
                  value={tierData.billingPeriod}
                  onChange={(e) =>
                    setTierData({
                      ...tierData,
                      billingPeriod: e.target.value as BillingPeriod,
                    })
                  }
                  disabled={productType === "one-time"}
                  className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary disabled:opacity-50"
                >
                  {productType === "one-time" ? (
                    <option value="one-time">One-time</option>
                  ) : (
                    <>
                      <option value="monthly">Monthly</option>
                      <option value="yearly">Yearly</option>
                      <option value="quarterly">Quarterly</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {(productType === "usage-based" || productType === "metered") && (
              <div>
                <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                  Usage Limit (optional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g., 10000 API calls"
                  value={tierData.usageLimit}
                  onChange={(e) =>
                    setTierData({ ...tierData, usageLimit: e.target.value })
                  }
                  className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                />
                <p className="mt-2 text-xs text-body-color dark:text-dark-6">
                  Set a monthly usage limit. Leave empty for unlimited.
                </p>
              </div>
            )}

            <div className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-dark dark:text-white">
                    {productType === "subscription" && "Recurring Revenue"}
                    {productType === "one-time" && "One-time Revenue"}
                    {productType === "usage-based" && "Usage-based Revenue"}
                    {productType === "metered" && "Hybrid Revenue Model"}
                  </p>
                  <p className="text-sm text-body-color dark:text-dark-6 mt-1">
                    {productType === "subscription" && "Customers will be charged automatically each billing period."}
                    {productType === "one-time" && "Customers pay once and get lifetime access."}
                    {productType === "usage-based" && "Customers pay based on actual usage. Perfect for APIs and services."}
                    {productType === "metered" && "Combine base subscription with usage charges for flexible pricing."}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-orange-900 dark:text-orange-100">
                    Pricing Psychology
                  </p>
                  <ul className="text-sm text-orange-700 dark:text-orange-300 mt-2 space-y-1">
                    <li>• $9.99 feels cheaper than $10 (charm pricing)</li>
                    <li>• Annual plans should offer 15-20% savings</li>
                    <li>• Price based on value delivered, not just costs</li>
                    <li>• Consider competitor pricing in your market</li>
                  </ul>
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
                Next: {productType === "metered" || productType === "usage-based" ? "Metering" : "Features"}
              </Button>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                {(productType === "metered" || productType === "usage-based") ? (
                  <Settings className="h-8 w-8 text-primary" />
                ) : (
                  <Tag className="h-8 w-8 text-primary" />
                )}
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                {(productType === "metered" || productType === "usage-based") ? "Metering Configuration" : "Add Features"}
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                {(productType === "metered" || productType === "usage-based") 
                  ? "Configure how usage will be tracked and billed"
                  : "What features are included in this tier?"}
              </p>
            </div>

            {(productType === "metered" || productType === "usage-based") && (
              <div className="space-y-4">
                <div>
                  <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                    Metering Type *
                  </label>
                  <select
                    value={meteringConfig.meteringType}
                    onChange={(e) =>
                      setMeteringConfig({ ...meteringConfig, meteringType: e.target.value })
                    }
                    className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                  >
                    <option value="requests">API Requests</option>
                    <option value="users">Active Users</option>
                    <option value="storage">Storage (GB)</option>
                    <option value="compute">Compute Hours</option>
                    <option value="bandwidth">Bandwidth (GB)</option>
                    <option value="messages">Messages Sent</option>
                    <option value="custom">Custom Metric</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                      Unit of Measurement
                    </label>
                    <select
                      value={meteringConfig.meteringUnit}
                      onChange={(e) =>
                        setMeteringConfig({ ...meteringConfig, meteringUnit: e.target.value })
                      }
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                    >
                      <option value="count">Count</option>
                      <option value="GB">Gigabytes (GB)</option>
                      <option value="hours">Hours</option>
                      <option value="MB">Megabytes (MB)</option>
                    </select>
                  </div>

                  <div>
                    <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                      Aggregation Type
                    </label>
                    <select
                      value={meteringConfig.aggregationType}
                      onChange={(e) =>
                        setMeteringConfig({ ...meteringConfig, aggregationType: e.target.value })
                      }
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                    >
                      <option value="sum">Sum (Total)</option>
                      <option value="max">Maximum</option>
                      <option value="last_during_period">Last Value</option>
                    </select>
                  </div>
                </div>

                <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                  <div className="flex gap-2">
                    <Activity className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                        Usage Tracking
                      </p>
                      <p className="text-sm text-purple-700 dark:text-purple-300 mt-1">
                        You'll receive implementation instructions in the next step showing how to report usage to our API.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Limit Enforcement Configuration */}
                {tierData.usageLimit && (
                  <div className="space-y-4 border-t border-stroke dark:border-dark-3 pt-4 mt-4">
                    <h4 className="font-semibold text-dark dark:text-white flex items-center gap-2">
                      <Shield className="h-5 w-5 text-primary" />
                      Limit Enforcement
                    </h4>

                    <div>
                      <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                        What happens when limit is reached? *
                      </label>
                      <select
                        value={limitConfig.limitAction}
                        onChange={(e) =>
                          setLimitConfig({ ...limitConfig, limitAction: e.target.value as "warn" | "block" | "overage" })
                        }
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:text-white dark:focus:border-primary"
                      >
                        <option value="warn">Soft Limit (Warn only - allow usage to continue)</option>
                        <option value="block">Hard Limit (Block usage when exceeded)</option>
                        <option value="overage">Allow Overage (Charge extra for usage over limit)</option>
                      </select>
                      <p className="mt-2 text-xs text-body-color dark:text-dark-6">
                        {limitConfig.limitAction === "warn" && "Users receive warnings but can continue using the service"}
                        {limitConfig.limitAction === "block" && "Usage is blocked once limit is reached"}
                        {limitConfig.limitAction === "overage" && "Users are charged for usage beyond the limit"}
                      </p>
                    </div>

                    <div>
                      <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                        Warning Threshold (%)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        placeholder="80"
                        value={limitConfig.softLimitPercent}
                        onChange={(e) =>
                          setLimitConfig({ ...limitConfig, softLimitPercent: parseInt(e.target.value) || 80 })
                        }
                        className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                      />
                      <p className="mt-2 text-xs text-body-color dark:text-dark-6">
                        Users will receive a warning when they reach this percentage of their limit (e.g., 80% means warning at {tierData.usageLimit ? Math.floor(parseInt(tierData.usageLimit) * (limitConfig.softLimitPercent / 100)) : 0} units)
                      </p>
                    </div>

                    {limitConfig.limitAction === "overage" && (
                      <div>
                        <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                          Overage Rate (USD per unit)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.01"
                          value={limitConfig.overageRate}
                          onChange={(e) =>
                            setLimitConfig({ ...limitConfig, overageRate: e.target.value })
                          }
                          className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                        />
                        <p className="mt-2 text-xs text-body-color dark:text-dark-6">
                          Price charged per unit over the limit (e.g., $0.01 per API call over limit)
                        </p>
                      </div>
                    )}

                    <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                      <div className="flex gap-2">
                        <AlertTriangle className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Limit Enforcement Best Practices
                          </p>
                          <ul className="text-sm text-blue-700 dark:text-blue-300 mt-2 space-y-1">
                            <li>• Set warning at 80-90% to give users time to upgrade</li>
                            <li>• Hard limits work best for free tiers</li>
                            <li>• Overage pricing provides flexibility for power users</li>
                            <li>• Always communicate limits clearly to users</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-base font-medium text-dark dark:text-white">
                Features & Benefits
              </label>
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

            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Tag className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-900 dark:text-green-100">
                    Feature Presentation Tips
                  </p>
                  <ul className="text-sm text-green-700 dark:text-green-300 mt-2 space-y-1">
                    <li>• Start with the most valuable feature first</li>
                    <li>• Use specific numbers: "10,000 API calls" not "API access"</li>
                    <li>• Focus on outcomes: "24/7 priority support" not "support included"</li>
                    <li>• Limit to 5-7 key features for better readability</li>
                  </ul>
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
                onClick={() => setStep((productType === "metered" || productType === "usage-based") ? 4 : 5)}
                disabled={tierData.features.every((f) => !f.trim())}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Next: {(productType === "metered" || productType === "usage-based") ? "Implementation" : "Review"}
              </Button>
            </div>
          </div>
        );

      case 4:
        // Implementation Guide (only for metered/usage-based)
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <Code className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                Implementation Guide
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                How to integrate usage tracking into your product
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-6 rounded-lg">
              <h4 className="font-semibold text-dark dark:text-white mb-3 flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Report Usage to Our API
              </h4>
              <p className="text-sm text-body-color dark:text-dark-6 mb-4">
                Call this endpoint whenever you want to track usage:
              </p>
              <div className="bg-dark dark:bg-dark-2 p-4 rounded-lg font-mono text-sm text-white overflow-x-auto">
                <div className="text-green-400 mb-2">POST /api/saas/usage</div>
                <div className="text-gray-400">{'{'}</div>
                <div className="ml-4 text-blue-300">"subscriptionId"<span className="text-white">:</span> <span className="text-yellow-300">"sub_xxx"</span>,</div>
                <div className="ml-4 text-blue-300">"quantity"<span className="text-white">:</span> <span className="text-yellow-300">100</span>,</div>
                <div className="ml-4 text-blue-300">"timestamp"<span className="text-white">:</span> <span className="text-yellow-300">"2024-01-15T10:30:00Z"</span></div>
                <div className="text-gray-400">{'}'}</div>
              </div>
            </div>

            <div className="space-y-3">
              <div className="bg-white dark:bg-dark-2 p-4 rounded-lg border border-stroke dark:border-dark-3">
                <h5 className="font-medium text-dark dark:text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Example: Track API Requests
                </h5>
                <div className="bg-gray-50 dark:bg-dark p-3 rounded font-mono text-xs overflow-x-auto">
                  <div className="text-purple-600 dark:text-purple-400">// After each API request</div>
                  <div className="text-blue-600 dark:text-blue-400">await fetch<span className="text-dark dark:text-white">(</span><span className="text-green-600">'/api/saas/usage'</span>, {'{'}</div>
                  <div className="ml-4">method: <span className="text-green-600">'POST'</span>,</div>
                  <div className="ml-4">body: JSON.stringify({'{'} quantity: 1 {'}'})</div>
                  <div className="text-blue-600 dark:text-blue-400">{'}'}<span className="text-dark dark:text-white">)</span></div>
                </div>
              </div>

              <div className="bg-white dark:bg-dark-2 p-4 rounded-lg border border-stroke dark:border-dark-3">
                <h5 className="font-medium text-dark dark:text-white mb-2 flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Example: Track Storage Usage
                </h5>
                <div className="bg-gray-50 dark:bg-dark p-3 rounded font-mono text-xs overflow-x-auto">
                  <div className="text-purple-600 dark:text-purple-400">// When file is uploaded</div>
                  <div className="text-blue-600 dark:text-blue-400">const fileSizeGB = fileSize / <span className="text-orange-600">(1024 ** 3)</span></div>
                  <div className="text-blue-600 dark:text-blue-400">await reportUsage<span className="text-dark dark:text-white">(</span>fileSizeGB<span className="text-dark dark:text-white">)</span></div>
                </div>
              </div>
            </div>

            {/* Webhook Configuration */}
            <div className="border-t border-stroke dark:border-dark-3 pt-6 space-y-4">
              <h4 className="font-semibold text-dark dark:text-white flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                Webhook Configuration (Optional)
              </h4>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="enableWebhooks"
                  checked={webhookConfig.enabled}
                  onChange={(e) =>
                    setWebhookConfig({ ...webhookConfig, enabled: e.target.checked })
                  }
                  className="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="enableWebhooks" className="text-base font-medium text-dark dark:text-white">
                  Enable webhook notifications for usage events
                </label>
              </div>

              {webhookConfig.enabled && (
                <div className="space-y-4 pl-7">
                  <div>
                    <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                      Webhook URL *
                    </label>
                    <input
                      type="url"
                      placeholder="https://your-domain.com/webhooks/usage"
                      value={webhookConfig.url}
                      onChange={(e) =>
                        setWebhookConfig({ ...webhookConfig, url: e.target.value })
                      }
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                    />
                    <p className="mt-2 text-xs text-body-color dark:text-dark-6">
                      We&apos;ll send POST requests to this URL when usage events occur
                    </p>
                  </div>

                  <div>
                    <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                      Events to Track
                    </label>
                    <div className="space-y-2">
                      {[
                        { value: "usage.recorded", label: "Usage Recorded", desc: "Triggered each time usage is reported" },
                        { value: "limit.warning", label: "Limit Warning", desc: "Triggered at warning threshold" },
                        { value: "limit.exceeded", label: "Limit Exceeded", desc: "Triggered when limit is reached" },
                        { value: "subscription.updated", label: "Subscription Updated", desc: "Triggered on subscription changes" },
                      ].map((event) => (
                        <div key={event.value} className="flex items-start gap-3 p-3 rounded-lg border border-stroke dark:border-dark-3">
                          <input
                            type="checkbox"
                            id={event.value}
                            checked={webhookConfig.events.includes(event.value)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setWebhookConfig({
                                  ...webhookConfig,
                                  events: [...webhookConfig.events, event.value],
                                });
                              } else {
                                setWebhookConfig({
                                  ...webhookConfig,
                                  events: webhookConfig.events.filter((ev) => ev !== event.value),
                                });
                              }
                            }}
                            className="mt-1 h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                          />
                          <label htmlFor={event.value} className="flex-1">
                            <p className="text-sm font-medium text-dark dark:text-white">{event.label}</p>
                            <p className="text-xs text-body-color dark:text-dark-6">{event.desc}</p>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                    <div className="flex gap-2">
                      <Code className="h-5 w-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-purple-900 dark:text-purple-100">
                          Webhook Payload Example
                        </p>
                        <pre className="text-xs text-purple-700 dark:text-purple-300 mt-2 overflow-x-auto">
{`{
  "event": "usage.recorded",
  "subscriptionId": "sub_xxx",
  "userId": "user_xxx",
  "quantity": 100,
  "timestamp": "2024-01-15T10:30:00Z"
}`}
                        </pre>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* API Key Management */}
            <div className="border-t border-stroke dark:border-dark-3 pt-6 space-y-4">
              <h4 className="font-semibold text-dark dark:text-white flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Key Management (Optional)
              </h4>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="requiresApiKey"
                  checked={apiKeyConfig.requiresApiKey}
                  onChange={(e) =>
                    setApiKeyConfig({ ...apiKeyConfig, requiresApiKey: e.target.checked })
                  }
                  className="h-4 w-4 text-primary focus:ring-2 focus:ring-primary"
                />
                <label htmlFor="requiresApiKey" className="text-base font-medium text-dark dark:text-white">
                  Generate API keys for subscribers
                </label>
              </div>

              {apiKeyConfig.requiresApiKey && (
                <div className="space-y-4 pl-7">
                  <div>
                    <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
                      API Key Purpose/Name
                    </label>
                    <input
                      type="text"
                      placeholder="e.g., Production API Access"
                      value={apiKeyConfig.apiKeyName}
                      onChange={(e) =>
                        setApiKeyConfig({ ...apiKeyConfig, apiKeyName: e.target.value })
                      }
                      className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
                    />
                    <p className="mt-2 text-xs text-body-color dark:text-dark-6">
                      Helps you and subscribers identify the key&apos;s purpose
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <div className="flex gap-2">
                      <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-green-900 dark:text-green-100">
                          Automatic API Key Generation
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          When enabled, we&apos;ll automatically generate a unique API key for each subscriber. 
                          Keys are securely sent via email and displayed in their account dashboard.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg">
              <div className="flex gap-2">
                <Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                    Automatic Billing
                  </p>
                  <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                    We automatically aggregate usage and bill customers at the end of each billing period. 
                    You just report the usage!
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(3)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={() => setStep(5)}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                Next: Review
              </Button>
            </div>
          </div>
        );

      case 5:
        // Review & Confirm
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="text-2xl font-bold text-dark dark:text-white mb-2">
                Review Your Product
              </h3>
              <p className="text-sm text-body-color dark:text-dark-6">
                Confirm everything looks good before creating
              </p>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border-2 border-dashed border-primary/30">
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-body-color dark:text-dark-6 mb-1">Product Type</p>
                  <p className="text-lg font-semibold text-dark dark:text-white">
                    {productTypeOptions.find(p => p.type === productType)?.title}
                  </p>
                </div>

                <div className="h-px bg-stroke dark:bg-dark-3" />

                <div>
                  <p className="text-xs text-body-color dark:text-dark-6 mb-1">Product Name</p>
                  <p className="text-lg font-semibold text-dark dark:text-white">{productData.name}</p>
                  {productData.description && (
                    <p className="text-sm text-body-color dark:text-dark-6 mt-1">{productData.description}</p>
                  )}
                </div>

                <div className="h-px bg-stroke dark:bg-dark-3" />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-body-color dark:text-dark-6 mb-1">Tier Name</p>
                    <p className="font-semibold text-dark dark:text-white">{tierData.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-body-color dark:text-dark-6 mb-1">Price</p>
                    <p className="font-semibold text-dark dark:text-white">
                      ${tierData.priceAmount}
                      {productType !== "one-time" && ` / ${tierData.billingPeriod}`}
                    </p>
                  </div>
                </div>

                {tierData.features.filter(f => f.trim()).length > 0 && (
                  <>
                    <div className="h-px bg-stroke dark:bg-dark-3" />
                    <div>
                      <p className="text-xs text-body-color dark:text-dark-6 mb-2">Features</p>
                      <ul className="space-y-1">
                        {tierData.features.filter(f => f.trim()).map((feature, idx) => (
                          <li key={idx} className="flex items-center gap-2 text-sm text-dark dark:text-white">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            {feature}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                )}

                <div className="h-px bg-stroke dark:bg-dark-3" />

                <div>
                  <p className="text-xs text-body-color dark:text-dark-6 mb-3">Product Status</p>
                  <div className="space-y-3">
                    <label className="flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${productData.isActive ? 'border-green-500 bg-green-50 dark:bg-green-900/20' : 'border-stroke dark:border-dark-3'}">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${productData.isActive ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-900/30'}`}>
                          <Rocket className={`h-5 w-5 ${productData.isActive ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark dark:text-white">
                            🟢 Make Live Immediately
                          </p>
                          <p className="text-xs text-body-color dark:text-dark-6">
                            Product will be available for purchase right away
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={productData.isActive}
                        onChange={() => setProductData({ ...productData, isActive: true })}
                        className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary"
                      />
                    </label>

                    <label className="flex items-center justify-between p-3 rounded-lg border-2 cursor-pointer transition-all hover:border-primary/50 ${!productData.isActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-stroke dark:border-dark-3'}">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${!productData.isActive ? 'bg-blue-100 dark:bg-blue-900/30' : 'bg-gray-100 dark:bg-gray-900/30'}`}>
                          <Package className={`h-5 w-5 ${!productData.isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-400'}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-dark dark:text-white">
                            ⚪ Save as Draft
                          </p>
                          <p className="text-xs text-body-color dark:text-dark-6">
                            Review and activate later from your dashboard
                          </p>
                        </div>
                      </div>
                      <input
                        type="radio"
                        checked={!productData.isActive}
                        onChange={() => setProductData({ ...productData, isActive: false })}
                        className="h-5 w-5 text-primary focus:ring-2 focus:ring-primary"
                      />
                    </label>
                  </div>
                </div>

                <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg">
                  <div className="flex gap-2">
                    <Sparkles className="h-4 w-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-yellow-700 dark:text-yellow-300">
                      <strong>Tip:</strong> You can always change the status later from your dashboard. 
                      Draft products are perfect for testing pricing and features before going live.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Product Preview Card */}
            {whiteLabelConfig && (
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-6 rounded-lg border-2 border-dashed border-purple-300/50">
                <div className="flex items-center gap-2 mb-4">
                  <Eye className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  <h4 className="font-semibold text-dark dark:text-white">
                    Live Preview on Your Site
                  </h4>
                </div>
                <ProductPreviewCard
                  productName={productData.name}
                  description={productData.description}
                  tierName={tierData.name}
                  price={parseFloat(tierData.priceAmount) || 0}
                  billingPeriod={tierData.billingPeriod}
                  features={tierData.features.filter(f => f.trim())}
                  primaryColor={whiteLabelConfig?.primaryColor || "#3b82f6"}
                  businessName={whiteLabelConfig?.businessName}
                  logoUrl={whiteLabelConfig?.logoUrl}
                  isActive={productData.isActive}
                />
              </div>
            )}

            <div className="flex gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep((productType === "metered" || productType === "usage-based") ? 4 : 3)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleCreateProduct}
                disabled={loading}
                className="flex-1 bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
              >
                {loading ? <Loader /> : "Create Product"}
              </Button>
            </div>
          </div>
        );

      case 6:
        // Success & Celebration
        return (
          <div className="space-y-6 text-center animate-fade-in">
            {productData.isActive ? (
              <>
                <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400 to-emerald-600 rounded-full animate-ping opacity-75" />
                  <div className="relative bg-gradient-to-r from-green-400 to-emerald-600 rounded-full p-6">
                    <Rocket className="h-12 w-12 text-white" />
                  </div>
                </div>
                
                <div>
                  <h3 className="text-4xl font-bold mb-2">
                    <span className="bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      🎉 Product is LIVE! 🎉
                    </span>
                  </h3>
                  <p className="text-xl text-body-color dark:text-dark-6 mb-4">
                    <strong className="text-primary">{productData.name}</strong> is now available for purchase!
                  </p>
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-green-100 dark:bg-green-900/30 rounded-full">
                    <div className="w-2 h-2 bg-green-600 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-green-700 dark:text-green-400">
                      Synced with Stripe & Ready to Sell
                    </span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="relative inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-r from-blue-400 to-purple-600 mb-4">
                  <CheckCircle2 className="h-12 w-12 text-white" />
                </div>
                
                <div>
                  <h3 className="text-3xl font-bold text-dark dark:text-white mb-2">
                    Product Created Successfully!
                  </h3>
                  <p className="text-base text-body-color dark:text-dark-6 mb-4">
                    <strong className="text-primary">{productData.name}</strong> saved as draft
                  </p>
                </div>
              </>
            )}

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-6 rounded-lg border-2 border-dashed border-primary/30">
              <h4 className="font-semibold text-dark dark:text-white mb-3">
                {productData.isActive ? "🚀 What's Happening Now:" : "📋 Next Steps:"}
              </h4>
              <div className="space-y-2 text-sm text-left">
                <div className="flex items-start gap-2 p-2 rounded bg-white/50 dark:bg-dark/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-body-color dark:text-dark-6">
                    <strong>Stripe Integration:</strong> Product and pricing synced automatically
                  </p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded bg-white/50 dark:bg-dark/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-body-color dark:text-dark-6">
                    <strong>White-label Site:</strong> {productData.isActive ? "Available now" : "Will appear when activated"}
                  </p>
                </div>
                <div className="flex items-start gap-2 p-2 rounded bg-white/50 dark:bg-dark/50">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                  <p className="text-body-color dark:text-dark-6">
                    <strong>Payment Processing:</strong> {productData.isActive ? "Ready to accept payments" : "Configure when ready"}
                  </p>
                </div>
                {(productType === "metered" || productType === "usage-based") && (
                  <div className="flex items-start gap-2 p-2 rounded bg-white/50 dark:bg-dark/50">
                    <Code className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-body-color dark:text-dark-6">
                      <strong>Usage Tracking:</strong> Implement the API calls shown in step 4
                    </p>
                  </div>
                )}
              </div>
            </div>

            {productData.isActive && whiteLabelConfig && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 p-6 rounded-lg">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-3xl">💰</span>
                    <p className="text-lg font-semibold text-dark dark:text-white">
                      Your Product is Live!
                    </p>
                  </div>
                  <p className="text-sm text-body-color dark:text-dark-6 mb-4">
                    Share this link with your customers:
                  </p>
                  <div className="relative">
                    <input
                      type="text"
                      readOnly
                      value={`${window.location.origin}/${whiteLabelConfig.customDomain || whiteLabelConfig.subdomain}/products/${createdProductId}`}
                      className="w-full p-3 border rounded-lg text-sm font-mono bg-gray-100 dark:bg-dark-3"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/${whiteLabelConfig.customDomain || whiteLabelConfig.subdomain}/products/${createdProductId}`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-body-color dark:text-dark-6">
                    Your product is now available at this URL. Share it with your customers!
                  </p>
                </div>
              </div>
            )}

            {productData.isActive && (
              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 p-6 rounded-lg">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-3xl">🔗</span>
                    <p className="text-lg font-semibold text-dark dark:text-white">
                      Embed Code for Your Site
                    </p>
                  </div>
                  <p className="text-sm text-body-color dark:text-dark-6 mb-4">
                    Add this embed code to your website to let visitors subscribe directly:
                  </p>
                  <div className="relative">
                    <textarea
                      readOnly
                      value={`<iframe src="${window.location.origin}/embed/product/${createdProductId}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>`}
                      className="w-full h-20 p-3 border rounded-lg text-sm font-mono bg-gray-100 dark:bg-dark-3 resize-none"
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`<iframe src="${window.location.origin}/embed/product/${createdProductId}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>`);
                        setCopied(true);
                        setTimeout(() => setCopied(false), 2000);
                      }}
                    >
                      {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-body-color dark:text-dark-6">
                    Customize width/height as needed. The card shows pricing and subscribe button.
                  </p>
                </div>
              </div>
            )}

            {!whiteLabelConfig && productData.isActive && (
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-lg border-2 border-dashed border-orange-200 dark:border-orange-900/30">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-2 justify-center">
                    <span className="text-3xl">⚠️</span>
                    <p className="text-lg font-semibold text-dark dark:text-white">
                      Complete White-Label Setup
                    </p>
                  </div>
                  <p className="text-sm text-body-color dark:text-dark-6 mb-4">
                    Check out your product on your whitelabel product page!
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`/${whiteLabelConfig?.subdomain || ""}`, "_blank")}
                    className="mx-auto"
                  >
                    Set Up White-Label →
                  </Button>
                </div>
              </div>
            )}

            {/* Embed Code Viewer */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 p-6 rounded-lg mt-6"></div>

            <div className="flex justify-center pt-8">
              <Button
                onClick={() => onClose(true)}
                className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-3 rounded-lg font-semibold transition-all"
                disabled={loading}
              >
                <CheckCircle2 className="h-5 w-5 mr-2" />
                {productData.isActive ? "Done & View Product" : "Done & Edit Later"}
              </Button>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center p-8">
            <p className="text-body-color dark:text-dark-6">Invalid step. Please restart the wizard.</p>
          </div>
        );
    }
  };

  if (loading && step < 6) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
        <div className="bg-white dark:bg-dark-2 p-6 rounded-lg shadow-xl">
          <Loader />
          <p className="mt-4 text-center text-dark dark:text-white">Creating your product...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => onClose(false)}
          aria-hidden="true"
        />

        {/* Modal panel */}
        <div className="inline-block transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-4xl sm:p-6 sm:align-middle dark:bg-dark-2 max-h-[90vh] overflow-y-auto">
          <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
            {renderStep()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedProductWizard;