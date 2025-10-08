import ApiKeyManagement from "@/components/ApiKeyManagement";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "API Keys | SaaSinaSnap Dashboard",
  description: "Manage your API keys for accessing SaaSinaSnap services",
};

const ApiKeysPage = () => {
  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-dark dark:text-white">
          API Key Management
        </h1>
        <p className="mt-2 text-body-color dark:text-dark-6">
          Create and manage API keys for accessing your SaaS products and services.
        </p>
      </div>
      <ApiKeyManagement />
    </div>
  );
};

export default ApiKeysPage;
