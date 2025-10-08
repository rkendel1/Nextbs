"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Zap, Shield, BarChart3, Users, CreditCard, Rocket, Check } from "lucide-react";
import { getAllPosts } from "@/utils/markdown";

export default function Home() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [onboardingData, setOnboardingData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signup");
  const [tiers, setTiers] = useState<any[]>([]);
  const [tiersLoading, setTiersLoading] = useState(true);

  useEffect(() => {
    const checkOnboardingStatus = async () => {
      if (status === "authenticated" && session?.user?.email) {
        try {
          const response = await fetch("/api/saas/onboarding");
          const data = await response.json();

          if (data.onboardingCompleted) {
            router.push("/dashboard");
            return;
          }
          
          setOnboardingData(data);
        } catch (error) {
          console.error("Error checking onboarding status:", error);
        }
      }
      setLoading(false);
    };

    checkOnboardingStatus();
  }, [status, session, router]);

  // Fetch dynamic pricing tiers from platform owner
  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const response = await fetch("/api/saas/tiers");
        const data = await response.json();
        
        if (data.tiers && data.tiers.length > 0) {
          setTiers(data.tiers);
        } else {
          // Fallback to hardcoded tiers if no platform owner tiers exist
          setTiers([]);
        }
      } catch (error) {
        console.error("Error fetching tiers:", error);
        setTiers([]);
      } finally {
        setTiersLoading(false);
      }
    };

    fetchTiers();
  }, []);

  // Show loading state while checking authentication
  if (status === "loading" || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show onboarding for authenticated users with incomplete onboarding
  if (status === "authenticated" && onboardingData && !onboardingData.onboardingCompleted) {
    const OnboardingWizard = dynamic(() => import("@/components/SaasOnboarding"), {
      loading: () => (
        <div className="animate-pulse h-96 bg-gray-100 dark:bg-dark-3 rounded-xl"></div>
      ),
    });
    return <OnboardingWizard />;
  }

  const handleGetStarted = () => {
    if (session?.user) {
      router.push("/dashboard");
    } else {
      setAuthMode("signup");
      setShowAuthModal(true);
    }
  };

  const features = [
    {
      icon: <Zap className="h-6 w-6 text-primary" />,
      title: "Lightning Fast Setup",
      description: "Get your SaaS running in minutes, not months. Our streamlined onboarding gets you from zero to hero.",
    },
    {
      icon: <Shield className="h-6 w-6 text-primary" />,
      title: "Enterprise Security",
      description: "Built with security-first architecture. Your data is protected with industry-leading standards.",
    },
    {
      icon: <BarChart3 className="h-6 w-6 text-primary" />,
      title: "Real-time Analytics",
      description: "Track your growth with comprehensive analytics and insights that matter to your business.",
    },
    {
      icon: <Users className="h-6 w-6 text-primary" />,
      title: "Customer Management",
      description: "Manage your customers with powerful tools designed for modern SaaS businesses.",
    },
    {
      icon: <CreditCard className="h-6 w-6 text-primary" />,
      title: "Payment Processing",
      description: "Integrated Stripe payments with subscription management and automated billing.",
    },
    {
      icon: <Rocket className="h-6 w-6 text-primary" />,
      title: "Scale Effortlessly",
      description: "Built to scale from day one. Handle thousands of customers without breaking a sweat.",
    },
  ];

  const pricingPlans = [
    {
      name: "Starter",
      price: "$29",
      description: "Perfect for getting started",
      features: ["Up to 100 customers", "Basic analytics", "Email support", "1GB storage"],
      popular: false,
    },
    {
      name: "Professional",
      price: "$79",
      description: "For growing businesses",
      features: ["Up to 1,000 customers", "Advanced analytics", "Priority support", "10GB storage", "API access"],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "$199",
      description: "For established companies",
      features: ["Unlimited customers", "Custom analytics", "24/7 support", "Unlimited storage", "Full API access", "Custom integrations"],
      popular: false,
    },
  ];

  // Show landing page for non-authenticated users
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-6 animate-fade-in">
              <Rocket className="h-3 w-3 mr-1" />
              Launch Your SaaS Today
            </Badge>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-orange-500 bg-clip-text text-transparent animate-slide-up">
              Build Your SaaS Empire
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up [animation-delay:0.2s]">
              Everything you need to launch, manage, and scale your SaaS business. 
              From payments to customer management, we&apos;ve got you covered.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up [animation-delay:0.4s]">
              <Button 
                size="lg" 
                onClick={handleGetStarted}
                className="bg-primary hover:bg-primary/90 text-white px-8"
              >
                Get Started Free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline" className="px-8">
                View Demo
              </Button>
            </div>
          </div>
        </div>
        
        {/* Animated background elements */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-blue-400/20 to-orange-400/20 rounded-full blur-3xl animate-pulse"></div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Everything You Need to Succeed
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you build, launch, and grow your SaaS business.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 animate-scale-in">
                <CardHeader>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 lg:py-32 bg-gradient-to-br from-gray-50 to-blue-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose the perfect plan for your business. Scale as you grow with no hidden fees.
            </p>
          </div>
          
          {tiersLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : tiers.length > 0 ? (
            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {tiers.map((tier, index) => (
                <Card key={tier.id} className={`relative border-2 ${index === 1 ? 'border-primary shadow-xl' : 'border-border'} hover:shadow-xl transition-all duration-300`}>
                  {index === 1 && (
                    <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                      Most Popular
                    </Badge>
                  )}
                  <CardHeader className="text-center">
                    <CardTitle className="text-2xl">{tier.nickname}</CardTitle>
                    <CardDescription className="text-base">{tier.product?.description || 'Premium features'}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">${(tier.unit_amount / 100).toFixed(0)}</span>
                      <span className="text-muted-foreground">/month</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {tier.offers?.map((offer: string, idx: number) => (
                        <li key={idx} className="flex items-center">
                          <Check className="h-4 w-4 text-primary mr-3" />
                          <span>{offer}</span>
                        </li>
                      ))}
                    </ul>
                    <Button 
                      className="w-full mt-6"
                      variant={index === 1 ? "default" : "outline"}
                      onClick={handleGetStarted}
                    >
                      Get Started
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No pricing plans available yet. Please check back later!</p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 lg:py-32 bg-primary text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Launch Your SaaS?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto text-primary-foreground/90">
            Join thousands of entrepreneurs who have already built successful SaaS businesses with our platform.
          </p>
          <Button 
            size="lg" 
            onClick={handleGetStarted}
            className="bg-white text-primary hover:bg-gray-100 px-8"
          >
            Get Started Free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </section>

      {/* Auth Panel - Slides in from right side */}
      {showAuthModal && (
        <>
          {/* Backdrop overlay */}
          <div 
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setShowAuthModal(false)}
          />
          
          {/* Sliding panel from right */}
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card shadow-2xl transform transition-transform duration-500 ease-out animate-slide-in-right">
            <div className="h-full flex flex-col">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b">
                <h2 className="text-xl font-semibold">
                  {authMode === "signin" ? "Welcome Back" : "Create Account"}
                </h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowAuthModal(false)}
                  className="auth-button-hover"
                >
                  ×
                </Button>
              </div>
              
              {/* Content */}
              <div className="flex-1 overflow-y-auto p-6">
                <p className="text-muted-foreground mb-6">
                  {authMode === "signin"
                    ? "Sign in to your account to continue"
                    : "Create your account to get started"}
                </p>
                
                {/* Social Sign In */}
                <div className="space-y-3 mb-6">
                  <Button className="w-full" variant="outline" onClick={() => window.location.href = '/api/auth/signin/google'}>
                    Continue with Google
                  </Button>
                  <Button className="w-full" variant="outline" onClick={() => window.location.href = '/api/auth/signin/github'}>
                    Continue with GitHub
                  </Button>
                </div>
                
                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      Or continue with
                    </span>
                  </div>
                </div>
                
                {/* Email/Password Form */}
                <form className="space-y-4" onSubmit={(e) => {
                  e.preventDefault();
                  // Basic form submission - redirect to actual auth pages
                  window.location.href = authMode === 'signin' ? '/auth/signin' : '/auth/signup';
                }}>
                  <div>
                    <input
                      type="email"
                      placeholder="Email"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm auth-input-focus"
                      required
                    />
                  </div>
                  {authMode === 'signup' && (
                    <div>
                      <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm auth-input-focus"
                        required
                      />
                    </div>
                  )}
                  <div>
                    <input
                      type="password"
                      placeholder="Password"
                      className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm auth-input-focus"
                      required
                    />
                  </div>
                  <Button type="submit" className="w-full auth-button-hover">
                    {authMode === "signin" ? "Sign In" : "Sign Up"}
                  </Button>
                </form>
                
                <p className="text-center text-sm text-muted-foreground mt-6">
                  {authMode === "signin" ? "Don't have an account?" : "Already have an account?"}{" "}
                  <button
                    onClick={() => setAuthMode(authMode === "signin" ? "signup" : "signin")}
                    className="text-primary hover:underline font-medium"
                  >
                    {authMode === "signin" ? "Sign Up" : "Sign In"}
                  </button>
                </p>
                
                {/* Additional links */}
                <div className="mt-4 text-center">
                  <Link href="/forgot-password" className="text-xs text-muted-foreground hover:text-primary">
                    Forgot password?
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </main>
  );
}