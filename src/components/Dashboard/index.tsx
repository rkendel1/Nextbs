"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users,
  DollarSign, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle,
  CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";
import Loader from "@/components/Common/Loader";
import DesignStudio from "./DesignStudio";
import EmbedAssets from "./EmbedAssets";
import AnalyticsTab from "./AnalyticsTab";
import SettingsTab from "./SettingsTab";
import GuidedProductWizard from "./GuidedProductWizard";

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
    }
  }, [saasCreator]);

  const searchParams = useSearchParams();
  const activeTab = searchParams.get('tab') || 'overview';

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

  const renderContent = () => {
    const whiteLabelConfig = saasCreator?.whiteLabelConfig || {};
    switch (activeTab) {
      case 'overview':
        return (
          <>
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">
                  Welcome back, {saasCreator?.businessName || "Creator"}
                </h1>
                <p className="text-sm text-muted-foreground">
                  Here is what is happening with your SaaS business today
                </p>
              </div>
              <Button 
                className="bg-primary hover:bg-primary/90"
                onClick={() => router.push("/dashboard?tab=analytics")}
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
            {session?.user?.role !== 'platform_owner' && (products.length === 0 || true) && (
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
                      const domain = whiteLabelConfig.customDomain || whiteLabelConfig.subdomain;
                      if (domain) {
                        const url = whiteLabelConfig.customDomain ? `https://${domain}` : `${origin}/${domain}`;
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
          </>
        );
      case 'design-studio':
        return <DesignStudio saasCreator={saasCreator} />;
      case 'products':
        return (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h1 className="text-2xl font-bold">Products</h1>
              <Button onClick={handleCreateProduct} className="bg-primary hover:bg-primary/90">
                <Package className="mr-2 h-4 w-4" />
                Add Product
              </Button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {products.map((product, index) => (
                <Card key={index}>
                  <CardHeader>
                    <CardTitle>{product.name}</CardTitle>
                    <CardDescription>{product.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <Badge variant="secondary">${product.price}/mo</Badge>
                      <Button variant="outline" size="sm">
                        Edit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {products.length === 0 && (
                <Card>
                  <CardContent className="text-center py-8">
                    <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No products yet. Create your first product to get started.</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        );
      case 'embeds':
        return <EmbedAssets />;
      case 'analytics':
        return <AnalyticsTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Select a section from the side panel.</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <Tabs value={activeTab} onValueChange={(value) => router.push(`/dashboard?tab=${value}`)} className="w-full">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="design-studio">Design Studio</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
          <TabsTrigger value="embeds">Embeds</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
      </Tabs>
      {renderContent()}

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