"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  Users, 
  DollarSign, 
  Package,
  ArrowUpRight,
  ArrowDownRight,
  MoreVertical,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  CreditCard,
  BarChart3
} from "lucide-react";
import { cn } from "@/lib/utils";
import DashboardLayout from "@/components/DashboardLayout";
import Loader from "@/components/Common/Loader";
import GuidedProductWizard from "./GuidedProductWizard";
import ProductsList from "./ProductsList";

const Dashboard = () => {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [loading, setLoading] = useState(true);
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
  const [subscribers, setSubscribers] = useState<any[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      checkOnboardingStatus();
    }
  }, [status]);

  useEffect(() => {
    if (saasCreator) {
      fetchProducts();
      fetchSubscribers();
    }
  }, [saasCreator]);

  const checkOnboardingStatus = async () => {
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
  };

  const fetchDashboardData = async () => {
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

  const fetchSubscribers = async () => {
    try {
      const response = await fetch("/api/saas/subscribers");
      const data = await response.json();
      setSubscribers(data.subscribers || []);
    } catch (error) {
      console.error("Failed to fetch subscribers:", error);
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
    <DashboardLayout>
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

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
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
                    onClick={() => router.push("/dashboard/white-label")}
                  >
                    <div className="flex items-center gap-2 w-full">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <span className="font-semibold">White-Label Site</span>
                    </div>
                    <span className="text-xs text-muted-foreground text-left">
                      Configure your branded portal
                    </span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductsList onUpdate={fetchDashboardData} />
          </TabsContent>

          <TabsContent value="subscribers" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Management</CardTitle>
                <CardDescription>View and manage your subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                {subscribers.length === 0 ? (
                  <div className="text-center py-12 px-4">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                      <Users className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold mb-2">No subscribers yet</h3>
                    <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      Subscribers will appear here when users sign up for your products. 
                      Share your white-label site to start growing your subscriber base.
                    </p>
                    <div className="flex gap-3 justify-center">
                      <Button 
                        variant="outline"
                        onClick={() => router.push("/dashboard/white-label")}
                      >
                        View White-Label Site
                      </Button>
                      {products.length === 0 && (
                        <Button 
                          className="bg-primary hover:bg-primary/90"
                          onClick={handleCreateProduct}
                        >
                          <Package className="mr-2 h-4 w-4" />
                          Create Product
                        </Button>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {subscribers.slice(0, 10).map((subscription) => (
                      <div
                        key={subscription.id}
                        className="rounded-lg border border-stroke p-4 transition hover:border-primary dark:border-dark-3"
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
                          <div className="ml-4 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => router.push(`/dashboard/subscribers/${subscription.id}`)}
                            >
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                    {subscribers.length > 10 && (
                      <div className="pt-4 text-center">
                        <Button 
                          variant="outline"
                          onClick={() => router.push("/dashboard/subscriptions")}
                        >
                          View All Subscribers ({subscribers.length})
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Business Analytics</CardTitle>
                <CardDescription>Detailed insights into your business performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">Advanced analytics features coming soon</p>
                  <Button className="mt-4 bg-primary hover:bg-primary/90">
                    <BarChart3 className="mr-2 h-4 w-4" />
                    View Detailed Analytics
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Guided Product Wizard */}
      {showProductModal && (
        <GuidedProductWizard
          onClose={handleProductModalClose}
        />
      )}
    </DashboardLayout>
  );
};

export default Dashboard;