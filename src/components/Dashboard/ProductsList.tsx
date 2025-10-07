"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import ProductModal from "./ProductModal";
import Loader from "@/components/Common/Loader";

interface ProductsListProps {
  onUpdate?: () => void;
}

const ProductsList = ({ onUpdate }: ProductsListProps) => {
  const router = useRouter();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);

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
    setSelectedProduct(null);
    setShowModal(true);
  };

  const handleEditProduct = (product: any) => {
    setSelectedProduct(product);
    setShowModal(true);
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to delete this product?")) {
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

  const handleModalClose = (updated: boolean) => {
    setShowModal(false);
    setSelectedProduct(null);
    if (updated) {
      fetchProducts();
      onUpdate?.();
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
    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-2xl font-bold text-dark dark:text-white">
          Your Products
        </h2>
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
          Add Product
        </button>
      </div>

      {/* Products List */}
      {products.length === 0 ? (
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
            Create Product
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {products.map((product) => (
            <div
              key={product.id}
              className="rounded-lg border border-stroke p-4 transition hover:border-primary dark:border-dark-3 dark:hover:border-primary"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="mb-2 flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-dark dark:text-white">
                      {product.name}
                    </h3>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        product.isActive
                          ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                          : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                      }`}
                    >
                      {product.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  {product.description && (
                    <p className="mb-3 text-sm text-body-color dark:text-dark-6">
                      {product.description}
                    </p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-body-color dark:text-dark-6">
                    <span>{product._count?.tiers || 0} pricing tiers</span>
                    <span>•</span>
                    <span>
                      {product._count?.subscriptions || 0} subscribers
                    </span>
                  </div>
                </div>
                <div className="ml-4 flex gap-2">
                  <button
                    onClick={() => router.push(`/dashboard/products/${product.id}`)}
                    className="rounded-md border border-stroke px-3 py-1.5 text-sm text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white dark:hover:border-primary dark:hover:text-primary"
                  >
                    Manage
                  </button>
                  <button
                    onClick={() => handleEditProduct(product)}
                    className="rounded-md border border-stroke px-3 py-1.5 text-sm text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white dark:hover:border-primary dark:hover:text-primary"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    className="rounded-md border border-red-200 px-3 py-1.5 text-sm text-red-600 transition hover:border-red-600 hover:bg-red-50 dark:border-red-900/20 dark:text-red-400 dark:hover:border-red-600 dark:hover:bg-red-900/10"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Product Modal */}
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
