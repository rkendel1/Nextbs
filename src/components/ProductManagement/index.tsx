"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";
import TiersList from "./TiersList";
import MeteringConfig from "./MeteringConfig";

const ProductManagement = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"tiers" | "metering">("tiers");

  useEffect(() => {
    if (productId) {
      fetchProduct();
    }
  }, [productId]);

  const fetchProduct = async () => {
    try {
      const response = await fetch(`/api/saas/products/${productId}`);
      if (!response.ok) {
        throw new Error("Failed to load product");
      }
      const data = await response.json();
      setProduct(data.product);
    } catch (error: any) {
      toast.error(error.message || "Failed to load product");
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (!product) {
    return null;
  }

  return (
    <section className="bg-[#F4F7FF] py-14 dark:bg-dark lg:py-20">
      <div className="container">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => router.push("/dashboard")}
            className="mb-4 inline-flex items-center text-sm text-body-color transition hover:text-primary dark:text-dark-6 dark:hover:text-primary"
          >
            <svg
              className="mr-2 h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Dashboard
          </button>
          
          <div className="flex items-start justify-between">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-dark dark:text-white lg:text-4xl">
                {product.name}
              </h1>
              {product.description && (
                <p className="text-base text-body-color dark:text-dark-6">
                  {product.description}
                </p>
              )}
            </div>
            <span
              className={`inline-flex rounded-full px-4 py-1.5 text-sm font-medium ${
                product.isActive
                  ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
              }`}
            >
              {product.isActive ? "Active" : "Inactive"}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-8 border-b border-stroke dark:border-dark-3">
          <div className="flex gap-8">
            <button
              onClick={() => setActiveTab("tiers")}
              className={`pb-4 text-base font-medium transition ${
                activeTab === "tiers"
                  ? "border-b-2 border-primary text-primary"
                  : "text-body-color hover:text-primary dark:text-dark-6 dark:hover:text-primary"
              }`}
            >
              Pricing Tiers
            </button>
            <button
              onClick={() => setActiveTab("metering")}
              className={`pb-4 text-base font-medium transition ${
                activeTab === "metering"
                  ? "border-b-2 border-primary text-primary"
                  : "text-body-color hover:text-primary dark:text-dark-6 dark:hover:text-primary"
              }`}
            >
              Usage Metering
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "tiers" && (
          <TiersList productId={productId} tiers={product.tiers || []} onUpdate={fetchProduct} />
        )}
        {activeTab === "metering" && (
          <MeteringConfig productId={productId} config={product.meteringConfig} onUpdate={fetchProduct} />
        )}
      </div>
    </section>
  );
};

export default ProductManagement;
