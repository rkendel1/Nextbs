"use client";
import { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import Loader from "@/components/Common/Loader";

interface RevenueData {
  date: string;
  revenue: number;
  subscriptions: number;
}

interface UsageData {
  date: string;
  usage: number;
}

interface SubscriberGrowthData {
  date: string;
  total: number;
  new: number;
  churned: number;
}

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [revenueData, setRevenueData] = useState<RevenueData[]>([]);
  const [usageData, setUsageData] = useState<UsageData[]>([]);
  const [subscriberData, setSubscriberData] = useState<SubscriberGrowthData[]>([]);
  const [activeTab, setActiveTab] = useState<"revenue" | "usage" | "subscribers">("revenue");

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const fetchAnalyticsData = async () => {
    try {
      const response = await fetch("/api/saas/analytics");
      const data = await response.json();
      
      if (response.ok) {
        setRevenueData(data.revenue || []);
        setUsageData(data.usage || []);
        setSubscriberData(data.subscribers || []);
      }
    } catch (error) {
      console.error("Failed to load analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="flex items-center justify-center p-12">
          <Loader />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-dark dark:text-white">
            Analytics & Insights
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("revenue")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === "revenue"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-dark hover:bg-gray-200 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
              }`}
            >
              Revenue
            </button>
            <button
              onClick={() => setActiveTab("usage")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === "usage"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-dark hover:bg-gray-200 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
              }`}
            >
              Usage
            </button>
            <button
              onClick={() => setActiveTab("subscribers")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition ${
                activeTab === "subscribers"
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-dark hover:bg-gray-200 dark:bg-dark-3 dark:text-white dark:hover:bg-dark-4"
              }`}
            >
              Subscribers
            </button>
          </div>
        </div>

        {/* Charts */}
        {activeTab === "revenue" && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
              Revenue Overview
            </h3>
            {revenueData.length === 0 ? (
              <div className="py-12 text-center text-body-color dark:text-dark-6">
                No revenue data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={revenueData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                    tickFormatter={(value) => `$${value}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                    formatter={(value: number) => [`$${value}`, "Revenue"]}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#667eea"
                    fillOpacity={1}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {activeTab === "usage" && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
              Usage Metrics
            </h3>
            {usageData.length === 0 ? (
              <div className="py-12 text-center text-body-color dark:text-dark-6">
                No usage data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={usageData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="usage"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {activeTab === "subscribers" && (
          <div>
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
              Subscriber Growth
            </h3>
            {subscriberData.length === 0 ? (
              <div className="py-12 text-center text-body-color dark:text-dark-6">
                No subscriber data available yet.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={subscriberData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <YAxis
                    stroke="#6b7280"
                    tick={{ fill: "#6b7280" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#ffffff",
                      border: "1px solid #e5e7eb",
                      borderRadius: "6px",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="new" fill="#10b981" name="New Subscribers" />
                  <Bar dataKey="churned" fill="#ef4444" name="Churned" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-body-color dark:text-dark-6">
              MRR
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              +12.5%
            </span>
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">
            $12,450
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-body-color dark:text-dark-6">
              Active Subs
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              +8.2%
            </span>
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">
            124
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-body-color dark:text-dark-6">
              Churn Rate
            </span>
            <span className="text-xs text-red-600 dark:text-red-400">
              2.3%
            </span>
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">
            2.3%
          </div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-medium text-body-color dark:text-dark-6">
              Avg Revenue
            </span>
            <span className="text-xs text-green-600 dark:text-green-400">
              +5.1%
            </span>
          </div>
          <div className="text-2xl font-bold text-dark dark:text-white">
            $100.4
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
