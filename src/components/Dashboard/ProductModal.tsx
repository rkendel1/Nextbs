"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface ProductModalProps {
  product?: any;
  onClose: (updated: boolean) => void;
}

const ProductModal = ({ product, onClose }: ProductModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: product?.name || "",
    description: product?.description || "",
    isActive: product?.isActive ?? true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = product
        ? `/api/saas/products/${product.id}`
        : "/api/saas/products";
      const method = product ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error(`Failed to ${product ? "update" : "create"} product`);
      }

      toast.success(
        `Product ${product ? "updated" : "created"} successfully`
      );
      onClose(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to save product");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-8 shadow-xl dark:bg-dark-2">
        <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
          {product ? "Edit Product" : "Create New Product"}
        </h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
              Product Name *
            </label>
            <input
              type="text"
              placeholder="e.g., API Access"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="mb-6">
            <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
              Description
            </label>
            <textarea
              placeholder="Describe what customers get with this product..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
            />
          </div>

          <div className="mb-8">
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

          <div className="flex gap-4">
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
              {loading ? <Loader /> : product ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductModal;
