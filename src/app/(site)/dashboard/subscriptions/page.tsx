import SubscriptionManagement from "@/components/SubscriptionManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Subscription Management | SaaSinaSnap Dashboard",
  description: "Manage your subscriptions, billing, and upgrade options",
};

const SubscriptionsPage = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          Subscription Management
        </h1>
        <p className="mt-2 text-body-color dark:text-dark-6">
          Manage your active subscriptions, billing history, and upgrade options.
        </p>
      </div>
      <SubscriptionManagement />
    </div>
  );
};

export default SubscriptionsPage;
