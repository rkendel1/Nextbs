"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import Loader from "@/components/Common/Loader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  User, 
  Mail, 
  Calendar,
  DollarSign,
  Package,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle
} from "lucide-react";

interface SubscriberModalProps {
  subscriber?: any;
  onClose: (updated: boolean) => void;
}

const SubscriberModal = ({ subscriber, onClose }: SubscriberModalProps) => {
  const [loading, setLoading] = useState(false);
  const [subscriberDetails, setSubscriberDetails] = useState<any>(null);

  useEffect(() => {
    if (subscriber) {
      fetchSubscriberDetails();
    }
  }, [subscriber]);

  const fetchSubscriberDetails = async () => {
    try {
      const response = await fetch(`/api/saas/subscribers/${subscriber.id}`);
      const data = await response.json();
      setSubscriberDetails(data.subscription);
    } catch (error) {
      console.error("Failed to fetch subscriber details:", error);
      setSubscriberDetails(subscriber); // Fallback to basic data
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/saas/subscribers/${subscriber.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update subscriber status");
      }

      toast.success("Subscriber status updated successfully");
      fetchSubscriberDetails(); // Refresh details
      onClose(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to update subscriber status");
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!confirm("Are you sure you want to cancel this subscription?")) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`/api/saas/subscribers/${subscriber.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to cancel subscription");
      }

      toast.success("Subscription canceled successfully");
      onClose(true);
    } catch (error: any) {
      toast.error(error.message || "Failed to cancel subscription");
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400";
      case "canceled":
        return "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400";
      case "past_due":
        return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400";
      default:
        return "bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "canceled":
        return <XCircle className="h-4 w-4" />;
      case "past_due":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const details = subscriberDetails || subscriber;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-2xl rounded-xl bg-white p-8 shadow-xl dark:bg-dark-2 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-dark dark:text-white">
            Subscriber Details
          </h2>
          <button
            onClick={() => onClose(false)}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <XCircle className="h-6 w-6" />
          </button>
        </div>

        {loading && !details ? (
          <div className="flex items-center justify-center p-8">
            <Loader />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Subscriber Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Subscriber Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-dark dark:text-white">
                      {details.user.name || details.user.email}
                    </p>
                    <p className="text-xs text-muted-foreground dark:text-dark-6">
                      {details.user.email}
                    </p>
                  </div>
                  <Badge className={getStatusBadgeVariant(details.status)}>
                    {getStatusIcon(details.status)}
                    <span className="ml-1">{details.status}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Package className="h-5 w-5" />
                  Subscription Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-dark-6 mb-1">Product</p>
                    <p className="text-sm font-medium">{details.product.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-dark-6 mb-1">Tier</p>
                    <p className="text-sm font-medium">{details.tier.name}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-dark-6 mb-1">Start Date</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(details.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground dark:text-dark-6 mb-1">Next Billing</p>
                    <p className="text-sm font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {details.currentPeriodEnd ? new Date(details.currentPeriodEnd).toLocaleDateString() : "N/A"}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Usage Records */}
            {details.usageRecords && details.usageRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Recent Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {details.usageRecords.map((record: any, index: number) => (
                      <div key={index} className="flex items-center justify-between py-2 border-b border-stroke dark:border-dark-3 last:border-b-0">
                        <div>
                          <p className="text-sm font-medium">{record.metric}</p>
                          <p className="text-xs text-muted-foreground dark:text-dark-6">
                            {new Date(record.timestamp).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">{record.value}</p>
                          <p className="text-xs text-muted-foreground dark:text-dark-6">{record.unit}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 pt-4">
              <Button
                variant="outline"
                onClick={() => onClose(false)}
                disabled={loading}
                className="flex-1"
              >
                Close
              </Button>
              {details.status === "active" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => handleUpdateStatus("past_due")}
                    disabled={loading}
                    className="flex-1"
                  >
                    Mark as Past Due
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleCancelSubscription}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel Subscription
                  </Button>
                </>
              )}
              {details.status === "past_due" && (
                <Button
                  variant="default"
                  onClick={() => handleUpdateStatus("active")}
                  disabled={loading}
                  className="flex-1"
                >
                  Mark as Active
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SubscriberModal;