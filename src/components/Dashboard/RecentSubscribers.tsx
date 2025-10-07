"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/Common/Loader";

const RecentSubscribers = () => {
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch("/api/saas/subscribers?limit=5");
      const data = await response.json();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error("Failed to load subscribers:", error);
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
    <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
      <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
        Recent Subscribers
      </h2>

      {subscribers.length === 0 ? (
        <div className="py-8 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-dark-3">
            <svg
              className="h-6 w-6 text-body-color dark:text-dark-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <p className="text-sm text-body-color dark:text-dark-6">
            No subscribers yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {subscribers.map((subscription) => (
            <div
              key={subscription.id}
              className="flex items-start gap-3 rounded-lg border border-stroke p-3 transition hover:border-primary dark:border-dark-3 dark:hover:border-primary"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                <span className="text-sm font-semibold text-primary">
                  {subscription.user?.name?.[0]?.toUpperCase() || "U"}
                </span>
              </div>
              <div className="flex-1 overflow-hidden">
                <h4 className="truncate text-sm font-medium text-dark dark:text-white">
                  {subscription.user?.name || "Anonymous"}
                </h4>
                <p className="truncate text-xs text-body-color dark:text-dark-6">
                  {subscription.user?.email}
                </p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-xs text-body-color dark:text-dark-6">
                    {subscription.product?.name}
                  </span>
                  <span
                    className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                      subscription.status === "active"
                        ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                        : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                    }`}
                  >
                    {subscription.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default RecentSubscribers;
