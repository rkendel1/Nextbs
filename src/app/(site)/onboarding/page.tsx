import OnboardingWizard from "@/components/SaasOnboarding";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "SaaS Onboarding | SaaS for SaaS Platform",
  description: "Complete your SaaS creator onboarding",
};

const OnboardingPage = () => {
  return <OnboardingWizard />;
};

export default OnboardingPage;
