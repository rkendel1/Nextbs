import PlatformDashboard from "@/components/PlatformDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Platform Dashboard | SaaSinaSnap",
  description: "Monitor platform-wide metrics and manage SaaS creators",
};

const PlatformDashboardPage = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Platform Overview
        </h1>
        <p className="mt-2 text-body-color dark:text-dark-6">
          Monitor platform-wide performance, manage SaaS creators, and oversee operations.
        </p>
      </div>
      <PlatformDashboard />
    </div>
  );
};

export default PlatformDashboardPage;
