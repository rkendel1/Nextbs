"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import DashboardStats from "./DashboardStats";
import ProductsList from "./ProductsList";
import RecentSubscribers from "./RecentSubscribers";
import Loader from "@/components/Common/Loader";

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
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      checkOnboardingStatus();
    }
  }, [status]);

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
      setStats(data.stats || stats);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  return (
    <section className="bg-[#F4F7FF] py-14 dark:bg-dark lg:py-20">
      <div className="container">
        {/* Header */}
        <div className="mb-12">
          <h1 className="mb-3 text-3xl font-bold text-dark dark:text-white lg:text-4xl">
            Welcome back, {saasCreator?.businessName || "Creator"}
          </h1>
          <p className="text-base text-body-color dark:text-dark-6">
            Manage your products, subscribers, and analytics from your dashboard
          </p>
        </div>

        {/* Stats Grid */}
        <DashboardStats stats={stats} />

        {/* Main Content Grid */}
        <div className="mt-12 grid gap-8 lg:grid-cols-3">
          {/* Products Section - Takes 2 columns */}
          <div className="lg:col-span-2">
            <ProductsList onUpdate={fetchDashboardData} />
          </div>

          {/* Sidebar - Recent Subscribers */}
          <div className="lg:col-span-1">
            <RecentSubscribers />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Dashboard;
