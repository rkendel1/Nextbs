"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import WhiteLabelLayout from "@/components/WhiteLabel/WhiteLabelLayout";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Subscription {
  id: string;
  product: {
    id: string;
    name: string;
  };
  tier: {
    id: string;
    name: string;
    priceAmount: number;
    billingPeriod: string;
  };
  status: string;
  currentPeriodStart?: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
}

interface CreatorData {
  id: string;
  businessName: string;
  whiteLabel: {
    brandName?: string;
    primaryColor?: string;
    logoUrl?: string;
  };
}

const WhiteLabelAccount = () => {
  const params = useParams();
  const domain = params.domain as string;
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchCreatorData();
  }, [domain]);

  const checkAuth = () => {
    // Simple auth check - in a real app, you'd validate the session/token
    const hasSession = localStorage.getItem('whitelabel_session');
    setIsAuthenticated(!!hasSession);
  };

  const fetchCreatorData = async () => {
    try {
      const response = await fetch(`/api/saas/whitelabel/creator-by-domain?domain=${encodeURIComponent(domain)}`);
      
      if (!response.ok) {
        throw new Error('Creator not found');
      }
      
      const data = await response.json();
      setCreator(data);
      
      // Fetch user subscriptions if authenticated
      if (isAuthenticated) {
        await fetchSubscriptions(data.creator.id);
      }
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSubscriptions = async (creatorId: string) => {
    try {
      // This would be a real API call in production
      // For now, we'll simulate some data
      const mockSubscriptions: Subscription[] = [
        {
          id: 'sub_123',
          product: {
            id: 'prod_123',
            name: 'Premium Analytics'
          },
          tier: {
            id: 'tier_123',
            name: 'Professional',
            priceAmount: 9900,
            billingPeriod: 'monthly'
          },
          status: 'active',
          currentPeriodStart: new Date().toISOString(),
          currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          cancelAtPeriodEnd: false
        }
      ];
      setSubscriptions(mockSubscriptions);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    }
  };

  const handleLogin = () => {
    // Simulate login - in a real app, you'd redirect to auth flow
    localStorage.setItem('whitelabel_session', 'mock_session_token');
    setIsAuthenticated(true);
    window.location.reload();
  };

  const handleLogout = () => {
    localStorage.removeItem('whitelabel_session');
    setIsAuthenticated(false);
    setSubscriptions([]);
  };

  const handleManageSubscription = (subscriptionId: string) => {
    // Redirect to subscription management
    window.location.href = `/whitelabel/${domain}/account/subscriptions/${subscriptionId}`;
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      active: 'bg-green-100 text-green-800',
      canceled: 'bg-red-100 text-red-800',
      past_due: 'bg-yellow-100 text-yellow-800',
      incomplete: 'bg-gray-100 text-gray-800'
    };
    
    return (
      <Badge className={variants[status as keyof typeof variants] || variants.incomplete}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  if (loading) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </WhiteLabelLayout>
    );
  }

  if (!creator) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Creator Not Found</h1>
            <p className="text-gray-600">This domain is not associated with any creator.</p>
          </div>
        </div>
      </WhiteLabelLayout>
    );
  }

  const primaryColor = creator.whiteLabel?.primaryColor || '#667eea';

  return (
    <WhiteLabelLayout domain={domain}>
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              My Account
            </h1>
            <p className="text-xl text-gray-600">
              Manage your subscriptions and account settings
            </p>
          </div>

          {/* Authentication Section */}
          {!isAuthenticated ? (
            <div className="max-w-md mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle>Sign In</CardTitle>
                  <CardDescription>
                    Sign in to manage your account and subscriptions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handleLogin}
                    className="w-full"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Sign In
                  </Button>
                  <p className="text-sm text-gray-600 mt-4 text-center">
                    Don&apos;t have an account?{' '}
                    <Link href={`/whitelabel/${domain}/signup`} className="text-blue-600 hover:text-blue-800">
                      Sign up here
                    </Link>
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Account Overview */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Overview</CardTitle>
                  <CardDescription>
                    Your account information and quick actions
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-gray-600">Account Status</p>
                      <p className="text-lg font-medium">Active</p>
                    </div>
                    <Button
                      onClick={handleLogout}
                      variant="outline"
                    >
                      Sign Out
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Active Subscriptions */}
              {subscriptions.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Active Subscriptions</CardTitle>
                    <CardDescription>
                      Manage your current subscriptions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {subscriptions.map((subscription) => (
                        <div key={subscription.id} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-semibold text-gray-900">
                                {subscription.product.name}
                              </h4>
                              <p className="text-sm text-gray-600">
                                {subscription.tier.name} Plan
                              </p>
                            </div>
                            <div className="text-right">
                              {getStatusBadge(subscription.status)}
                              <p className="text-sm text-gray-600 mt-1">
                                ${(subscription.tier.priceAmount / 100).toFixed(0)}/{subscription.tier.billingPeriod}
                              </p>
                            </div>
                          </div>
                          
                          {subscription.currentPeriodEnd && (
                            <p className="text-sm text-gray-600 mb-3">
                              Renews on {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                            </p>
                          )}
                          
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleManageSubscription(subscription.id)}
                              size="sm"
                              variant="outline"
                            >
                              Manage
                            </Button>
                            {!subscription.cancelAtPeriodEnd && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700"
                              >
                                Cancel
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Billing</CardTitle>
                    <CardDescription>
                      Manage your payment methods and billing history
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/whitelabel/${domain}/account/billing`}>
                      <Button variant="outline" className="w-full">
                        Manage Billing
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Profile</CardTitle>
                    <CardDescription>
                      Update your profile information and preferences
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Link href={`/whitelabel/${domain}/account/profile`}>
                      <Button variant="outline" className="w-full">
                        Edit Profile
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}
        </div>
      </div>
    </WhiteLabelLayout>
  );
};

export default WhiteLabelAccount;