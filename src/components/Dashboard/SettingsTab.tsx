"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import toast from "react-hot-toast";

const SettingsTab = () => {
  const [businessName, setBusinessName] = useState("My SaaS Business");
  const [email, setEmail] = useState("admin@example.com");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [subscriptionPlan, setSubscriptionPlan] = useState("Pro");

  const handleSave = () => {
    // TODO: Save settings to API
    toast.success("Settings saved successfully!");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Settings</h1>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>Manage your business profile and notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input
                id="businessName"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Enter business name"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter email"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="notifications"
                checked={notificationsEnabled}
                onCheckedChange={setNotificationsEnabled}
              />
              <Label htmlFor="notifications">Enable Email Notifications</Label>
            </div>
            <Button onClick={handleSave} className="w-full">
              Save Account Settings
            </Button>
          </CardContent>
        </Card>

        {/* Billing Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Billing & Subscription</CardTitle>
            <CardDescription>Manage your subscription plan and payment details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Current Plan</Label>
              <Badge variant="secondary" className="text-lg">{subscriptionPlan}</Badge>
            </div>
            <div className="space-y-2">
              <Label>Next Billing Date</Label>
              <p className="text-sm text-muted-foreground">2024-11-01</p>
            </div>
            <div className="space-y-2">
              <Label>Payment Method</Label>
              <p className="text-sm text-muted-foreground">**** **** **** 1234 (Visa)</p>
            </div>
            <Button variant="outline" className="w-full">
              Update Payment Method
            </Button>
            <Button variant="outline" className="w-full">
              Change Plan
            </Button>
          </CardContent>
        </Card>

        {/* Integrations */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Integrations</CardTitle>
            <CardDescription>Connect your SaaS with third-party services.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>API Keys</Label>
              <p className="text-sm text-muted-foreground">Manage API access for your platform.</p>
              <Button variant="outline" size="sm" className="mt-2">
                View API Keys
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Webhook Endpoints</Label>
              <p className="text-sm text-muted-foreground">Configure webhooks for events like subscriptions.</p>
              <Button variant="outline" size="sm" className="mt-2">
                Manage Webhooks
              </Button>
            </div>
            <div className="space-y-2">
              <Label>Stripe Connect</Label>
              <p className="text-sm text-muted-foreground">Status: Connected</p>
              <Button variant="outline" size="sm" className="mt-2">
                Reconnect Stripe
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SettingsTab;