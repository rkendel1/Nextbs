"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Search, Filter } from "lucide-react";
import Loader from "@/components/Common/Loader";

const SubscribersPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [subscribers, setSubscribers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchSubscribers();
  }, []);

  const fetchSubscribers = async () => {
    try {
      const response = await fetch("/api/saas/subscribers");
      const data = await response.json();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredSubscribers = subscribers.filter((sub) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      sub.user?.name?.toLowerCase().includes(search) ||
      sub.user?.email?.toLowerCase().includes(search) ||
      sub.product?.name?.toLowerCase().includes(search)
    );
  });

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Subscribers</h1>
            <p className="text-sm text-muted-foreground">
              Manage and view all your subscribers
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>All Subscribers ({subscribers.length})</CardTitle>
                <CardDescription>View and manage subscriber subscriptions</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search subscribers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 pr-4 py-2 rounded-md border border-stroke bg-transparent text-sm outline-none transition focus:border-primary dark:border-dark-3"
                  />
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredSubscribers.length === 0 ? (
              <div className="text-center py-12">
                <Users className="mx-auto h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                  {subscribers.length === 0 ? "No subscribers yet" : "No matching subscribers"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {subscribers.length === 0
                    ? "Subscribers will appear here when they sign up for your products"
                    : "Try adjusting your search terms"}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredSubscribers.map((subscription) => (
                  <div
                    key={subscription.id}
                    className="rounded-lg border border-stroke p-4 transition hover:border-primary dark:border-dark-3 cursor-pointer"
                    onClick={() => router.push(`/dashboard/subscriptions/${subscription.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <h3 className="text-base font-semibold text-dark dark:text-white">
                            {subscription.user?.name || "Anonymous User"}
                          </h3>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
                              subscription.status === "active"
                                ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400"
                                : subscription.status === "canceled"
                                ? "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                                : "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400"
                            }`}
                          >
                            {subscription.status}
                          </span>
                        </div>
                        <p className="text-sm text-body-color dark:text-dark-6 mb-2">
                          {subscription.user?.email}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-body-color dark:text-dark-6">
                          <span>{subscription.product?.name || "Unknown Product"}</span>
                          <span>•</span>
                          <span>{subscription.tier?.name || "Unknown Tier"}</span>
                          <span>•</span>
                          <span>
                            Since {new Date(subscription.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default SubscribersPage;
