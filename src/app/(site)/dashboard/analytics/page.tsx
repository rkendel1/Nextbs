import Analytics from "@/components/Analytics";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analytics | SaaSinaSnap Dashboard",
  description: "View comprehensive analytics and insights for your SaaS platform",
};

const AnalyticsPage = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Analytics & Insights
        </h1>
        <p className="mt-2 text-body-color dark:text-dark-6">
          Track your platform's performance with detailed metrics and visualizations.
        </p>
      </div>
      <Analytics />
    </div>
  );
};

export default AnalyticsPage;
