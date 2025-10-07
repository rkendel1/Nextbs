import ProductManagement from "@/components/ProductManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Product | SaaS for SaaS Platform",
  description: "Configure pricing tiers and manage product details",
};

const ProductManagementPage = () => {
  return <ProductManagement />;
};

export default ProductManagementPage;
