"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";

interface MeteringConfigProps {
  productId: string;
  config?: any;
  onUpdate: () => void;
}

const MeteringConfig = ({ productId, config, onUpdate }: MeteringConfigProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    meteringType: config?.meteringType || "requests",
    meteringUnit: config?.meteringUnit || "count",
    aggregationType: config?.aggregationType || "sum",
    usageReportingUrl: config?.usageReportingUrl || "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = config
        ? `/api/saas/metering/${config.id}`
        : "/api/saas/metering";
      const method = config ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          productId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save metering configuration");
      }

      toast.success("Metering configuration saved successfully");
      onUpdate();
    } catch (error: any) {
      toast.error(error.message || "Failed to save metering configuration");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-dark dark:text-white">
          Usage Metering Configuration
        </h2>
        <p className="mt-1 text-sm text-body-color dark:text-dark-6">
          Configure how usage is tracked and measured for this product
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
              Metering Type *
            </label>
            <select
              value={formData.meteringType}
              onChange={(e) =>
                setFormData({ ...formData, meteringType: e.target.value })
              }
              required
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
            >
              <option value="requests">API Requests</option>
              <option value="users">Users</option>
              <option value="storage">Storage</option>
              <option value="compute">Compute Time</option>
              <option value="bandwidth">Bandwidth</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
              Unit *
            </label>
            <select
              value={formData.meteringUnit}
              onChange={(e) =>
                setFormData({ ...formData, meteringUnit: e.target.value })
              }
              required
              className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
            >
              <option value="count">Count</option>
              <option value="GB">Gigabytes (GB)</option>
              <option value="MB">Megabytes (MB)</option>
              <option value="hours">Hours</option>
              <option value="minutes">Minutes</option>
              <option value="seconds">Seconds</option>
            </select>
          </div>
        </div>

        <div className="mt-6">
          <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
            Aggregation Type *
          </label>
          <select
            value={formData.aggregationType}
            onChange={(e) =>
              setFormData({ ...formData, aggregationType: e.target.value })
            }
            required
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          >
            <option value="sum">Sum (total usage)</option>
            <option value="max">Maximum (peak usage)</option>
            <option value="last_during_period">Last during period</option>
          </select>
          <p className="mt-2 text-sm text-body-color dark:text-dark-6">
            How usage should be calculated for billing periods
          </p>
        </div>

        <div className="mt-6">
          <label className="mb-2.5 block text-base font-medium text-dark dark:text-white">
            Usage Reporting Webhook URL (optional)
          </label>
          <input
            type="url"
            placeholder="https://api.yourservice.com/usage"
            value={formData.usageReportingUrl}
            onChange={(e) =>
              setFormData({ ...formData, usageReportingUrl: e.target.value })
            }
            className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary"
          />
          <p className="mt-2 text-sm text-body-color dark:text-dark-6">
            Where usage reports will be sent (leave empty to disable)
          </p>
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
            API Integration
          </h3>
          <p className="mb-3 text-sm text-blue-800 dark:text-blue-400">
            Use the following endpoint to report usage:
          </p>
          <code className="block rounded bg-blue-100 px-3 py-2 text-xs text-blue-900 dark:bg-blue-900/40 dark:text-blue-200">
            POST /api/saas/usage
            <br />
            {`{ "productId": "${productId}", "quantity": 1 }`}
          </code>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center rounded-md border border-primary bg-primary px-8 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-dark disabled:opacity-50"
          >
            {loading ? <Loader /> : config ? "Update Configuration" : "Save Configuration"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default MeteringConfig;
