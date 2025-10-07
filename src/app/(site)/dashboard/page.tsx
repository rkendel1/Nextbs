import Dashboard from "@/components/Dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | SaaS for SaaS Platform",
  description: "Manage your SaaS products and subscribers",
};

const DashboardPage = () => {
  return <Dashboard />;
};

export default DashboardPage;
