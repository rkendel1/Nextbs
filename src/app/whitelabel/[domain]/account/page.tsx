"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import WhiteLabelLayout from "@/components/WhiteLabel/WhiteLabelLayout";
import toast from "react-hot-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  CreditCard, 
  Download, 
  Calendar, 
  TrendingUp, 
  AlertCircle,
  CheckCircle,
  XCircle
} from "lucide-react";

interface Subscription {
  id: string;
  productName: string;
  tierName: string;
  tierDescription?: string;
  priceAmount: number;
  billingPeriod: string;
  features: string[];
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  usageLimit?: number;
}

interface Usage {
  total: number;
  limit?: number;
  records: any[];
}

interface Invoice {
  id: string;
  number: string;
  amount: number;
  currency: string;
  status: string;
  created: Date;
  hostedInvoiceUrl?: string;
  invoicePdf?: string;
}

interface CreatorData {
  id: string;
  businessName: string;
  whiteLabel: {
    brandName?: string;
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
}

const WhiteLabelAccount = () => {
  const params = useParams();
  const domain = params.domain as string;
  const { data: session, status } = useSession();
  const [creator, setCreator] = useState<CreatorData | null>(null);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [unifiedData, setUnifiedData] = useState<any>(null);
  const [deepTokens, setDeepTokens] = useState<any>(null);

  const fetchCreatorData = async () => {
    try {
      const response = await fetch(`/api/saas/whitelabel/creator-by-domain?domain=${encodeURIComponent(domain)}`);
      
      if (!response.ok) {
        throw new Error('Creator not found');
      }
      
      const data = await response.json();
      setCreator(data.creator);
    } catch (error) {
      console.error('Failed to fetch creator data:', error);
      toast.error("Failed to load creator information");
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountData = async () => {
    try {
      setLoading(true);

      // Fetch unified data for tokens
      const creatorRes = await fetch(`/api/saas/whitelabel/creator-by-domain?domain=${encodeURIComponent(domain)}`);
      if (creatorRes.ok) {
        const creatorData = await creatorRes.json();
        setUnifiedData(creatorData.unifiedData);
        setDeepTokens(creatorData.unifiedData?.deepDesignTokens);
      }

      // Fetch subscription and usage for this creator's products
      const accountRes = await fetch(`/api/saas/my-subscriptions`);
      if (accountRes.ok) {
        const accountData = await accountRes.json();
        
        // Find subscription to this creator's products
        const creatorSubscription = accountData.subscriptions?.find((sub: any) => 
          sub.saasCreatorId === creator?.id
        );
        
        if (creatorSubscription) {
          setSubscription(creatorSubscription);
          
          // Fetch usage for this subscription
          // This would be a separate API call in production
          setUsage({
            total: 0,
            limit: creatorSubscription.usageLimit,
            records: []
          });
        }
      }

      // Fetch invoices
      const invoicesRes = await fetch("/api/saas/invoices");
      if (invoicesRes.ok) {
        const invoicesData = await invoicesRes.json();
        setInvoices(invoicesData.invoices || []);
      }
    } catch (error: any) {
      console.error("Error fetching account data:", error);
      toast.error("Failed to load account data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreatorData();
  }, [domain]);

  useEffect(() => {
    if (status === "authenticated" && creator) {
      fetchAccountData();
    }
  }, [status, creator]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; icon: any }> = {
      active: { variant: "default", icon: CheckCircle },
      canceled: { variant: "destructive", icon: XCircle },
      past_due: { variant: "destructive", icon: AlertCircle },
      trialing: { variant: "secondary", icon: Calendar },
    };

    const config = statusConfig[status] || { variant: "secondary", icon: AlertCircle };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </Badge>
    );
  };

  const formatCurrency = (amount: number, currency: string = 'usd') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const primaryColor = deepTokens?.color?.brand.primary || creator?.whiteLabel?.primaryColor || '#667eea';
  const textColor = deepTokens?.color?.text.primary || '#111';
  const bgColor = deepTokens?.color?.background.default || '#fff';
  const brandName = creator?.whiteLabel?.brandName || creator?.businessName || 'Service';

  if (loading) {
    return (
      <WhiteLabelLayout domain={domain} unifiedData={unifiedData}>
        <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: bgColor, color: textColor }}>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: primaryColor }}></div>
        </div>
      </WhiteLabelLayout>
    );
  }

  if (!creator) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="min-h-screen flex items-center justify-center">
          <Card style={{ backgroundColor: bgColor, color: textColor }}>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" style={{ color: textColor }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: textColor }}>Creator Not Found</h3>
                <p className="text-muted-foreground" style={{ color: textColor }}>
                  This domain is not associated with any creator.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </WhiteLabelLayout>
    );
  }

  if (status === "unauthenticated") {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="container mx-auto px-4 py-16">
            <Card className="max-w-md mx-auto" style={{ backgroundColor: bgColor, color: textColor }}>
              <CardHeader>
                <CardTitle style={{ color: textColor }}>Sign In Required</CardTitle>
                <CardDescription style={{ color: textColor }}>
                  Please sign in to view your account and manage your subscription
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => window.location.href = '/?auth=signin'}
                  className="w-full"
                  style={{ backgroundColor: primaryColor }}
                >
                  Sign In
                </Button>
              </CardContent>
            </Card>
        </div>
      </WhiteLabelLayout>
    );
  }

  if (!subscription) {
    return (
      <WhiteLabelLayout domain={domain}>
        <div className="container mx-auto px-4 py-8">
          <Card style={{ backgroundColor: bgColor, color: textColor }}>
            <CardContent className="pt-6">
              <div className="text-center">
                <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" style={{ color: textColor }} />
                <h3 className="text-lg font-semibold mb-2" style={{ color: textColor }}>No Subscription Found</h3>
                <p className="text-muted-foreground mb-4" style={{ color: textColor }}>
                  You don&apos;t have an active subscription to {brandName}.
                </p>
                <Button
                  onClick={() => window.location.href = `/whitelabel/${domain}/products`}
                  style={{ backgroundColor: primaryColor }}
                >
                  View Plans
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </WhiteLabelLayout>
    );
  }

  const usagePercentage = usage?.limit 
    ? Math.min((usage.total / usage.limit) * 100, 100) 
    : 0;

  return (
    <WhiteLabelLayout domain={domain}>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8" style={{ color: textColor }}>
          <h1 className="text-3xl font-bold mb-2" style={{ color: textColor }}>My Account</h1>
          <p className="text-muted-foreground" style={{ color: textColor }}>
            Manage your subscription to {brandName}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-6">
          {/* Subscription Card */}
          <Card style={{ backgroundColor: bgColor, color: textColor }}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle style={{ color: textColor }}>Current Plan</CardTitle>
                {getStatusBadge(subscription.status)}
              </div>
              <CardDescription style={{ color: textColor }}>{subscription.productName}</CardDescription>
            </CardHeader>
            <CardContent style={{ color: textColor }}>
              <div className="space-y-4">
                <div>
                  <h3 className="text-2xl font-bold" style={{ color: textColor }}>{subscription.tierName}</h3>
                  {subscription.tierDescription && (
                    <p className="text-sm text-muted-foreground mt-1" style={{ color: textColor }}>
                      {subscription.tierDescription}
                    </p>
                  )}
                </div>

                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold" style={{ color: textColor }}>
                    {formatCurrency(subscription.priceAmount)}
                  </span>
                  <span className="text-muted-foreground" style={{ color: textColor }}>
                    / {subscription.billingPeriod}
                  </span>
                </div>

                <Separator />

                <div className="space-y-2">
                  <h4 className="font-semibold text-sm" style={{ color: textColor }}>Features</h4>
                  <ul className="space-y-1">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm" style={{ color: textColor }}>
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {subscription.currentPeriodEnd && (
                  <div className="pt-4">
                    <div className="flex items-center text-sm text-muted-foreground" style={{ color: textColor }}>
                      <Calendar className="h-4 w-4 mr-2" />
                      {subscription.cancelAtPeriodEnd ? (
                        <span>Cancels on {formatDate(subscription.currentPeriodEnd)}</span>
                      ) : (
                        <span>Renews on {formatDate(subscription.currentPeriodEnd)}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usage Card */}
          <Card style={{ backgroundColor: bgColor, color: textColor }}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2" style={{ color: textColor }}>
                <TrendingUp className="h-5 w-5" style={{ color: textColor }} />
                Usage
              </CardTitle>
              <CardDescription style={{ color: textColor }}>Your usage this billing period</CardDescription>
            </CardHeader>
            <CardContent style={{ color: textColor }}>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium" style={{ color: textColor }}>Total Usage</span>
                    <span className="text-2xl font-bold" style={{ color: textColor }}>{usage?.total || 0}</span>
                  </div>
                  {usage?.limit && (
                    <>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div
                          className="h-2 rounded-full transition-all"
                          style={{ 
                            width: `${usagePercentage}%`,
                            backgroundColor: primaryColor 
                          }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1" style={{ color: textColor }}>
                        {usage.total} of {usage.limit} used ({usagePercentage.toFixed(1)}%)
                      </p>
                    </>
                  )}
                </div>

                {usage?.records && usage.records.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-sm mb-2" style={{ color: textColor }}>Recent Activity</h4>
                      <div className="space-y-2">
                        {usage.records.slice(0, 5).map((record: any, index: number) => (
                          <div key={index} className="flex justify-between text-sm" style={{ color: textColor }}>
                            <span className="text-muted-foreground" style={{ color: textColor }}>
                              {new Date(record.timestamp).toLocaleDateString()}
                            </span>
                            <span className="font-medium" style={{ color: textColor }}>{record.quantity} units</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Invoices Card */}
        <Card style={{ backgroundColor: bgColor, color: textColor }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2" style={{ color: textColor }}>
              <CreditCard className="h-5 w-5" style={{ color: textColor }} />
              Billing History
            </CardTitle>
            <CardDescription style={{ color: textColor }}>View and download your invoices</CardDescription>
          </CardHeader>
          <CardContent style={{ color: textColor }}>
            {invoices.length === 0 ? (
              <p className="text-center text-muted-foreground py-8" style={{ color: textColor }}>
                No invoices found
              </p>
            ) : (
              <div className="space-y-3">
                {invoices.map((invoice) => (
                  <div
                    key={invoice.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                    style={{ color: textColor }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <h4 className="font-semibold" style={{ color: textColor }}>
                          {invoice.number || `Invoice ${invoice.id.slice(-8)}`}
                        </h4>
                        <Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} style={{ color: textColor }}>
                          {invoice.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1" style={{ color: textColor }}>
                        {formatDate(invoice.created)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-semibold" style={{ color: textColor }}>
                        {formatCurrency(invoice.amount, invoice.currency)}
                      </span>
                      {invoice.invoicePdf && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(invoice.invoicePdf, '_blank')}
                          style={{ color: textColor }}
                        >
                          <Download className="h-4 w-4 mr-2" style={{ color: textColor }} />
                          PDF
                        </Button>
                      )}
                      {invoice.hostedInvoiceUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(invoice.hostedInvoiceUrl, '_blank')}
                          style={{ color: textColor }}
                        >
                          View
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </WhiteLabelLayout>
  );
};

export default WhiteLabelAccount;