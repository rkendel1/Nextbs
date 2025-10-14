'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Shield, Database, Settings, DollarSign, Users, TrendingUp } from "lucide-react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

export default function AccountPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAccountData() {
      if (!session) {
        router.push('/?auth=signin');
        return;
      }

      try {
        const accountRes = await fetch("/api/saas/my-account");
        if (accountRes.ok) {
          const accountData = await accountRes.json();
          setSubscription(accountData.subscription);
          setUsage(accountData.usage);
        } else {
          const error = await accountRes.json();
          toast.error(error.error || "Failed to load subscription");
        }
      } catch (error: any) {
        console.error("Error fetching account data:", error);
        toast.error("Failed to load account data");
      } finally {
        setLoading(false);
      }
    }

    fetchAccountData();
  }, [session, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">Loading account data...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
            <User className="h-8 w-8 text-primary" />
          </div>
          <p className="text-lg font-medium text-muted-foreground">Please sign in to view your account</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Account</h1>
          <p className="text-muted-foreground">Manage your account and subscription</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </CardTitle>
            <CardDescription>
              Update your account information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Email
              </label>
              <input
                type="email"
                value={session?.user?.email || ''}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                disabled
              />
            </div>
            <Button variant="outline" className="w-full">
              Update Profile
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Subscription
            </CardTitle>
            <CardDescription>
              Your current subscription plan
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscription ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Plan</span>
                  <Badge variant="secondary">{subscription?.tier?.name || 'Free'}</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status</span>
                  <Badge variant={subscription?.status === 'active' ? 'default' : 'destructive'}>
                    {subscription?.status || 'No subscription'}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Next Billing</span>
                  <span className="text-sm text-muted-foreground">
                    {subscription?.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <Button variant="outline" className="w-full">
                  Manage Subscription
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No subscription found</p>
                <Button className="mt-4">Upgrade Plan</Button>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Usage
            </CardTitle>
            <CardDescription>
              Your current usage statistics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {usage ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Total Usage</span>
                  <span className="text-sm">{usage?.total || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">This Month</span>
                  <span className="text-sm">{usage?.monthly || 0}</span>
                </div>
                <Button variant="outline" className="w-full">
                  View Detailed Usage
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">No usage data available</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Security
            </CardTitle>
            <CardDescription>
              Manage your account security
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Password
              </label>
              <Button variant="outline" className="w-full">
                Change Password
              </Button>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">
                Two-Factor Authentication
              </label>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Not Enabled</span>
                <Button variant="outline" size="sm">
                  Enable 2FA
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}