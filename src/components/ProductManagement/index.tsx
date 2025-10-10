"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";
import TiersList from "./TiersList";
import MeteringConfig from "./MeteringConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Copy, CopyCheck } from "lucide-react";

const ProductManagement = () => {
  const params = useParams();
  const router = useRouter();
  const productId = params.id as string;
  
  const [loading, setLoading] = useState(true);
  const [product, setProduct] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"tiers" | "metering">("tiers");
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);

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
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Product Image URL (optional)
                  </label>
                  <Input
                    placeholder="https://example.com/product-image.jpg"
                    value={product.imageUrl || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProduct({ ...product, imageUrl: e.target.value })}
                    className="mb-2"
                  />
                  {product.imageUrl && (
                    <div className="flex justify-center">
                      <img
                        src={product.imageUrl}
                        alt="Product preview"
                        className="w-32 h-32 object-cover rounded-lg border"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant={product.isActive ? "default" : "outline"}
                  size="sm"
                  onClick={async () => {
                    const checked = !product.isActive;
                    try {
                      const response = await fetch(`/api/saas/products/${productId}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ 
                          isActive: checked,
                          imageUrl: product.imageUrl 
                        }),
                      });
                      if (!response.ok) throw new Error("Failed to update status");
                      fetchProduct();
                      toast.success(checked ? "Product is now live" : "Product deactivated");
                    } catch (error: any) {
                      toast.error(error.message || "Failed to update status");
                    }
                  }}
                >
                  {product.isActive ? "Live" : "Make Live"}
                </Button>
                <span className={`text-sm font-medium ${
                  product.isActive
                    ? "text-green-800 dark:text-green-400"
                    : "text-gray-800 dark:text-gray-400"
                }`}>
                  Status: {product.isActive ? "Live" : "Draft"}
                </span>
              </div>
            </div>

            <div className="flex justify-end mb-8">
              <Sheet open={showEmbed} onOpenChange={setShowEmbed}>
                <SheetTrigger asChild>
                  <Button variant="outline" className="mr-2">
                    Embed Product
                  </Button>
                </SheetTrigger>
                <SheetContent className="max-w-md">
                  <SheetHeader>
                    <SheetTitle>Embed Product Card</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Copy this code to embed the product card on your site:
                    </p>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={`<iframe src="/embed/product/${product.id}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>`}
                        className="w-full h-20 p-2 border rounded resize-none font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={() => {
                          navigator.clipboard.writeText(`<iframe src="/embed/product/${product.id}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>`);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                      >
                        {copied ? <CopyCheck className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500">
                      Customize width/height as needed. The card shows pricing tiers and subscribe button.
                    </p>
                  </div>
                </SheetContent>
              </Sheet>
              <Button onClick={() => router.push("/dashboard/products")}>
                View All Products
              </Button>
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
