"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import BusinessInfoStep from "./BusinessInfoStep";
import StripeConnectStep from "./StripeConnectStep";
import ProductSetupStep from "./ProductSetupStep";
import CompletionStep from "./CompletionStep";
import { OnboardingStep } from "@/types/saas";

const OnboardingWizard = () => {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<number>(OnboardingStep.BUSINESS_INFO);
  const [loading, setLoading] = useState(false);
  const [onboardingData, setOnboardingData] = useState({
    businessName: "",
    businessDescription: "",
    website: "",
    stripeAccountId: "",
    productName: "",
    productDescription: "",
  });

  const handleStepComplete = async (stepData: any) => {
    setOnboardingData({ ...onboardingData, ...stepData });
    
    try {
      setLoading(true);
      
      // Save progress to backend
      const response = await fetch("/api/saas/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...onboardingData,
          ...stepData,
          currentStep: currentStep + 1,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to save onboarding progress");
      }

      // Move to next step
      if (currentStep < OnboardingStep.COMPLETE) {
        setCurrentStep(currentStep + 1);
      } else {
        toast.success("Onboarding completed successfully!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to save progress");
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    if (currentStep > OnboardingStep.BUSINESS_INFO) {
      setCurrentStep(currentStep - 1);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case OnboardingStep.BUSINESS_INFO:
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
          />
        );
      case OnboardingStep.PRODUCT_SETUP:
        return (
          <ProductSetupStep
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

  return (
    <section className="bg-[#F4F7FF] py-14 dark:bg-dark lg:py-20">
      <div className="container">
        {/* Progress Indicator */}
        <div className="mx-auto mb-12 max-w-[800px]">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex flex-1 items-center">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full ${
                    currentStep >= step
                      ? "bg-primary text-white"
                      : "bg-gray-200 text-gray-600 dark:bg-dark-3 dark:text-gray-400"
                  }`}
                >
                  {step}
                </div>
                {step < 4 && (
                  <div
                    className={`h-1 flex-1 ${
                      currentStep > step
                        ? "bg-primary"
                        : "bg-gray-200 dark:bg-dark-3"
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-4 flex justify-between text-sm">
            <span className={currentStep >= 1 ? "text-primary font-medium" : "text-gray-600 dark:text-gray-400"}>
              Business Info
            </span>
            <span className={currentStep >= 2 ? "text-primary font-medium" : "text-gray-600 dark:text-gray-400"}>
              Connect Stripe
            </span>
            <span className={currentStep >= 3 ? "text-primary font-medium" : "text-gray-600 dark:text-gray-400"}>
              Product Setup
            </span>
            <span className={currentStep >= 4 ? "text-primary font-medium" : "text-gray-600 dark:text-gray-400"}>
              Complete
            </span>
          </div>
        </div>

        {/* Step Content */}
        <div className="mx-auto max-w-[800px]">
          {renderStep()}
        </div>
      </div>
    </section>
  );
};

export default OnboardingWizard;
