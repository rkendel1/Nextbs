"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { OnboardingStep } from "@/types/saas";
import { SaasCreator } from "@/types/saas";

interface BusinessInfoStepProps {
  currentStep: OnboardingStep;
  onNext: (data: any) => void;
  stripeAccountId?: string;
}

export default function BusinessInfoStep({ currentStep, onNext, stripeAccountId }: BusinessInfoStepProps) {
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    website: "",
    industryCategory: "",
    email: "",
    phone: "",
    addressCountry: "",
    addressCity: "",
    addressPostalCode: "",
    bankLast4: "",
    bankType: "",
    currency: "",
    payoutSchedule: "",
    verificationStatus: "pending",
    businessTaxId: "",
    ownerName: "",
    subscriptionId: "",
    currentPlan: "",
    trialStatus: "",
    billingEmail: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapedData, setScrapedData] = useState<any>(null);

  const { data: session } = useSession();

  // Fetch Stripe account data on mount
  useEffect(() => {
    if (stripeAccountId) {
      const fetchStripeData = async () => {
        try {
          const res = await fetch(`/api/stripe/account/${stripeAccountId}`);
          if (res.ok) {
            const account = await res.json();
            setFormData({
              businessName: account.business_name || account.name || "",
              businessType: account.business_type || "",
              website: account.metadata?.website || "",
              industryCategory: account.metadata?.industry_category || "",
              email: account.email || "",
              phone: account.metadata?.phone || "",
              addressCountry: account.address?.country || "",
              addressCity: account.address?.city || "",
              addressPostalCode: account.address?.postal_code || "",
              bankLast4: account.capabilities?.card_payments?.requirements?.currently_due?.bank_last4 || "",
              bankType: account.capabilities?.card_payments?.requirements?.currently_due?.bank_type || "",
              currency: account.default_currency || "",
              payoutSchedule: account.settings?.payouts?.schedule?.interval || "",
              verificationStatus: account.charges_enabled ? "verified" : "pending",
              businessTaxId: account.metadata?.business_tax_id || "",
              ownerName: account.metadata?.owner_name || "",
              subscriptionId: account.metadata?.subscription_id || "",
              currentPlan: account.metadata?.current_plan || "",
              trialStatus: account.metadata?.trial_status || "",
              billingEmail: account.metadata?.billing_email || "",
            });
          } else {
            setError("Failed to fetch Stripe account data");
          }
        } catch (err) {
          setError("Error fetching Stripe data");
        }
      };
      fetchStripeData();
    }
  }, [stripeAccountId]);

  // Fetch scraped data from saasCreator
  useEffect(() => {
    if (session?.user?.id) {
      const fetchScrapedData = async () => {
        try {
          const res = await fetch(`/api/saas/my-account`);
          if (res.ok) {
            const { saasCreator } = await res.json();
            if (saasCreator) {
              setScrapedData({
                lightweightScrape: saasCreator.lightweightScrape,
                deepDesignTokens: saasCreator.deepDesignTokens,
                mergedScrapeData: saasCreator.mergedScrapeData,
              });
            }
          }
        } catch (err) {
          console.error("Error fetching scraped data");
        }
      };
      fetchScrapedData();
    }
  }, [session]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/saas/profile-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          stripeAccountId,
          scrapedData,
        }),
      });

      if (res.ok) {
        onNext(formData);
      } else {
        setError('Failed to save profile');
      }
    } catch (err) {
      setError('Error saving profile');
    } finally {
      setLoading(false);
    }
  };

  if (currentStep !== OnboardingStep.BUSINESS_INFO) {
    return null;
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Business Information</CardTitle>
        <CardDescription>Complete your profile with Stripe data. Edit as needed.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input id="businessName" value={formData.businessName} onChange={(e) => setFormData({ ...formData, businessName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessType">Business Type</Label>
              <select value={formData.businessType} onChange={(e) => setFormData({ ...formData, businessType: e.target.value })} className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary">
                <option value="">Select type</option>
                <option value="individual">Individual</option>
                <option value="company">Company</option>
                <option value="nonprofit">Nonprofit</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input id="website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industryCategory">Industry Category</Label>
              <Input id="industryCategory" value={formData.industryCategory} onChange={(e) => setFormData({ ...formData, industryCategory: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCountry">Country</Label>
              <Input id="addressCountry" value={formData.addressCountry} onChange={(e) => setFormData({ ...formData, addressCountry: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressCity">City</Label>
              <Input id="addressCity" value={formData.addressCity} onChange={(e) => setFormData({ ...formData, addressCity: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="addressPostalCode">Postal Code</Label>
              <Input id="addressPostalCode" value={formData.addressPostalCode} onChange={(e) => setFormData({ ...formData, addressPostalCode: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankLast4">Bank Last 4 Digits</Label>
              <Input id="bankLast4" value={formData.bankLast4} onChange={(e) => setFormData({ ...formData, bankLast4: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankType">Bank Type</Label>
              <Input id="bankType" value={formData.bankType} onChange={(e) => setFormData({ ...formData, bankType: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currency">Currency</Label>
              <Input id="currency" value={formData.currency} onChange={(e) => setFormData({ ...formData, currency: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payoutSchedule">Payout Schedule</Label>
              <select value={formData.payoutSchedule} onChange={(e) => setFormData({ ...formData, payoutSchedule: e.target.value })} className="w-full rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark outline-none transition placeholder:text-dark-6 focus:border-primary focus-visible:shadow-none dark:border-dark-3 dark:text-white dark:focus:border-primary">
                <option value="">Select schedule</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="verificationStatus">Verification Status</Label>
              <Input id="verificationStatus" value={formData.verificationStatus} onChange={(e) => setFormData({ ...formData, verificationStatus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="businessTaxId">Business Tax ID / EIN</Label>
              <Input id="businessTaxId" value={formData.businessTaxId} onChange={(e) => setFormData({ ...formData, businessTaxId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerName">Owner Name</Label>
              <Input id="ownerName" value={formData.ownerName} onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subscriptionId">Subscription ID</Label>
              <Input id="subscriptionId" value={formData.subscriptionId} onChange={(e) => setFormData({ ...formData, subscriptionId: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentPlan">Current Plan</Label>
              <Input id="currentPlan" value={formData.currentPlan} onChange={(e) => setFormData({ ...formData, currentPlan: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="trialStatus">Trial Status</Label>
              <Input id="trialStatus" value={formData.trialStatus} onChange={(e) => setFormData({ ...formData, trialStatus: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billingEmail">Billing Email</Label>
              <Input id="billingEmail" value={formData.billingEmail} onChange={(e) => setFormData({ ...formData, billingEmail: e.target.value })} />
            </div>
          </div>
          {scrapedData && (
            <div className="space-y-2">
              <Label>Scraped Website Data</Label>
              <div className="p-4 bg-gray-100 rounded">
                <pre className="text-sm overflow-auto max-h-48">
                  {JSON.stringify(scrapedData, null, 2)}
                </pre>
              </div>
            </div>
          )}
          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Saving..." : "Save and Complete Profile"}
          </Button>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </form>
      </CardContent>
    </Card>
  );
}