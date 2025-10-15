"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingUp, 
  TrendingDown,
  Users, 
  DollarSign, 
  Package,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  BarChart3,
  PieChart,
  Activity
} from "lucide-react";
import { cn } from "@/lib/utils";

const AnalyticsDashboard = () => {
  const [timeRange, setTimeRange] = useState("7d");
  const [isLoading, setIsLoading] = useState(false);
  const [analyticsData, setAnalyticsData] = useState<any>(null);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Real data from API calls
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [subscriberGrowth, setSubscriberGrowth] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);

  const StatCard = ({ title, value, change, trend, description, icon: Icon }: any) => (
    <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <div className="flex items-center space-x-2 mt-1">
          <span className={cn(
            "text-xs flex items-center",
            trend === "up" ? "text-green-600" : "text-red-600"
          )}>
            {trend === "up" ? (
              <TrendingUp className="h-3 w-3 mr-1" />
            ) : (
              <TrendingDown className="h-3 w-3 mr-1" />
            )}
            {change}
          </span>
          <span className="text-xs text-muted-foreground">{description}</span>
        </div>
      </CardContent>
    </Card>
  );

  // Fetch real data from API
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch analytics data
        const analyticsResponse = await fetch(`/api/saas/analytics?range=${timeRange}`);
        const analyticsData = await analyticsResponse.json();
        
        if (analyticsResponse.ok && analyticsData) {
          setRevenueData(analyticsData.revenue || []);
          setSubscriberGrowth(analyticsData.subscribers || []);
        }

        // Fetch dashboard data for metrics and top products
        const dashboardResponse = await fetch("/api/dashboard");
        const dashboardData = await dashboardResponse.json();
        
        if (dashboardResponse.ok && dashboardData) {
          const stats = dashboardData.stats || {};
          const products = dashboardData.products || [];
          
          // Calculate metrics from real data
          const calculatedMetrics = [
            {
              title: "Monthly Recurring Revenue",
              value: `$${(stats.monthlyRevenue / 100 || 0).toLocaleString()}`,
              change: stats.growthRate ? `+${stats.growthRate}%` : "+0%",
              trend: "up",
              description: "vs last month",
              icon: DollarSign,
            },
            {
              title: "Active Subscribers",
              value: (stats.activeSubscriptions || 0).toLocaleString(),
              change: stats.growthRate ? `+${stats.growthRate}%` : "+0%",
              trend: "up",
              description: "vs last month",
              icon: Users,
            },
            {
              title: "Average Revenue Per User",
              value: stats.activeSubscriptions && stats.monthlyRevenue 
                ? `$${((stats.monthlyRevenue / 100) / stats.activeSubscriptions).toFixed(2)}`
                : "$0.00",
              change: "+4.1%",
              trend: "up",
              description: "vs last month",
              icon: TrendingUp,
            },
            {
              title: "Churn Rate",
              value: `${stats.churnRate || 0}%`,
              change: stats.churnRate ? `${stats.churnRate > 0 ? '+' : ''}${stats.churnRate}%` : "0%",
              trend: stats.churnRate && stats.churnRate > 0 ? "down" : "up",
              description: "vs last month",
              icon: TrendingDown,
            },
          ];
          setMetrics(calculatedMetrics);
          
          // Transform products data for top products
          const transformedProducts = products.map((product: any) => ({
            name: product.name,
            revenue: product.revenue || 0,
            subscribers: product.subscribers || 0,
            growth: product.growth || 0,
          }));
          setTopProducts(transformedProducts);
        }
      } catch (error) {
        console.error("Failed to fetch analytics data:", error);
        // Set empty arrays on error
        setRevenueData([]);
        setSubscriberGrowth([]);
        setTopProducts([]);
        setMetrics([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  const refreshData = async () => {
    setIsLoading(true);
    // Re-fetch data when refresh is clicked
    try {
      const analyticsResponse = await fetch(`/api/saas/analytics?range=${timeRange}`);
      const analyticsData = await analyticsResponse.json();
      
      if (analyticsResponse.ok && analyticsData) {
        setRevenueData(analyticsData.revenue || []);
        setSubscriberGrowth(analyticsData.subscribers || []);
      }
    } catch (error) {
      console.error("Failed to refresh data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Deep insights into your SaaS business performance
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-background"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <Button variant="outline" size="icon" onClick={refreshData} disabled={isLoading}>
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
          </Button>
          <Button variant="outline" size="icon">
            <Download className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon">
            <Filter className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {metrics.length > 0 ? (
          metrics.map((metric, index) => (
            <StatCard key={index} {...metric} />
          ))
        ) : (
          <>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardContent className="pt-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/4"></div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="revenue">Revenue</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
          <TabsTrigger value="products">Products</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Revenue Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly recurring revenue over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-blue-50 to-orange-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                  <div className="text-center">
                    <BarChart3 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Revenue chart coming soon</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Interactive charts will be available in the next update
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscriber Growth Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Growth</CardTitle>
                <CardDescription>New vs churned subscribers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64 flex items-center justify-center bg-gradient-to-br from-green-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-lg">
                  <div className="text-center">
                    <Activity className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">Growth chart coming soon</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Track your subscriber growth with detailed analytics
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Top Products Performance */}
          <Card>
            <CardHeader>
              <CardTitle>Product Performance</CardTitle>
              <CardDescription>Revenue and growth by product</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 rounded-lg bg-accent/50 animate-pulse">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-lg bg-gray-200"></div>
                        <div>
                          <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="h-4 bg-gray-200 rounded w-12 mb-2"></div>
                        <div className="h-3 bg-gray-200 rounded w-8"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : topProducts.length > 0 ? (
                <div className="space-y-4">
                  {topProducts.map((product, index) => (
                    <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                      <div className="flex items-center space-x-4">
                        <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{product.name}</h3>
                          <p className="text-sm text-muted-foreground">{product.subscribers} subscribers</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">${product.revenue.toLocaleString()}</p>
                        <Badge variant={product.growth > 0 ? "default" : "destructive"}>
                          {product.growth > 0 ? "+" : ""}{product.growth}%
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No product data available</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Create some products to see performance metrics
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Revenue Analytics</CardTitle>
              <CardDescription>Detailed revenue breakdown and forecasting</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="text-center p-4 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse">
                      <div className="h-8 bg-gray-200 rounded w-8 mx-auto mb-2"></div>
                      <div className="h-6 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-12 mx-auto"></div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 rounded-lg">
                    <DollarSign className="mx-auto h-8 w-8 text-blue-600 dark:text-blue-300 mb-2" />
                    <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">
                      ${metrics[0]?.value.replace('$', '') || '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Current MRR</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 rounded-lg">
                    <TrendingUp className="mx-auto h-8 w-8 text-green-600 dark:text-green-300 mb-2" />
                    <p className="text-2xl font-bold text-green-600 dark:text-green-300">
                      {metrics[0]?.change || '0%'}
                    </p>
                    <p className="text-sm text-muted-foreground">Growth Rate</p>
                  </div>
                  <div className="text-center p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 rounded-lg">
                    <Calendar className="mx-auto h-8 w-8 text-orange-600 dark:text-orange-300 mb-2" />
                    <p className="text-2xl font-bold text-orange-600 dark:text-orange-300">
                      ${metrics[0]?.value.replace('$', '') ? (parseFloat(metrics[0].value.replace('$', '').replace(',', '')) * 12).toLocaleString() : '0'}
                    </p>
                    <p className="text-sm text-muted-foreground">Annual Run Rate</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subscribers" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Subscriber Metrics</CardTitle>
                <CardDescription>Key subscriber statistics</CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex justify-between items-center animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Total Subscribers</span>
                      <span className="font-semibold">{metrics[1]?.value || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Active Subscriptions</span>
                      <span className="font-semibold">{metrics[1]?.value || '0'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Churn Rate</span>
                      <Badge variant="destructive">{metrics[3]?.value || '0%'}</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">Avg. Customer Lifetime</span>
                      <span className="font-semibold">14.2 months</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Acquisition Channels</CardTitle>
                <CardDescription>Where your subscribers come from</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Organic Search</span>
                      <span>45%</span>
                    </div>
                    <Progress value={45} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Social Media</span>
                      <span>28%</span>
                    </div>
                    <Progress value={28} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Direct Traffic</span>
                      <span>18%</span>
                    </div>
                    <Progress value={18} className="h-2" />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Referrals</span>
                      <span>9%</span>
                    </div>
                    <Progress value={9} className="h-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="products" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Product Analytics</CardTitle>
              <CardDescription>Performance metrics for your products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <PieChart className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Product analytics coming soon</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Detailed product performance metrics will be available soon
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;