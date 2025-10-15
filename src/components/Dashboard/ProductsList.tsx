"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Eye, EyeOff, Settings, CheckCircle2, DollarSign, Clock, TrendingUp, Zap, Copy, CopyCheck } from "lucide-react";
import GuidedProductWizard from "./GuidedProductWizard";
import ProductModal from "./ProductModal";
import Loader from "@/components/Common/Loader";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";

interface ProductsListProps {
  onUpdate?: () => void;
}

const ProductsList = ({ onUpdate }: ProductsListProps) => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWizard, setShowWizard] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [embedProductId, setEmbedProductId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/saas/products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      toast.error("Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = () => {
    setShowWizard(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleToggleProductStatus = async (productId: string, currentStatus: boolean) => {
    try {
      const response = await fetch(`/api/saas/products/${productId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !currentStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product status");
      }

      toast.success(`Product ${!currentStatus ? 'activated' : 'deactivated'} successfully`);
      fetchProducts();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to update product status");
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product? This will also delete all associated tiers.")) {
      return;
    }

    try {
      const response = await fetch(`/api/saas/products/${productId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete product");
      }

      toast.success("Product deleted successfully");
      fetchProducts();
      onUpdate?.();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete product");
    }
  };

  const handleEmbedProduct = (productId: string) => {
    setEmbedProductId(productId);
    setShowEmbed(true);
  };

  const handleCopyEmbedCode = () => {
    if (embedProductId) {
      navigator.clipboard.writeText(`<iframe src="/embed/product/${embedProductId}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success("Embed code copied!");
    }
  };

  const handleWizardClose = (updated: boolean) => {
    setShowWizard(false);
    if (updated) {
      fetchProducts();
      onUpdate?.();
    }
  };

  const handleModalClose = (updated: boolean) => {
    setShowModal(false);
    setSelectedProduct(null);
    if (updated) {
      fetchProducts();
      onUpdate?.();
    }
  };

  const getBillingIcon = (billingPeriod: string) => {
    switch (billingPeriod) {
      case 'one-time':
        return <DollarSign className="h-4 w-4" />;
      case 'yearly':
      case 'quarterly':
      case 'monthly':
        return <Clock className="h-4 w-4" />;
      default:
        return <TrendingUp className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Your Products
          </h2>
          <p className="mt-1 text-sm text-body-color dark:text-dark-6">
            Manage your product catalog and pricing
          </p>
        </div>
        <button
          onClick={handleCreateProduct}
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
          Create Product
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="rounded-xl bg-white p-12 shadow-lg dark:bg-dark-2 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <svg
              className="h-8 w-8 text-primary"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
            No products yet
          </h3>
          <p className="mb-4 text-sm text-body-color dark:text-dark-6">
            Create your first product to start accepting subscriptions
          </p>
          <button
            onClick={handleCreateProduct}
            className="inline-flex items-center rounded-md bg-primary px-6 py-2.5 text-sm font-medium text-white transition hover:bg-blue-dark"
          >
            Create Your First Product
          </button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {products.map((product) => (
            <div
              key={product.id}
              className={`group relative rounded-xl border-2 bg-white shadow-lg transition-all hover:shadow-xl dark:bg-dark-2 ${
                product.isActive
                  ? "border-stroke hover:border-primary dark:border-dark-3 dark:hover:border-primary"
                  : "border-dashed border-gray-300 bg-gray-50/50 dark:border-gray-700 dark:bg-gray-900/20"
              }`}
            >
              {/* Product Header */}
              <div className="border-b border-stroke p-6 dark:border-dark-3">
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className={`text-xl font-bold ${product.isActive ? "text-dark dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                        {product.name}
                      </h3>
                      {!product.isActive && (
                        <EyeOff className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <button
                      onClick={() => handleToggleProductStatus(product.id, product.isActive)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                        product.isActive
                          ? "bg-green-100 text-green-800 hover:bg-green-200 dark:bg-green-900/20 dark:text-green-400 dark:hover:bg-green-900/30"
                          : "bg-gray-100 text-gray-800 hover:bg-gray-200 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/30"
                      }`}
                      title={product.isActive ? "Click to hide from customers" : "Click to make visible to customers"}
                    >
                      {product.isActive ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                      {product.isActive ? "Live" : "Hidden"}
                    </button>
                  </div>
                </div>
                
                {product.description && (
                  <p className="text-sm text-body-color dark:text-dark-6 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>

              {/* Pricing Tiers Preview */}
              <div className="p-6">
                {product._count?.tiers > 0 ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-semibold text-dark dark:text-white">
                        Pricing Tiers
                      </h4>
                      <span className="text-xs text-body-color dark:text-dark-6">
                        {product._count.tiers} tier{product._count.tiers !== 1 ? 's' : ''}
                      </span>
                    </div>
                    
                    {/* Show first 3 tiers as preview */}
                    <div className="space-y-2">
                      {product.tiers?.slice(0, 3)
                        .map((tier: any) => (
                          <div
                            key={tier.id}
                            className={`rounded-lg border p-3 ${
                              tier.isActive
                                ? "border-stroke bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:border-dark-3 dark:from-blue-900/10 dark:to-purple-900/10"
                                : "border-dashed border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900/10"
                            }`}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span className={`text-sm font-semibold ${tier.isActive ? "text-dark dark:text-white" : "text-gray-500 dark:text-gray-400"}`}>
                                  {tier.name}
                                </span>
                                {!tier.isActive && (
                                  <span className="text-xs text-gray-400">(Hidden)</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-primary">
                                {getBillingIcon(tier.billingPeriod)}
                              </div>
                            </div>
                            
                            <div className="flex items-baseline gap-1">
                              <span className="text-2xl font-bold text-primary">
                                ${(tier.priceAmount / 100).toFixed(2)}
                              </span>
                              <span className="text-xs text-body-color dark:text-dark-6">
                                / {tier.billingPeriod}
                              </span>
                            </div>
                            
                            {tier.features && tier.features.length > 0 && (
                              <div className="mt-2 pt-2 border-t border-stroke dark:border-dark-3">
                                <div className="flex items-start gap-1 text-xs text-body-color dark:text-dark-6">
                                  <CheckCircle2 className="h-3 w-3 text-green-600 flex-shrink-0 mt-0.5" />
                                  <span className="line-clamp-1">{tier.features[0]}</span>
                                </div>
                                {tier.features.length > 1 && (
                                  <p className="text-xs text-body-color dark:text-dark-6 mt-1">
                                    +{tier.features.length - 1} more feature{tier.features.length > 2 ? 's' : ''}
                                  </p>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      
                      {product._count?.tiers > 3 && (
                        <div className="text-center py-2 text-xs text-body-color dark:text-dark-6">
                          +{product._count.tiers - 3} more tier{product._count.tiers > 4 ? 's' : ''}
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-3">
                      <DollarSign className="h-6 w-6 text-body-color dark:text-dark-6" />
                    </div>
                    <p className="text-sm text-body-color dark:text-dark-6">
                      No pricing tiers yet
                    </p>
                    <button
                      onClick={() => router.push(`/dashboard/products/${product.id}`)}
                      className="mt-3 text-xs text-primary hover:underline"
                    >
                      Add pricing tiers →
                    </button>
                  </div>
                )}
              </div>

              {/* Stats Bar */}
              <div className="border-t border-stroke px-6 py-3 dark:border-dark-3">
                <div className="flex items-center justify-between text-xs text-body-color dark:text-dark-6">
                  <div className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      {product._count?.tiers || 0} tier{product._count?.tiers !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1">
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {product._count?.subscriptions || 0} subscriber{product._count?.subscriptions !== 1 ? 's' : ''}
                    </span>
                  </div>
                  {product.stripeProductId && (
                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                      <CheckCircle2 className="h-3 w-3" />
                      Synced
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="border-t border-stroke p-4 dark:border-dark-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/products/${product.id}`)}
                    className="flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-dark"
                  >
                    <Settings className="h-4 w-4" />
                    Manage
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white dark:hover:border-primary dark:hover:text-primary"
                  >
                    Edit Details
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-2">
                  <button
                    onClick={() => handleToggleProductStatus(product.id, product.isActive)}
                    className={`rounded-md border px-4 py-2 text-sm font-medium transition ${
                      product.isActive
                        ? "border-orange-200 text-orange-600 hover:border-orange-600 hover:bg-orange-50 dark:border-orange-900/20 dark:text-orange-400 dark:hover:bg-orange-900/10"
                        : "border-green-200 text-green-600 hover:border-green-600 hover:bg-green-50 dark:border-green-900/20 dark:text-green-400 dark:hover:bg-green-900/10"
                    }`}
                  >
                    {product.isActive ? "Deactivate" : "Activate"}
                  </button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEmbedProduct(product.id)}
                    className="border-blue-200 text-blue-600 hover:border-blue-600 hover:bg-blue-50 dark:border-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/10"
                  >
                    Embed
                  </Button>
                </div>
              </div>

              {/* Embed Sheet */}
              <Sheet open={showEmbed} onOpenChange={setShowEmbed}>
                <SheetTrigger asChild>
                  <div />
                </SheetTrigger>
                <SheetContent className="max-w-md">
                  <SheetHeader>
                    <SheetTitle>Embed {embedProductId ? products.find(p => p.id === embedProductId)?.name : ''} Product</SheetTitle>
                  </SheetHeader>
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                      Copy this code to embed the product card on your site:
                    </p>
                    <div className="relative">
                      <textarea
                        readOnly
                        value={embedProductId ? `<iframe src="/embed/product/${embedProductId}" width="400" height="600" style="border:none;" loading="lazy" allowfullscreen></iframe>` : ''}
                        className="w-full h-20 p-2 border rounded resize-none font-mono text-sm"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2 h-6 w-6"
                        onClick={handleCopyEmbedCode}
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

              {/* Hover Effect Overlay */}
              <div className="absolute inset-0 rounded-xl bg-primary/5 opacity-0 transition-opacity group-hover:opacity-100 pointer-events-none" />
            </div>
          ))}
        </div>
      )}

      {/* Guided Product Wizard */}
      {showWizard && (
        <GuidedProductWizard
          onClose={handleWizardClose}
        />
      )}

      {/* Product Edit Modal */}
      {showModal && (
        <ProductModal
          product={selectedProduct}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default ProductsList;