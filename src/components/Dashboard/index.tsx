"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Accordion, 
  AccordionItem, 
  AccordionTrigger, 
  AccordionContent 
} from "@/components/ui/accordion";
import { 
  TrendingUp, 
  Users,
  DollarSign, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  CreditCard,
  BarChart3,
  Copy,
  User,
  MapPin,
  Mail,
  Phone,
  MessageCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import Loader from "@/components/Common/Loader";
import GuidedProductWizard from "./GuidedProductWizard";

interface DesignToken {
  tokenKey: string;
  tokenType: string;
  tokenValue: string;
  source?: string;
  meta?: any;
}

const ReviewSection = ({ designTokens, saasCreator, onRerunScrape, onSaveDesign, saving }: {
  designTokens: {
    currentTokens: {
      groupedTokens?: Record<string, DesignToken[]>;
      deepTokens?: DesignToken[];
      primaryColor?: string;
      secondaryColor?: string;
      logoUrl?: string;
      companyName?: string;
      companyInfo?: {
        emails?: string[];
      };
      brandVoice?: {
        summary?: string;
      };
      confidenceScores?: {
        colors?: number;
        logo?: number;
        fonts?: number;
      };
    } | null;
    currentConfig: any;
    versions: any[];
    editingToken: number | null;
    editingValue: string;
  };
  saasCreator: any;
  onRerunScrape: () => void;
  onSaveDesign: () => void;
  saving: boolean;
}) => {
  const tokens = designTokens.currentTokens;
  if (!tokens) {
    return (
      <Card className="border-dashed border-primary/30">
        <CardHeader>
          <CardTitle className="text-primary">Review Your Captured Setup</CardTitle>
          <CardDescription>No brand data captured yet. Run a scrape to analyze your site.</CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-4">
          <Button onClick={onRerunScrape} variant="outline">
            Scrape My Website
          </Button>
        </CardContent>
      </Card>
    );
  }

  const primaryColor = tokens.primaryColor || '#667eea';
  const secondaryColor = tokens.secondaryColor || '#f5f5f5';
  const logoUrl = tokens.logoUrl || '/placeholder-logo.svg';
  const companyName = tokens.companyName || saasCreator?.businessName || 'Your Company';
  const brandSummary = tokens.brandVoice?.summary || 'Professional and innovative SaaS brand.';
  const confidence = tokens.confidenceScores || { colors: 0.8, logo: 0.5, fonts: 0.7 };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">Review Your Captured Setup</CardTitle>
        <CardDescription className="text-sm">
          See your brand data from the site analysis and profile. We analyzed your website and Stripe profile to capture your visual identity.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid md:grid-cols-2 gap-6">
          {/* Left: Brand Info */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2">Your Brand</h4>
              <p className="text-muted-foreground mb-3">{brandSummary}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">Company: {companyName}</Badge>
                {tokens.companyInfo?.emails?.[0] && <Badge>{tokens.companyInfo.emails[0]}</Badge>}
              </div>
            </div>
            {/* Confidence Scores */}
            <div>
              <h5 className="font-medium mb-2">Analysis Confidence</h5>
              <div className="flex flex-wrap gap-2">
                <Badge variant={confidence.colors! > 0.7 ? "default" : "secondary"}>Colors: {Math.round((confidence.colors || 0) * 100)}%</Badge>
                <Badge variant={confidence.logo! > 0.7 ? "default" : "secondary"}>Logo: {Math.round((confidence.logo || 0) * 100)}%</Badge>
                <Badge variant={confidence.fonts! > 0.7 ? "default" : "secondary"}>Fonts: {Math.round((confidence.fonts || 0) * 100)}%</Badge>
              </div>
            </div>
          </div>
          {/* Right: Palette & Preview */}
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold text-lg mb-2" style={{ color: primaryColor }}>Your Palette</h4>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Primary Color</span>
                  <div 
                    className="w-16 h-16 rounded-lg border shadow-sm flex items-center justify-center text-xs font-mono hover:scale-105 transition-transform duration-200 cursor-pointer"
                    style={{ backgroundColor: primaryColor }}
                  >
                    {primaryColor}
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Secondary Color</span>
                  <div 
                    className="w-16 h-16 rounded-lg border shadow-sm flex items-center justify-center text-xs font-mono hover:scale-105 transition-transform duration-200 cursor-pointer"
                    style={{ backgroundColor: secondaryColor }}
                  >
                    {secondaryColor}
                  </div>
                </div>
              </div>
            </div>
            {/* Preview */}
            <div className="text-center">
              <h5 className="font-medium mb-2">Brand Preview</h5>
              <div 
                className="w-full h-48 bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg border flex items-center justify-center p-4"
                style={{ 
                  '--primary': primaryColor, 
                  '--secondary': secondaryColor 
                } as React.CSSProperties}
              >
                <div className="text-center">
                  {logoUrl !== '/placeholder-logo.svg' ? (
                    <img src={logoUrl} alt="Logo" className="h-12 w-auto mx-auto mb-2 rounded" />
                  ) : (
                    <div className="h-12 w-12 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-2">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                  )}
                  <p className="font-semibold text-primary" style={{ color: primaryColor }}>Welcome to {companyName}</p>
                  <p className="text-sm text-muted-foreground">Your SaaS Platform</p>
                  <p className="text-base font-medium mt-2" style={{ 
                    fontFamily: tokens.deepTokens?.find(t => t.tokenType === 'typography')?.tokenValue || 'sans-serif',
                    color: primaryColor 
                  }}>
                    Sample text in your font
                  </p>
                  <p className="text-sm italic mt-2" style={{ color: primaryColor }}>
                    "{brandSummary}"
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3" 
                    style={{ 
                      padding: tokens.deepTokens?.find(t => t.tokenType === 'spacing' && t.tokenKey.includes('md'))?.tokenValue || '1rem 2rem',
                      borderColor: primaryColor 
                    }}
                  >
                    Example CTA
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Buttons */}
        <div className="flex gap-3 pt-4 border-t">
          <Button 
            variant="outline" 
            onClick={onRerunScrape}
            className="flex-1"
          >
            Back - Edit & Rescrape
          </Button>
          <Button 
            onClick={onSaveDesign} 
            disabled={saving}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {saving ? 'Completing...' : 'Complete Setup'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface WhiteLabelConfig {
  subdomain?: string;
  customDomain?: string;
  successRedirect?: string;
}

interface DesignTokensState {
  currentTokens: any;
  currentConfig: any;
  versions: any[];
  editingToken: number | null;
  editingValue: string;
}

const Dashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saasCreator, setSaasCreator] = useState<any>(null);
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalSubscribers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    growthRate: 0,
    churnRate: 0,
  });
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [showProductModal, setShowProductModal] = useState(false);
  const [whiteLabelConfig, setWhiteLabelConfig] = useState<WhiteLabelConfig | null>(null);
  const [formData, setFormData] = useState({
    subdomain: '',
    customDomain: '',
    successRedirect: '',
  });
  const [saving, setSaving] = useState(false);
  const [designTokens, setDesignTokens] = useState<DesignTokensState>({
    currentTokens: null,
    currentConfig: null,
    versions: [],
    editingToken: null,
    editingValue: '',
  });
  const [showVersions, setShowVersions] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState('');

  const fetchDashboardData = useCallback(async () => {
    try {
      const response = await fetch("/api/saas/dashboard");
      const data = await response.json();
      
      setStats({
        totalProducts: data.stats?.totalProducts || 0,
        totalSubscribers: data.stats?.totalSubscribers || 0,
        activeSubscriptions: data.stats?.activeSubscriptions || 0,
        monthlyRevenue: data.stats?.monthlyRevenue || 0,
        growthRate: data.stats?.growthRate || 0,
        churnRate: data.stats?.churnRate || 0,
      });

      setRecentActivity(data.recentActivity || []);
      setTopProducts(data.topProducts || []);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  }, [setStats, setRecentActivity, setTopProducts]);

  const checkOnboardingStatus = useCallback(async () => {
    try {
      const response = await fetch("/api/saas/onboarding");
      const data = await response.json();

      if (!data.saasCreator) {
        router.push("/onboarding");
        return;
      }

      if (!data.onboardingCompleted) {
        router.push("/onboarding");
        return;
      }

      setSaasCreator(data.saasCreator);
      await fetchDashboardData();
    } catch (error: any) {
      toast.error("Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [router, fetchDashboardData, setSaasCreator, setLoading, toast]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/?auth=signin");
    } else if (status === "authenticated") {
      checkOnboardingStatus();
    }
  }, [status, router]);

  useEffect(() => {
    if (saasCreator) {
      fetchProducts();
      fetchWhiteLabelConfig();
      fetchDesignTokens();
    }
  }, [saasCreator]);

  useEffect(() => {
    if (whiteLabelConfig) {
      setFormData({
        subdomain: whiteLabelConfig.subdomain || '',
        customDomain: whiteLabelConfig.customDomain || '',
        successRedirect: whiteLabelConfig.successRedirect || '',
      });
    }
  }, [whiteLabelConfig]);

  const fetchDesignTokens = async () => {
    try {
      const response = await fetch('/api/saas/design');
      if (response.ok) {
        const data = await response.json();
        setDesignTokens({
          currentTokens: data.currentTokens,
          currentConfig: data.currentConfig,
          versions: data.versions,
          editingToken: null,
          editingValue: '',
        });
      }
    } catch (error) {
      console.error('Failed to fetch design tokens:', error);
    }
  };

  const handleRerunScrape = async () => {
    if (!saasCreator?.website) {
      toast.error('No website URL set. Please set your website URL in settings.');
      return;
    }

    try {
      const response = await fetch('/api/saas/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'rerun', url: saasCreator.website }),
      });

      if (response.ok) {
        toast.success('Scrape rerun started. Check back in a few minutes.');
        // Refresh tokens after delay
        setTimeout(fetchDesignTokens, 5000);
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to rerun scrape');
      }
    } catch (error) {
      toast.error('Failed to rerun scrape');
    }
  };

  const handleSaveDesign = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/saas/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tokens: designTokens.currentTokens,
          config: designTokens.currentConfig,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        toast.success('Design saved successfully. New version created.');
        fetchDesignTokens();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save design');
      }
    } catch (error) {
      toast.error('Failed to save design');
    } finally {
      setSaving(false);
    }
  };

  const handleEditToken = (index: number) => {
    setDesignTokens({
      ...designTokens,
      editingToken: index,
      editingValue: designTokens.currentTokens.deepTokens[index].tokenValue,
    });
  };

  const handleTokenChange = (index: number, value: string) => {
    setDesignTokens({
      ...designTokens,
      editingValue: value,
    });
  };

  const handleConfigChange = (key: string, value: string) => {
    setDesignTokens(prev => ({
      ...prev,
      currentConfig: {
        ...prev.currentConfig,
        [key]: value,
      },
    }));
  };

  const handleRevertVersion = async (versionId: string) => {
    try {
      const response = await fetch('/api/saas/design', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'revert', versionId }),
      });

      if (response.ok) {
        toast.success('Version reverted successfully.');
        fetchDesignTokens();
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to revert version');
      }
    } catch (error) {
      toast.error('Failed to revert version');
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/saas/white-label/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setWhiteLabelConfig({
          subdomain: data.config.subdomain,
          customDomain: data.config.customDomain,
        });
        toast.success('Configuration saved successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to save configuration');
      }
    } catch (error) {
      toast.error('Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const fetchWhiteLabelConfig = async () => {
    try {
      const response = await fetch("/api/saas/white-label/config");
      if (response.ok) {
        const data = await response.json();
        setWhiteLabelConfig({
          subdomain: data.subdomain,
          customDomain: data.customDomain,
        });
      }
    } catch (error) {
      console.error('Failed to fetch white label config:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await fetch("/api/saas/products");
      const data = await response.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    }
  };

  const handleCreateProduct = () => {
    setShowProductModal(true);
  };

  const handleProductModalClose = (updated: boolean) => {
    setShowProductModal(false);
    if (updated) {
      fetchProducts();
      fetchDashboardData(); // Refresh stats
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  const StatCard = ({ title, value, change, icon: Icon, trend }: any) => (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {change && (
          <p className={cn(
            "text-xs flex items-center mt-1",
            trend === "up" ? "text-green-600" : "text-red-600"
          )}>
            {trend === "up" ? (
              <ArrowUpRight className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownRight className="h-3 w-3 mr-1" />
            )}
            {change}
          </p>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Welcome Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, {saasCreator?.businessName || "Creator"}
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening with your SaaS business today
          </p>
        </div>
        <Button 
          className="bg-primary hover:bg-primary/90"
          onClick={() => router.push("/dashboard/analytics")}
        >
          <TrendingUp className="mr-2 h-4 w-4" />
          View Analytics
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <StatCard
          title="Total Revenue"
          value={`$${stats.monthlyRevenue.toLocaleString()}`}
          change="+12.5% from last month"
          icon={DollarSign}
          trend="up"
        />
        <StatCard
          title="Active Subscribers"
          value={stats.activeSubscriptions.toLocaleString()}
          change="+8.2% from last month"
          icon={Users}
          trend="up"
        />
        <StatCard
          title="Total Products"
          value={stats.totalProducts}
          change="+2 new this month"
          icon={Package}
          trend="up"
        />
        <StatCard
          title="Growth Rate"
          value={`${stats.growthRate}%`}
          change="Monthly growth"
          icon={TrendingUp}
          trend="up"
        />
      </div>

      {/* Onboarding Completion Tasks */}
      {session?.user?.role !== 'platform_owner' && (products.length === 0 || !whiteLabelConfig?.subdomain) && (
        <Card className="border-primary/20 bg-primary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Get Started Tasks
            </CardTitle>
            <CardDescription>
              Complete these steps to fully set up your SaaS platform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {products.length === 0 && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Set Up Products</p>
                      <p className="text-sm text-muted-foreground">Create products so subscribers can find and purchase your offerings</p>
                    </div>
                  </div>
                  <Button 
                    onClick={handleCreateProduct}
                    className="bg-primary hover:bg-primary/90"
                  >
                    Create Product
                  </Button>
                </div>
              )}
              {!whiteLabelConfig?.subdomain && (
                <div className="flex items-center justify-between p-3 rounded-lg bg-background">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">Review White-Label Pages</p>
                      <p className="text-sm text-muted-foreground">Configure your branding and visibility settings</p>
                    </div>
                  </div>
                  <Button 
                    variant="outline"
                    onClick={() => router.push("/dashboard/white-label")}
                  >
                    Review & Configure
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>Latest updates from your business</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      activity.type === "subscription" ? "bg-green-500" :
                      activity.type === "cancellation" ? "bg-red-500" :
                      "bg-blue-500"
                    )} />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.description}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {activity.time}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No recent activity
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Top Products */}
        <Card>
          <CardHeader>
            <CardTitle>Top Products</CardTitle>
            <CardDescription>Your best performing products</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topProducts.length > 0 ? (
                topProducts.map((product, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{product.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {product.subscribers} subscribers
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">
                      ${product.revenue}/mo
                    </Badge>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No products yet
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Get started with common tasks</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-3">
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 flex-col items-start gap-2" 
              onClick={handleCreateProduct}
            >
              <div className="flex items-center gap-2 w-full">
                <Package className="h-5 w-5 text-primary" />
                <span className="font-semibold">Add Product</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Create a new product with guided wizard
              </span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 flex-col items-start gap-2"
              onClick={() => router.push("/dashboard/subscribers")}
            >
              <div className="flex items-center gap-2 w-full">
                <Users className="h-5 w-5 text-primary" />
                <span className="font-semibold">View Subscribers</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                Manage your subscriber base
              </span>
            </Button>
            <Button 
              variant="outline" 
              className="justify-start h-auto py-4 flex-col items-start gap-2"
              onClick={() => {
                const origin = window.location.origin;
                const domain = whiteLabelConfig?.customDomain || whiteLabelConfig?.subdomain;
                if (domain) {
                  const url = whiteLabelConfig?.customDomain ? `https://${domain}` : `${origin}/${domain}`;
                  window.open(url, "_blank");
                } else {
                  toast.error("No white label domain set up. Please configure your subdomain or custom domain first.");
                }
              }}
            >
              <div className="flex items-center gap-2 w-full">
                <CreditCard className="h-5 w-5 text-primary" />
                <span className="font-semibold">White-Label Site</span>
              </div>
              <span className="text-xs text-muted-foreground text-left">
                View your white-label site
              </span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* White Label Settings */}
      <Card>
        <CardHeader>
          <CardTitle>White Label Settings</CardTitle>
          <CardDescription>Configure your white label domain and post-subscription redirect</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="subdomain">Subdomain (e.g., yourname)</Label>
              <Input
                id="subdomain"
                value={formData.subdomain}
                onChange={(e) => setFormData({ ...formData, subdomain: e.target.value })}
                placeholder="Enter subdomain"
              />
              <p className="text-sm text-muted-foreground">Your site will be at yourname.saasinasnap.com</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customDomain">Custom Domain (optional)</Label>
              <Input
                id="customDomain"
                value={formData.customDomain}
                onChange={(e) => setFormData({ ...formData, customDomain: e.target.value })}
                placeholder="example.com"
              />
              <p className="text-sm text-muted-foreground">Replace the subdomain with your own domain</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="successRedirect">Post-Subscription Redirect (optional)</Label>
              <Input
                id="successRedirect"
                value={formData.successRedirect}
                onChange={(e) => setFormData({ ...formData, successRedirect: e.target.value })}
                placeholder="/onboarding or /dashboard"
              />
              <p className="text-sm text-muted-foreground">Where users go after successful subscription (relative path)</p>
            </div>

            <Button onClick={handleSaveConfig} disabled={saving} className="w-full">
              {saving ? 'Saving...' : 'Save Configuration'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Design & Branding */}
      <Card>
        <CardHeader>
          <CardTitle>Design & Branding</CardTitle>
          <CardDescription>Manage your design tokens, white-label configuration, and brand identity</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-6 bg-gradient-to-br from-background to-muted/50 rounded-lg">
            {/* Design System Header */}
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
                Your Design System
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Showcase your brand professionally with captured design tokens. This is your prideful representation – let it shine!
              </p>
              <div className="flex justify-center gap-4 mt-4">
                <Button variant="outline" size="sm" onClick={handleRerunScrape} className="border-primary/50">
                  🔄 Rerun Extraction
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowVersions(true)}>
                  📋 Manage Versions
                </Button>
              </div>
            </div>

            {/* Brand Identity Section */}
            {designTokens.currentTokens && (
              <div className="grid md:grid-cols-2 gap-8 mb-8">
                <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold" style={{ color: designTokens.currentTokens.primaryColor || '#667eea' }}>
                      Brand Identity
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-center mb-4">
                      {designTokens.currentTokens.logoUrl ? (
                        <img
                          src={designTokens.currentTokens.logoUrl}
                          alt="Brand Logo"
                          className="h-20 w-auto rounded-xl shadow-lg object-contain border-2 border-primary/20"
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      ) : (
                        <div className="h-20 w-20 bg-gradient-to-br from-primary to-secondary rounded-xl flex items-center justify-center text-white font-bold shadow-lg border-2 border-primary/20">
                          Logo
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className="text-2xl font-bold mb-2" style={{ 
                        color: designTokens.currentTokens.primaryColor || '#667eea',
                        fontFamily: designTokens.currentTokens.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('heading'))?.tokenValue || 'Inter, sans-serif'
                      }}>
                        {designTokens.currentTokens.companyName || saasCreator?.businessName || 'Your Brand'}
                      </h3>
                      {designTokens.currentTokens.brandVoice?.summary && (
                        <p className="text-muted-foreground italic text-sm" style={{ 
                          fontFamily: designTokens.currentTokens.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'serif',
                          fontStyle: 'italic'
                        }}>
                          "{designTokens.currentTokens.brandVoice.summary}"
                        </p>
                      )}
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        <Badge variant="secondary" className="bg-primary/10 text-primary">
                          {designTokens.currentTokens.companyInfo?.name || 'Company'}
                        </Badge>
                        {designTokens.currentTokens.companyInfo?.emails?.[0] && (
                          <Badge variant="outline">{designTokens.currentTokens.companyInfo.emails[0]}</Badge>
                        )}
                        {designTokens.currentTokens.brandVoice?.tone && (
                          <Badge variant="default" className="bg-secondary text-secondary-foreground">
                            {designTokens.currentTokens.brandVoice.tone} Tone
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-secondary/20 bg-gradient-to-br from-secondary/5 to-muted/5 hover:shadow-xl transition-all duration-300">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-xl font-bold text-secondary-foreground">
                      Company Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {designTokens.currentTokens.companyInfo ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Mail className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-medium">Emails:</span>
                            {designTokens.currentTokens.companyInfo.emails.length > 0 ? (
                              designTokens.currentTokens.companyInfo.emails.map((email: string, i: number) => (
                                <Badge key={i} variant="secondary" className="mr-1 mt-1">{email}</Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No emails</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <Phone className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-medium">Phones:</span>
                            {designTokens.currentTokens.companyInfo.phones.length > 0 ? (
                              designTokens.currentTokens.companyInfo.phones.map((phone: string, i: number) => (
                                <Badge key={i} variant="outline" className="mr-1 mt-1">{phone}</Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No phones</span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <MessageCircle className="h-4 w-4 text-primary" />
                          <div>
                            <span className="font-medium">Social:</span>
                            {designTokens.currentTokens.companyInfo.socialLinks.length > 0 ? (
                              designTokens.currentTokens.companyInfo.socialLinks.map((link: {url: string, platform: string}, i: number) => (
                                <Badge key={i} variant="secondary" className="mr-1 mt-1">
                                  <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-inherit no-underline hover:underline">{link.platform}</a>
                                </Badge>
                              ))
                            ) : (
                              <span className="text-muted-foreground">No social links</span>
                            )}
                          </div>
                        </div>
                        {designTokens.currentTokens.brandVoice && (
                          <div className="p-3 rounded-lg bg-primary/5">
                            <span className="font-medium block mb-1">Personality Traits:</span>
                            <div className="flex flex-wrap gap-1">
                              {designTokens.currentTokens.brandVoice.personality.map((trait: string, i: number) => (
                                <Badge key={i} variant="outline" size="sm">{trait}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-muted-foreground text-center py-8">No company details captured yet.</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}

            {/* Colors & Typography Sections */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Color Palette */}
              <Card className="border-primary/20 hover:shadow-xl transition-all duration-300 overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: designTokens.currentTokens?.primaryColor || '#667eea' }}>
                    <span className="text-2xl">🎨</span> Color Palette
                  </CardTitle>
                  <CardDescription>Primary, secondary, and extracted colors from your brand</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {/* Primary & Secondary */}
                    {designTokens.currentTokens?.primaryColor && (
                      <div 
                        className="group relative w-full h-20 rounded-xl border-2 border-primary/20 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg"
                        style={{ backgroundColor: designTokens.currentTokens.primaryColor }}
                        onClick={() => {
                          navigator.clipboard.writeText(designTokens.currentTokens.primaryColor);
                          toast.success('Primary color copied!');
                        }}
                        title="Click to copy"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-4 w-4 text-white" />
                        </div>
                        <div className="absolute bottom-2 right-2 text-xs font-mono text-white/90 bg-black/20 rounded px-1">
                          Primary
                        </div>
                      </div>
                    )}
                    {designTokens.currentTokens?.secondaryColor && (
                      <div 
                        className="group relative w-full h-20 rounded-xl border-2 border-secondary/20 cursor-pointer hover:scale-105 transition-all duration-300 shadow-lg"
                        style={{ backgroundColor: designTokens.currentTokens.secondaryColor }}
                        onClick={() => {
                          navigator.clipboard.writeText(designTokens.currentTokens.secondaryColor);
                          toast.success('Secondary color copied!');
                        }}
                        title="Click to copy"
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Copy className="h-4 w-4 text-black" />
                        </div>
                        <div className="absolute bottom-2 right-2 text-xs font-mono text-black/90 bg-white/20 rounded px-1">
                          Secondary
                        </div>
                      </div>
                    )}
                    {/* Grouped Colors */}
                    {designTokens.currentTokens?.groupedTokens?.color && designTokens.currentTokens.groupedTokens.color.slice(0, 6).map((token: DesignToken, i: number) => (
                      <div 
                        key={i}
                        className="group relative w-full h-16 rounded-lg border cursor-pointer hover:scale-105 transition-all duration-300 shadow-md"
                        style={{ backgroundColor: token.tokenValue }}
                        onClick={() => {
                          navigator.clipboard.writeText(token.tokenValue);
                          toast.success(`${token.tokenKey} copied!`);
                        }}
                        title={`${token.tokenKey}: Click to copy`}
                      >
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 rounded-lg">
                          <Copy className="h-3 w-3 text-white" />
                        </div>
                        <div className="absolute -bottom-8 left-0 right-0 text-center text-xs font-mono bg-background/90 backdrop-blur-sm rounded px-2 py-1 text-white/90">
                          {token.tokenKey}
                        </div>
                      </div>
                    ))}
                  </div>
                  {designTokens.currentTokens?.groupedTokens?.color?.length > 6 && (
                    <Button variant="link" className="mt-4 p-0 h-auto text-primary">
                      View all {designTokens.currentTokens.groupedTokens.color.length} colors
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* Typography */}
              <Card className="border-secondary/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-secondary/5">
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-secondary-foreground">
                    <span className="text-2xl">📝</span> Typography
                  </CardTitle>
                  <CardDescription>Font families, sizes, and weights from your design</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    {/* Heading Demo */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Heading (H1)</Label>
                      <h1 className="text-3xl font-bold" style={{ 
                        fontFamily: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('heading'))?.tokenValue || 'Inter, sans-serif',
                        color: designTokens.currentTokens?.primaryColor || '#667eea'
                      }}>
                        Your Brand Heading
                      </h1>
                      <p className="text-xs text-muted-foreground">Applied: {designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('heading'))?.tokenValue || 'Default'}</p>
                    </div>
                    {/* Body Demo */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Body Text</Label>
                      <p className="text-base leading-relaxed" style={{ 
                        fontFamily: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'serif'
                      }}>
                        This is sample body text showcasing your brand's typography. It should feel professional and aligned with your voice.
                      </p>
                      <p className="text-xs text-muted-foreground">Applied: {designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'Default'}</p>
                    </div>
                    {/* Accent Demo */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Accent / Caption</Label>
                      <p className="text-sm italic font-light" style={{ 
                        fontFamily: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('caption'))?.tokenValue || 'serif',
                        color: designTokens.currentTokens?.secondaryColor || '#764ba2'
                      }}>
                        This is an italic caption or quote style.
                      </p>
                      <p className="text-xs text-muted-foreground">Applied: {designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('caption'))?.tokenValue || 'Default'}</p>
                    </div>
                  </div>
                  {/* Token List if many */}
                  {designTokens.currentTokens?.groupedTokens?.typography && (
                    <div className="mt-6 pt-4 border-t">
                      <h5 className="font-medium mb-3">All Typography Tokens ({designTokens.currentTokens.groupedTokens.typography.length})</h5>
                      <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
                        {designTokens.currentTokens.groupedTokens.typography.map((token: DesignToken, i: number) => (
                          <div key={i} className="flex items-center justify-between p-2 bg-muted/50 rounded">
                            <span className="text-sm font-medium">{token.tokenKey}</span>
                            <span className="text-xs" style={{ fontFamily: token.tokenValue }}>Aa {token.tokenValue}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Icons & Components Sections */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Icons */}
              <Card className="border-accent/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-accent/5">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">🖼️</span> Icons & Elements
                  </CardTitle>
                  <CardDescription>Styled icons using your color and spacing tokens</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {[
                      { icon: TrendingUp, name: 'Growth' },
                      { icon: Users, name: 'Users' },
                      { icon: DollarSign, name: 'Revenue' },
                      { icon: Package, name: 'Product' },
                      { icon: CheckCircle, name: 'Success' },
                      { icon: CreditCard, name: 'Payment' },
                      { icon: BarChart3, name: 'Analytics' },
                      { icon: Copy, name: 'Copy' }
                    ].map(({ icon: Icon, name }, i) => (
                      <div 
                        key={i}
                        className="group flex flex-col items-center p-3 rounded-lg bg-muted/50 hover:bg-primary/5 transition-all duration-300 cursor-pointer hover:scale-105"
                        style={{ 
                          '--icon-color': designTokens.currentTokens?.primaryColor || '#667eea',
                          padding: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'spacing' && t.tokenKey.includes('sm'))?.tokenValue || '0.5rem'
                        } as React.CSSProperties}
                      >
                        <Icon className="h-6 w-6 mb-1 group-hover:text-primary transition-colors" style={{ color: 'var(--icon-color)' }} />
                        <span className="text-xs text-center text-muted-foreground">{name}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Icons styled with your primary color and spacing. Expandable to custom SVGs if captured.
                  </p>
                </CardContent>
              </Card>

              {/* Components */}
              <Card className="border-primary/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: designTokens.currentTokens?.primaryColor || '#667eea' }}>
                    <span className="text-2xl">⚛️</span> UI Components
                  </CardTitle>
                  <CardDescription>Button and card variants powered by your tokens</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {/* Buttons */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Button Variants</Label>
                    <div className="flex flex-wrap gap-2">
                      <Button 
                        className="bg-primary hover:bg-primary/90 transition-all duration-300" 
                        style={{ 
                          backgroundColor: designTokens.currentTokens?.primaryColor || '#667eea',
                          borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem',
                          padding: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'spacing' && t.tokenKey.includes('md'))?.tokenValue || '0.5rem 1rem'
                        }}
                      >
                        Primary Action
                      </Button>
                      <Button 
                        variant="outline" 
                        style={{ 
                          borderColor: designTokens.currentTokens?.primaryColor || '#667eea',
                          color: designTokens.currentTokens?.primaryColor || '#667eea',
                          borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem'
                        }}
                      >
                        Outline
                      </Button>
                      <Button 
                        variant="secondary" 
                        className="bg-secondary hover:bg-secondary/90" 
                        style={{ 
                          backgroundColor: designTokens.currentTokens?.secondaryColor || '#764ba2',
                          borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem'
                        }}
                      >
                        Secondary
                      </Button>
                      <Button variant="destructive" size="sm">
                        Destructive
                      </Button>
                    </div>
                  </div>
                  {/* Card Demo */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Sample Card</Label>
                    <Card className="border-primary/20" style={{ 
                      boxShadow: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'shadow' && t.tokenKey.includes('md'))?.tokenValue || '0 1px 3px rgba(0,0,0,0.1)',
                      borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('lg'))?.tokenValue || '0.5rem'
                    }}>
                      <CardContent className="p-4" style={{ 
                        padding: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'spacing' && t.tokenKey.includes('lg'))?.tokenValue || '1rem'
                      }}>
                        <h4 className="font-semibold mb-1" style={{ color: designTokens.currentTokens?.primaryColor || '#667eea' }}>Product Card</h4>
                        <p className="text-sm text-muted-foreground">This card uses your shadow, border radius, and spacing tokens.</p>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Forms & Preview Sections */}
            <div className="grid lg:grid-cols-2 gap-8 mb-8">
              {/* Forms */}
              <Card className="border-accent/20 hover:shadow-xl transition-all duration-300">
                <CardHeader className="bg-accent/5">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <span className="text-2xl">📋</span> Form Elements
                  </CardTitle>
                  <CardDescription>Inputs, selects, and labels styled with your tokens</CardDescription>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="demo-input" className="text-sm font-medium" style={{ 
                        color: designTokens.currentTokens?.primaryColor || '#667eea',
                        fontFamily: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('label'))?.tokenValue || 'Inter, sans-serif'
                      }}>
                        Sample Input
                      </Label>
                      <Input
                        id="demo-input"
                        placeholder="Enter your email..."
                        className="border-primary/30 focus:border-primary focus:ring-primary/20"
                        style={{ 
                          borderColor: designTokens.currentTokens?.primaryColor || '#667eea',
                          borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('sm'))?.tokenValue || '0.25rem',
                          padding: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'spacing' && t.tokenKey.includes('sm'))?.tokenValue || '0.5rem'
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="demo-select" className="text-sm font-medium">Sample Select</Label>
                      <select
                        id="demo-select"
                        className="w-full p-3 border rounded-md focus:border-primary focus:ring-1 focus:ring-primary/20"
                        style={{ 
                          borderColor: designTokens.currentTokens?.primaryColor || '#667eea',
                          borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem',
                          fontFamily: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'Inter, sans-serif'
                        }}
                      >
                        <option>Option 1</option>
                        <option>Option 2</option>
                        <option>Option 3</option>
                      </select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Textarea</Label>
                      <textarea
                        placeholder="Add your description..."
                        className="w-full h-20 p-3 border rounded-md resize-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                        style={{ 
                          borderColor: designTokens.currentTokens?.secondaryColor || '#764ba2',
                          borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem'
                        }}
                      />
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground text-center">
                    Forms use your border, color, and typography tokens for consistent branding.
                  </p>
                </CardContent>
              </Card>

              {/* Enhanced Preview */}
              <Card className="border-primary/20 hover:shadow-2xl transition-all duration-500 col-span-1 lg:col-span-1">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-secondary/10">
                  <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: designTokens.currentTokens?.primaryColor || '#667eea' }}>
                    <span className="text-2xl">✨</span> Live Brand Preview
                  </CardTitle>
                  <CardDescription>Your white-label page mockup with all tokens applied</CardDescription>
                </CardHeader>
                <CardContent className="p-6">
                  <div 
                    className="relative w-full h-96 bg-gradient-to-br from-background to-muted rounded-xl border-2 border-primary/20 shadow-2xl overflow-hidden flex flex-col"
                    style={{ 
                      '--primary': designTokens.currentTokens?.primaryColor || '#667eea',
                      '--secondary': designTokens.currentTokens?.secondaryColor || '#764ba2',
                      '--font-heading': designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('heading'))?.tokenValue || 'Inter, sans-serif',
                      '--font-body': designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'serif',
                      '--spacing-md': designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'spacing' && t.tokenKey.includes('md'))?.tokenValue || '1rem',
                      '--border-radius': designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('lg'))?.tokenValue || '0.5rem',
                      '--shadow': designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'shadow' && t.tokenKey.includes('lg'))?.tokenValue || '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    } as React.CSSProperties}
                  >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b" style={{ 
                      padding: 'var(--spacing-md)',
                      borderColor: 'var(--primary)',
                      boxShadow: 'var(--shadow)'
                    }}>
                      <div className="flex items-center gap-4">
                        {designTokens.currentTokens?.logoUrl ? (
                          <img
                            src={designTokens.currentTokens.logoUrl}
                            alt="Logo"
                            className="h-12 w-auto rounded-lg object-contain"
                            style={{ borderRadius: 'var(--border-radius)' }}
                          />
                        ) : (
                          <div className="h-12 w-12 bg-gradient-to-br from-primary to-secondary rounded-lg flex items-center justify-center text-white font-bold" style={{ 
                            backgroundColor: 'var(--primary)',
                            borderRadius: 'var(--border-radius)'
                          }}>
                            Logo
                          </div>
                        )}
                        <div>
                          <h1 className="text-2xl font-bold" style={{ 
                            color: 'var(--primary)',
                            fontFamily: 'var(--font-heading)'
                          }}>
                            {designTokens.currentTokens?.companyName || saasCreator?.businessName || 'Your Brand'}
                          </h1>
                          <p className="text-sm text-muted-foreground" style={{ fontFamily: 'var(--font-body)' }}>
                            Professional SaaS Platform
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" style={{ 
                        borderColor: 'var(--primary)',
                        color: 'var(--primary)',
                        borderRadius: 'var(--border-radius)'
                      }}>
                        Login
                      </Button>
                    </div>

                    {/* Hero Content */}
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                      <h2 className="text-4xl font-bold mb-4" style={{ 
                        color: 'var(--primary)',
                        fontFamily: 'var(--font-heading)'
                      }}>
                        Welcome to Your Platform
                      </h2>
                      <p className="text-lg text-muted-foreground mb-6 max-w-md leading-relaxed" style={{ 
                        fontFamily: 'var(--font-body)',
                        lineHeight: '1.6',
                        marginBottom: 'var(--spacing-md)'
                      }}>
                        Discover how your brand comes to life with captured design tokens. Professional, polished, and perfectly you.
                      </p>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <Button 
                          className="bg-primary hover:bg-primary/90 px-8 py-3" 
                          style={{ 
                            backgroundColor: 'var(--primary)',
                            borderRadius: 'var(--border-radius)',
                            padding: 'var(--spacing-md)',
                            fontFamily: 'var(--font-body)'
                          }}
                        >
                          Get Started
                        </Button>
                        <Button 
                          variant="outline" 
                          className="px-8 py-3" 
                          style={{ 
                            borderColor: 'var(--secondary)',
                            color: 'var(--secondary)',
                            borderRadius: 'var(--border-radius)'
                          }}
                        >
                          Learn More
                        </Button>
                      </div>
                    </div>

                    {/* Footer */}
                    <div className="p-4 border-t text-center text-sm text-muted-foreground" style={{ 
                      padding: 'var(--spacing-md)',
                      borderColor: 'var(--secondary)',
                      fontFamily: 'var(--font-body)'
                    }}>
                      Powered by your design system • {designTokens.currentTokens?.brandVoice?.tone || 'Professional'} tone
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    This interactive preview applies all your tokens in real-time. Hover and interact to see the magic!
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Collapsible Edit & Config */}
            <Accordion type="single" collapsible className="w-full mb-8">
              <AccordionItem value="edit">
                <AccordionTrigger className="text-lg font-semibold hover:no-underline" style={{ color: designTokens.currentTokens?.primaryColor || '#667eea' }}>
                  <span className="mr-2">✏️</span> Edit Design Tokens
                </AccordionTrigger>
                <AccordionContent>
                  <div className="overflow-x-auto mt-4">
                    <table className="w-full border-collapse">
                      <thead>
                        <tr className="border-b bg-muted/50">
                          <th className="text-left p-3 font-medium">Token Key</th>
                          <th className="text-left p-3 font-medium">Type</th>
                          <th className="text-left p-3 font-medium">Value</th>
                          <th className="text-left p-3 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {designTokens.currentTokens?.deepTokens?.map((token, index) => (
                          <tr key={index} className="border-b hover:bg-muted/50 transition-colors">
                            <td className="p-3 font-medium">{token.tokenKey}</td>
                            <td className="p-3">
                              <Badge variant="secondary">{token.tokenType}</Badge>
                            </td>
                            <td className="p-3">
                              <Input
                                value={designTokens.editingToken === index ? designTokens.editingValue : token.tokenValue}
                                onChange={(e) => handleTokenChange(index, e.target.value)}
                                onBlur={() => setDesignTokens({ ...designTokens, editingToken: null })}
                                className={cn(
                                  "bg-transparent border-transparent focus:border-primary focus:ring-primary/20",
                                  designTokens.editingToken === index && "border-primary/50"
                                )}
                                style={{ borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('sm'))?.tokenValue || '0.25rem' }}
                              />
                            </td>
                            <td className="p-3">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleEditToken(index)}
                                className="h-8 px-2"
                              >
                                {designTokens.editingToken === index ? '💾 Save' : '✏️ Edit'}
                              </Button>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              No design tokens available. Run extraction to generate tokens.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>

            {/* White-Label Configuration - Polished */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2" style={{ color: designTokens.currentTokens?.primaryColor || '#667eea' }}>
                  <span className="text-2xl">⚙️</span> White-Label Configuration
                </CardTitle>
                <CardDescription>Finalize your branding and visibility settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor" className="font-medium">Primary Color</Label>
                    <Input
                      id="primaryColor"
                      type="color"
                      value={designTokens.currentTokens?.primaryColor || '#667eea'}
                      onChange={(e) => handleConfigChange('primaryColor', e.target.value)}
                      className="h-12 border-2 border-primary/30 hover:border-primary/50 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor" className="font-medium">Secondary Color</Label>
                    <Input
                      id="secondaryColor"
                      type="color"
                      value={designTokens.currentTokens?.secondaryColor || '#764ba2'}
                      onChange={(e) => handleConfigChange('secondaryColor', e.target.value)}
                      className="h-12 border-2 border-secondary/30 hover:border-secondary/50 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="brandName" className="font-medium">Brand Name Override</Label>
                    <Input
                      id="brandName"
                      value={designTokens.currentConfig?.brandName || saasCreator?.businessName || ''}
                      onChange={(e) => handleConfigChange('brandName', e.target.value)}
                      placeholder="Override captured brand name"
                      className="border-primary/30 focus:border-primary"
                      style={{ borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem' }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customCss" className="font-medium">Custom CSS (Advanced)</Label>
                    <textarea
                      id="customCss"
                      value={designTokens.currentConfig?.customCss || ''}
                      onChange={(e) => handleConfigChange('customCss', e.target.value)}
                      className="w-full h-24 p-3 border rounded-md focus:border-primary focus:ring-primary/20 resize-vertical"
                      placeholder="/* Add custom styles for white-label pages */ body { font-family: 'Your Font'; }"
                      style={{ borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem' }}
                    />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1 space-y-2">
                      <Label htmlFor="pageVisibility" className="font-medium">Page Visibility</Label>
                      <select
                        id="pageVisibility"
                        value={designTokens.currentConfig?.pageVisibility || 'public'}
                        onChange={(e) => handleConfigChange('pageVisibility', e.target.value)}
                        className="w-full p-3 border rounded-md focus:border-primary focus:ring-primary/20 bg-background"
                        style={{ 
                          borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem',
                          fontFamily: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'typography' && t.tokenKey.includes('body'))?.tokenValue || 'Inter, sans-serif'
                        }}
                      >
                        <option value="public">🌐 Public</option>
                        <option value="private">🔒 Private</option>
                        <option value="unlisted">🔗 Unlisted</option>
                      </select>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Label className="font-medium">Confidence Scores</Label>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { key: 'colors', label: 'Colors', score: designTokens.currentTokens?.confidenceScores?.colors },
                          { key: 'logo', label: 'Logo', score: designTokens.currentTokens?.confidenceScores?.logo },
                          { key: 'fonts', label: 'Fonts', score: designTokens.currentTokens?.confidenceScores?.fonts }
                        ].map(({ key, label, score }) => (
                          <Badge 
                            key={key} 
                            variant={score && score > 0.7 ? "default" : "secondary"} 
                            className={score && score > 0.7 ? "bg-green-500" : "bg-yellow-500"}
                          >
                            {label}: {score ? Math.round(score * 100) + '%' : 'N/A'}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={handleSaveDesign} 
                  disabled={saving} 
                  className="w-full bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white font-semibold py-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={{ 
                    backgroundColor: designTokens.currentTokens?.primaryColor || '#667eea',
                    borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('lg'))?.tokenValue || '0.5rem'
                  }}
                >
                  {saving ? '💾 Saving Your Shine...' : '✨ Save Design & Make It Live'}
                </Button>
              </CardContent>
            </Card>

            {/* Versions Management - Integrated */}
            {showVersions && (
              <Card className="border-warning/20 bg-warning/5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <span className="text-xl">📚</span> Design Versions History
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3 items-center">
                    <select
                      value={selectedVersion}
                      onChange={(e) => setSelectedVersion(e.target.value)}
                      className="flex-1 p-3 border rounded-md focus:border-primary focus:ring-primary/20"
                      style={{ borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem' }}
                    >
                      <option value="">Select a version to revert</option>
                      {designTokens.versions?.map((version) => (
                        <option key={version.id} value={version.id}>
                          v{version.version} - {new Date(version.createdAt).toLocaleDateString()} {version.isActive && '(Active)'} • {version.confidence || 'N/A'}% confidence
                        </option>
                      ))}
                    </select>
                    <Button 
                      onClick={() => handleRevertVersion(selectedVersion)} 
                      variant="destructive" 
                      disabled={!selectedVersion}
                      className="px-6"
                      style={{ borderRadius: designTokens.currentTokens?.deepTokens?.find(t => t.tokenType === 'border' && t.tokenKey.includes('md'))?.tokenValue || '0.375rem' }}
                    >
                      🔄 Revert
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowVersions(false)}
                      className="px-6"
                    >
                      ❌ Close
                    </Button>
                  </div>
                  {designTokens.versions?.length === 0 && (
                    <p className="text-muted-foreground text-center py-4">No versions yet. Save your first design to create one.</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Guided Product Wizard */}
      {showProductModal && (
        <GuidedProductWizard
          onClose={handleProductModalClose}
        />
      )}
    </div>
  );
};

export default Dashboard;