import Dashboard from "@/components/Dashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Dashboard | SaaSinaSnap - Manage Your SaaS Platform",
  description: "Manage your SaaS products, subscribers, and analytics",
};

const DashboardPage = () => {
  return <Dashboard />;
};

export default DashboardPage;
