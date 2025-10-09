"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import dynamic from "next/dynamic";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, ArrowRight, ArrowLeft, X } from "lucide-react";

// Loading placeholder component
const LoadingPlaceholder = () => (
  <div className="animate-pulse h-96 bg-gradient-subtle rounded-xl"></div>
);

const PlanSelectionStep = dynamic(() => import("./PlanSelectionStep"), {
  loading: () => <LoadingPlaceholder />,
  ssr: false
});

const BusinessInfoStep = dynamic(() => import("./BusinessInfoStep"), {
  loading: () => <LoadingPlaceholder />,
  ssr: false
});

const StripeConnectStep = dynamic(() => import("./StripeConnectStep"), {
  loading: () => <LoadingPlaceholder />,
  ssr: false
});

const CompanyInfoReviewStep = dynamic(() => import("./CompanyInfoReviewStep"), {
  loading: () => <LoadingPlaceholder />,
  ssr: false
});

const CompletionStep = dynamic(() => import("./CompletionStep"), {
  loading: () => <LoadingPlaceholder />,
  ssr: false
});

import { OnboardingStep } from "@/types/saas";

const OnboardingWizard = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(OnboardingStep.PLAN_SELECTION);
  const [loading, setLoading] = useState(true);
  const [onboardingData, setOnboardingData] = useState({
    tierId: "",
    businessName: "",
    businessDescription: "",
    website: "",
    stripeAccountId: "",
    companyAddress: "",
    contactEmail: "",
    contactPhone: "",
    primaryColor: "",
    secondaryColor: "",
    logoUrl: "",
    faviconUrl: "",
    fonts: "",
    voiceAndTone: "",
  });

  const steps = [
    { id: OnboardingStep.PLAN_SELECTION, title: "Select Plan", description: "Choose your plan" },
    { id: OnboardingStep.URL_ENTRY, title: "Enter URL", description: "Your website URL" },
    { id: OnboardingStep.STRIPE_CONNECT, title: "Connect Stripe", description: "Set up payments" },
    { id: OnboardingStep.COMPANY_INFO_REVIEW, title: "Review Info", description: "Confirm your details" },
    { id: OnboardingStep.COMPLETE, title: "Complete", description: "You're all set!" },
  ];

  // Load saved progress on mount and handle Stripe Checkout return
  useEffect(() => {
    const loadSavedProgress = async () => {
      try {
        // Check for Stripe Checkout return
        const urlParams = new URLSearchParams(window.location.search);
        const sessionId = urlParams.get('session_id');
        const stepParam = urlParams.get('step');

        if (sessionId) {
          // Verify checkout session and create subscription
          toast.loading("Verifying payment...");
          
          try {
            const verifyResponse = await fetch("/api/saas/verify-checkout", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sessionId }),
            });

            toast.dismiss();

            if (verifyResponse.ok) {
              const verifyData = await verifyResponse.json();
              toast.success("Payment successful! Continuing onboarding...");
              
              // Clean up URL
              window.history.replaceState({}, '', '/saas/onboarding');
              
              // Set step from URL param or default to URL_ENTRY (step 2)
              const nextStep = stepParam ? parseInt(stepParam) : OnboardingStep.URL_ENTRY;
              setCurrentStep(nextStep);
              setLoading(false);
              return;
            } else {
              const errorData = await verifyResponse.json();
              throw new Error(errorData.error || "Payment verification failed");
            }
          } catch (error: any) {
            console.error("Error verifying payment:", error);
            toast.dismiss();
            toast.error(error.message || "Payment verification failed. Please contact support.");
            setLoading(false);
            return;
          }
        }

        const response = await fetch("/api/saas/onboarding");
        if (!response.ok) {
          throw new Error("Failed to load onboarding progress");
        }

        const data = await response.json();
        
        // Check if onboarding is already completed
        if (data.onboardingCompleted) {
          toast.success("Onboarding already completed!");
          router.push("/dashboard");
          return;
        }
        
        if (data && data.currentStep !== undefined) {
          setCurrentStep(data.currentStep);
          setOnboardingData({
            tierId: "",
            businessName: data.saasCreator?.businessName || "",
            businessDescription: data.saasCreator?.businessDescription || "",
            website: data.saasCreator?.website || "",
            stripeAccountId: data.saasCreator?.stripeAccountId || "",
            companyAddress: data.saasCreator?.companyAddress || "",
            contactEmail: "",
            contactPhone: "",
            primaryColor: data.saasCreator?.primaryColor || "",
            secondaryColor: data.saasCreator?.secondaryColor || "",
            logoUrl: data.saasCreator?.logoUrl || "",
            faviconUrl: data.saasCreator?.faviconUrl || "",
            fonts: data.saasCreator?.fonts || "",
            voiceAndTone: data.saasCreator?.voiceAndTone || "",
          });
        }
      } catch (error: any) {
        console.error("Error loading onboarding progress:", error);
        toast.error("Failed to load saved progress");
      } finally {
        setLoading(false);
      }
    };

    loadSavedProgress();
  }, [router]);

  // Show loading state while fetching initial data
  if (loading) {
    return (
      <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-14 lg:py-20">
        <div className="container">
          <div className="mx-auto max-w-[800px]">
            <LoadingPlaceholder />
          </div>
        </div>
      </section>
    );
  }

  const handleStepComplete = async (stepData: any) => {
    const newData = { ...onboardingData, ...stepData };
    setOnboardingData(newData);
    
    try {
      setLoading(true);
      
      const response = await fetch("/api/saas/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newData,
          currentStep: currentStep + 1,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save onboarding progress");
      }

      const result = await response.json();
      
      // Check if onboarding was completed
      if (result.saasCreator?.onboardingCompleted) {
        toast.success("Onboarding completed successfully!");
        router.push("/dashboard");
        return;
      }

      if (currentStep < OnboardingStep.COMPLETE) {
        setCurrentStep(currentStep + 1);
      }
    } catch (error: any) {
      console.error("Onboarding step error:", error);
      toast.error(error.message || "Failed to save progress");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > OnboardingStep.URL_ENTRY) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = async () => {
    try {
      setLoading(true);
      
      // Save skip state
      const response = await fetch("/api/saas/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...onboardingData,
          currentStep: currentStep,
          skipForNow: true,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save skip state");
      }

      toast.success("Skipped onboarding. You can complete it later from dashboard.");
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Skip onboarding error:", error);
      toast.error("Failed to skip onboarding");
      // Still redirect to dashboard even if save fails
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.PLAN_SELECTION:
        return (
          <PlanSelectionStep
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      case OnboardingStep.URL_ENTRY:
        return (
          <BusinessInfoStep
            data={onboardingData}
            onComplete={handleStepComplete}
            loading={loading}
          />
        );
      case OnboardingStep.STRIPE_CONNECT:
        return (
          <StripeConnectStep
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
            onSkip={handleSkip}
          />
        );
      case OnboardingStep.COMPANY_INFO_REVIEW:
        return (
          <CompanyInfoReviewStep
            data={onboardingData}
            onComplete={handleStepComplete}
            onBack={handleBack}
            loading={loading}
          />
        );
      case OnboardingStep.COMPLETE:
        return <CompletionStep />;
      default:
        return null;
    }
  };

  const progress = ((currentStep - 1) / (steps.length - 1)) * 100;

  return (
    <section className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-14 lg:py-20">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12 animate-fade-in">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Let&apos;s Get You Started
            </h1>
            <p className="text-lg text-muted-foreground">
              Complete these steps to launch your SaaS business
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-12 animate-slide-up">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">{Math.round(progress)}% Complete</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Step Indicators */}
          <div className="mb-12 animate-slide-up [animation-delay:0.2s]">
            <div className="flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                        currentStep >= step.id
                          ? "bg-primary text-white"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {currentStep > step.id ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Circle className="h-5 w-5" />
                      )}
                    </div>
                    <div className="mt-2 text-center">
                      <p className={`text-sm font-medium ${currentStep >= step.id ? "text-primary" : "text-muted-foreground"}`}>
                        {step.title}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {step.description}
                      </p>
                    </div>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`flex-1 h-1 mx-4 transition-all duration-300 ${
                        currentStep > step.id ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Main Content Card */}
          <Card className="border-0 shadow-xl animate-scale-in [animation-delay:0.4s]">
            <CardContent className="p-8">
              {renderStep()}
            </CardContent>
          </Card>

          {/* Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 animate-slide-up [animation-delay:0.6s]">
            <div>
              {currentStep > OnboardingStep.PLAN_SELECTION && (
                <Button
                  variant="outline"
                  onClick={handleBack}
                  disabled={loading}
                  className="flex items-center space-x-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span>Back</span>
                </Button>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              {currentStep === OnboardingStep.STRIPE_CONNECT && (
                <Button
                  variant="ghost"
                  onClick={handleSkip}
                  className="flex items-center space-x-2"
                >
                  <X className="h-4 w-4" />
                  <span>Skip for now</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default OnboardingWizard;