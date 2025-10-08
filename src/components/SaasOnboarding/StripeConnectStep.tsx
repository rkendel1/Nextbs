"use client";
import { useState, useEffect } from "react";
import Loader from "@/components/Common/Loader";
import toast from "react-hot-toast";

interface StripeConnectStepProps {
  data: any;
  onComplete: (data: any) => void;
  onBack: () => void;
  loading: boolean;
  onSkip?: () => void;
}

const StripeConnectStep = ({ data, onComplete, onBack, loading }: StripeConnectStepProps) => {
  const [isConnected, setIsConnected] = useState(false);
  const [stripeAccountId, setStripeAccountId] = useState(data.stripeAccountId || "");

  useEffect(() => {
    // Check if we have a stripeAccountId from props or URL
    const params = new URLSearchParams(window.location.search);
    const urlStripeAccountId = params.get("stripeAccountId");
    const stripeConnected = params.get("stripeConnected");
    const stripeError = params.get("stripeError");

    if (data.stripeAccountId || (stripeConnected === "true" && urlStripeAccountId)) {
      setStripeAccountId(data.stripeAccountId || urlStripeAccountId!);
      setIsConnected(true);
      if (stripeConnected === "true") {
        toast.success("Nice! While you were connecting Stripe, we fetched your brand and company info.", {
          duration: 5000,
          icon: "✨",
        });
        // Clean up URL parameters
        const url = new URL(window.location.href);
        url.searchParams.delete("stripeConnected");
        url.searchParams.delete("stripeAccountId");
        window.history.replaceState({}, "", url.toString());
      }
    }

    // Handle error from redirect
    if (stripeError) {
      toast.error(stripeError);
      // Clean up error parameter
      const url = new URL(window.location.href);
      url.searchParams.delete("stripeError");
      window.history.replaceState({}, "", url.toString());
    }
  }, [data.stripeAccountId]);

  const handleConnectStripe = async () => {
    try {
      const response = await fetch("/api/saas/stripe-connect/authorize");
      const data = await response.json();
      
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error: any) {
      toast.error("Failed to initiate Stripe connection");
    }
  };

  const handleSkip = () => {
    onComplete({ stripeAccountId: "" });
  };

  const handleContinue = () => {
    if (!isConnected && !stripeAccountId) {
      toast.error("Please connect your Stripe account or skip this step");
      return;
    }
    onComplete({ stripeAccountId });
  };

  return (
    <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
      <h2 className="mb-3 text-center text-3xl font-bold text-dark dark:text-white">
        Connect your Stripe account
      </h2>
      <p className="mb-10 text-center text-base text-body-color dark:text-dark-6">
        Link your Stripe account to process payments from your subscribers
      </p>

      <div className="mb-8">
        {isConnected || stripeAccountId ? (
          <div className="rounded-md bg-green-50 p-6 text-center dark:bg-green-900/20">
            <svg
              className="mx-auto mb-4 h-16 w-16 text-green-600 dark:text-green-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-400">
              Stripe Account Connected
            </h3>
            <p className="text-sm text-green-600 dark:text-green-500">
              Your Stripe account is now linked and ready to process payments
            </p>
          </div>
        ) : (
          <div className="rounded-md border-2 border-dashed border-stroke p-8 text-center dark:border-dark-3">
            <div className="mb-6">
              <svg
                className="mx-auto h-20 w-20 text-body-color dark:text-dark-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
            </div>
            <button
              onClick={handleConnectStripe}
              className="inline-flex items-center justify-center rounded-md bg-[#635BFF] px-8 py-3 text-base font-semibold text-white transition hover:bg-[#0A2540]"
            >
              <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M13.976 9.15c-2.172-.806-3.356-1.426-3.356-2.409 0-.831.683-1.305 1.901-1.305 2.227 0 4.515.858 6.09 1.631l.89-5.494C18.252.975 15.697 0 12.165 0 9.667 0 7.589.654 6.104 1.872 4.56 3.147 3.757 4.992 3.757 7.218c0 4.039 2.467 5.76 6.476 7.219 2.585.92 3.445 1.574 3.445 2.583 0 .98-.84 1.545-2.354 1.545-1.875 0-4.965-.921-6.99-2.109l-.9 5.555C5.175 22.99 8.385 24 11.714 24c2.641 0 4.843-.624 6.328-1.813 1.664-1.305 2.525-3.236 2.525-5.732 0-4.128-2.524-5.851-6.594-7.305h.003z"/>
              </svg>
              Connect with Stripe
            </button>
            <p className="mt-4 text-sm text-body-color dark:text-dark-6">
              You&apos;ll be redirected to Stripe to authorize the connection
            </p>
          </div>
        )}
      </div>

      <div className="flex gap-4">
        <button
          onClick={onBack}
          disabled={loading}
          className="flex flex-1 items-center justify-center rounded-md border border-stroke bg-transparent px-5 py-3 text-base text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white disabled:opacity-50"
        >
          Back
        </button>
        <button
          onClick={handleContinue}
          disabled={loading}
          className="flex flex-1 items-center justify-center rounded-md border border-primary bg-primary px-5 py-3 text-base text-white transition duration-300 ease-in-out hover:bg-blue-dark disabled:opacity-50"
        >
          Continue {loading && <Loader />}
        </button>
      </div>

      <div className="mt-4 text-center">
        <button
          onClick={handleSkip}
          className="text-sm text-body-color hover:text-primary dark:text-dark-6 dark:hover:text-primary"
        >
          Skip for now (you can connect later)
        </button>
      </div>
    </div>
  );
};

export default StripeConnectStep;
