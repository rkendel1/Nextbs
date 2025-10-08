"use client";
import { useState, useEffect } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import Loader from "@/components/Common/Loader";

interface PlatformStats {
  totalCreators: number;
  totalSubscribers: number;
  platformRevenue: number;
  activeProducts: number;
}

interface Creator {
  id: string;
  businessName: string;
  subscriberCount: number;
  revenue: number;
  productsCount: number;
  createdAt: string;
}

const PlatformDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<PlatformStats>({
    totalCreators: 0,
    totalSubscribers: 0,
    platformRevenue: 0,
    activeProducts: 0,
  });
  const [creators, setCreators] = useState<Creator[]>([]);
  const [growthData, setGrowthData] = useState<any[]>([]);

  useEffect(() => {
    fetchPlatformData();
  }, []);

  const fetchPlatformData = async () => {
    try {
      const response = await fetch("/api/saas/platform-stats");
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.stats || stats);
        setCreators(data.creators || []);
        setGrowthData(data.growth || []);
      }
    } catch (error) {
      console.error("Failed to load platform data:", error);
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
      {/* Platform KPIs */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-6 shadow-lg">
          <div className="mb-2 text-sm font-medium text-white/80">
            Total SaaS Creators
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.totalCreators}
          </div>
          <div className="mt-2 text-xs text-white/70">
            +12 this month
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-green-500 to-green-600 p-6 shadow-lg">
          <div className="mb-2 text-sm font-medium text-white/80">
            Total Subscribers
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.totalSubscribers}
          </div>
          <div className="mt-2 text-xs text-white/70">
            +156 this month
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 p-6 shadow-lg">
          <div className="mb-2 text-sm font-medium text-white/80">
            Platform Revenue
          </div>
          <div className="text-3xl font-bold text-white">
            ${(stats.platformRevenue / 100).toLocaleString()}
          </div>
          <div className="mt-2 text-xs text-white/70">
            +18.3% from last month
          </div>
        </div>

        <div className="rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 p-6 shadow-lg">
          <div className="mb-2 text-sm font-medium text-white/80">
            Active Products
          </div>
          <div className="text-3xl font-bold text-white">
            {stats.activeProducts}
          </div>
          <div className="mt-2 text-xs text-white/70">
            +8 this month
          </div>
        </div>
      </div>

      {/* Growth Chart */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Platform Growth
        </h2>
        {growthData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={growthData}>
              <defs>
                <linearGradient id="creatorsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#667eea" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#667eea" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="subscribersGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" tick={{ fill: "#6b7280" }} />
              <YAxis stroke="#6b7280" tick={{ fill: "#6b7280" }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
              />
              <Area
                type="monotone"
                dataKey="creators"
                stroke="#667eea"
                fillOpacity={1}
                fill="url(#creatorsGradient)"
                name="Creators"
              />
              <Area
                type="monotone"
                dataKey="subscribers"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#subscribersGradient)"
                name="Subscribers"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-12 text-center text-body-color dark:text-dark-6">
            No growth data available yet.
          </div>
        )}
      </div>

      {/* Top SaaS Creators */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Top SaaS Creators
        </h2>
        {creators.length === 0 ? (
          <div className="py-8 text-center text-body-color dark:text-dark-6">
            No SaaS creators yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-stroke dark:border-dark-3">
                  <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                    Business Name
                  </th>
                  <th className="pb-3 text-center text-sm font-semibold text-dark dark:text-white">
                    Products
                  </th>
                  <th className="pb-3 text-center text-sm font-semibold text-dark dark:text-white">
                    Subscribers
                  </th>
                  <th className="pb-3 text-right text-sm font-semibold text-dark dark:text-white">
                    Revenue
                  </th>
                  <th className="pb-3 text-right text-sm font-semibold text-dark dark:text-white">
                    Joined
                  </th>
                </tr>
              </thead>
              <tbody>
                {creators.map((creator) => (
                  <tr
                    key={creator.id}
                    className="border-b border-stroke dark:border-dark-3"
                  >
                    <td className="py-4 text-sm font-medium text-dark dark:text-white">
                      {creator.businessName}
                    </td>
                    <td className="py-4 text-center text-sm text-body-color dark:text-dark-6">
                      {creator.productsCount}
                    </td>
                    <td className="py-4 text-center text-sm text-body-color dark:text-dark-6">
                      {creator.subscriberCount}
                    </td>
                    <td className="py-4 text-right text-sm font-medium text-dark dark:text-white">
                      ${(creator.revenue / 100).toLocaleString()}
                    </td>
                    <td className="py-4 text-right text-sm text-body-color dark:text-dark-6">
                      {new Date(creator.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Revenue by Creator */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Revenue Distribution
        </h2>
        {creators.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={creators.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis
                dataKey="businessName"
                stroke="#6b7280"
                tick={{ fill: "#6b7280", fontSize: 12 }}
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                stroke="#6b7280"
                tick={{ fill: "#6b7280" }}
                tickFormatter={(value) => `$${(value / 100).toFixed(0)}`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#ffffff",
                  border: "1px solid #e5e7eb",
                  borderRadius: "6px",
                }}
                formatter={(value: number) => [`$${(value / 100).toFixed(2)}`, "Revenue"]}
              />
              <Bar dataKey="revenue" fill="#667eea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="py-12 text-center text-body-color dark:text-dark-6">
            No revenue data available yet.
          </div>
        )}
      </div>
    </div>
  );
};

export default PlatformDashboard;
