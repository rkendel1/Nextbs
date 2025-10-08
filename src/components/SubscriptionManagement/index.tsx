"use client";
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import Loader from "@/components/Common/Loader";
import Link from "next/link";

interface Subscription {
  id: string;
  productName: string;
  tierName: string;
  status: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  priceAmount: number;
  billingPeriod: string;
  cancelAtPeriodEnd: boolean;
}

const SubscriptionManagement = () => {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSubscription, setSelectedSubscription] = useState<Subscription | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/saas/my-subscriptions");
      const data = await response.json();
      
      if (response.ok) {
        setSubscriptions(data.subscriptions || []);
      } else {
        toast.error(data.message || "Failed to load subscriptions");
      }
    } catch (error) {
      console.error("Failed to load subscriptions:", error);
      toast.error("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async (id: string) => {
    if (!confirm("Are you sure you want to cancel this subscription? It will remain active until the end of the current billing period.")) {
      return;
    }

    try {
      const response = await fetch(`/api/saas/my-subscriptions/${id}/cancel`, {
        method: "POST",
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Subscription will be cancelled at the end of the billing period");
        fetchSubscriptions();
      } else {
        toast.error(data.message || "Failed to cancel subscription");
      }
    } catch (error) {
      console.error("Failed to cancel subscription:", error);
      toast.error("Failed to cancel subscription");
    }
  };

  const handleReactivateSubscription = async (id: string) => {
    try {
      const response = await fetch(`/api/saas/my-subscriptions/${id}/reactivate`, {
        method: "POST",
      });

      const data = await response.json();
      if (response.ok) {
        toast.success("Subscription reactivated successfully");
        fetchSubscriptions();
      } else {
        toast.error(data.message || "Failed to reactivate subscription");
      }
    } catch (error) {
      console.error("Failed to reactivate subscription:", error);
      toast.error("Failed to reactivate subscription");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "canceled":
      case "cancelled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "past_due":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
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
      {/* Active Subscriptions */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Active Subscriptions
        </h2>

        {subscriptions.length === 0 ? (
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <p className="text-body-color dark:text-dark-6">
              No active subscriptions found.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {subscriptions.map((subscription) => (
              <div
                key={subscription.id}
                className="rounded-lg border border-stroke p-4 dark:border-dark-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-lg font-semibold text-dark dark:text-white">
                        {subscription.productName}
                      </h3>
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(
                          subscription.status
                        )}`}
                      >
                        {subscription.status}
                      </span>
                      {subscription.cancelAtPeriodEnd && (
                        <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                          Cancelling
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-body-color dark:text-dark-6">
                      {subscription.tierName}
                    </p>
                    <div className="mt-3 flex items-center gap-4 text-sm">
                      <div>
                        <span className="text-body-color dark:text-dark-6">
                          Price:
                        </span>{" "}
                        <span className="font-medium text-dark dark:text-white">
                          ${(subscription.priceAmount / 100).toFixed(2)}/{subscription.billingPeriod}
                        </span>
                      </div>
                      <div>
                        <span className="text-body-color dark:text-dark-6">
                          Next billing:
                        </span>{" "}
                        <span className="font-medium text-dark dark:text-white">
                          {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {subscription.status === "active" && !subscription.cancelAtPeriodEnd ? (
                      <>
                        <button
                          onClick={() => {
                            setSelectedSubscription(subscription);
                            setShowUpgradeModal(true);
                          }}
                          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                        >
                          Upgrade
                        </button>
                        <button
                          onClick={() => handleCancelSubscription(subscription.id)}
                          className="rounded-md border border-red-600 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-400 dark:text-red-400 dark:hover:bg-red-900/10"
                        >
                          Cancel
                        </button>
                      </>
                    ) : subscription.cancelAtPeriodEnd ? (
                      <button
                        onClick={() => handleReactivateSubscription(subscription.id)}
                        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
                      >
                        Reactivate
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Billing History */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <h2 className="mb-6 text-xl font-bold text-dark dark:text-white">
          Billing History
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-stroke dark:border-dark-3">
                <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                  Date
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                  Description
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                  Amount
                </th>
                <th className="pb-3 text-left text-sm font-semibold text-dark dark:text-white">
                  Status
                </th>
                <th className="pb-3 text-right text-sm font-semibold text-dark dark:text-white">
                  Invoice
                </th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-stroke dark:border-dark-3">
                <td colSpan={5} className="py-8 text-center text-body-color dark:text-dark-6">
                  No billing history available yet.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Upgrade Modal */}
      {showUpgradeModal && selectedSubscription && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="mx-4 w-full max-w-md rounded-xl bg-white p-6 dark:bg-dark-2">
            <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
              Upgrade Subscription
            </h3>
            <p className="mb-4 text-sm text-body-color dark:text-dark-6">
              Upgrade your {selectedSubscription.productName} subscription to access more features.
            </p>
            <div className="rounded-lg border border-stroke p-4 dark:border-dark-3">
              <p className="text-sm text-body-color dark:text-dark-6">
                Current plan: <strong>{selectedSubscription.tierName}</strong>
              </p>
              <p className="mt-2 text-xs text-body-color dark:text-dark-6">
                Contact support or visit the pricing page to explore upgrade options.
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUpgradeModal(false);
                  setSelectedSubscription(null);
                }}
                className="rounded-md border border-stroke px-4 py-2 text-sm font-medium text-dark transition hover:bg-gray-100 dark:border-dark-3 dark:text-white dark:hover:bg-dark-3"
              >
                Close
              </button>
              <Link
                href="/pricing"
                className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white transition hover:bg-primary/90"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SubscriptionManagement;
