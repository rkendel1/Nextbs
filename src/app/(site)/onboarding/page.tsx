"use client";

import { Suspense } from "react";
import dynamic from "next/dynamic";
import { Metadata } from "next";

const OnboardingWizard = dynamic(
  () => import("@/components/SaasOnboarding"),
  {
    loading: () => (
      <div className="flex h-screen items-center justify-center">
        <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
      </div>
    ),
    ssr: false
  }
);

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center">
          <div className="h-32 w-32 animate-spin rounded-full border-b-2 border-primary"></div>
        </div>
      }
    >
      <OnboardingWizard />
    </Suspense>
  );
}