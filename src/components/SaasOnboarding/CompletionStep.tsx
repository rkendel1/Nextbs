"use client";
import Link from "next/link";

const CompletionStep = () => {
  return (
    <div className="rounded-xl bg-white px-8 py-10 shadow-lg dark:bg-dark-2 sm:px-12 md:px-16">
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
          <svg
            className="h-16 w-16 text-green-600 dark:text-green-400"
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
        </div>

        <h2 className="mb-4 text-3xl font-bold text-dark dark:text-white">
          Welcome to SaaS for SaaS! 🎉
        </h2>
        
        <p className="mb-8 text-lg text-body-color dark:text-dark-6">
          Your account is now set up. You&apos;re ready to start managing your SaaS products and subscribers.
        </p>

        <div className="mb-10 grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-stroke bg-gray-50 p-6 dark:border-dark-3 dark:bg-dark">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
              Add Products
            </h3>
            <p className="text-sm text-body-color dark:text-dark-6">
              Create and manage your SaaS products and pricing tiers
            </p>
          </div>

          <div className="rounded-lg border border-stroke bg-gray-50 p-6 dark:border-dark-3 dark:bg-dark">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
              Manage Subscribers
            </h3>
            <p className="text-sm text-body-color dark:text-dark-6">
              View and manage your customer subscriptions
            </p>
          </div>

          <div className="rounded-lg border border-stroke bg-gray-50 p-6 dark:border-dark-3 dark:bg-dark">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <svg className="h-6 w-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-dark dark:text-white">
              Track Usage
            </h3>
            <p className="text-sm text-body-color dark:text-dark-6">
              Monitor usage metrics and metering data
            </p>
          </div>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center justify-center rounded-md border border-primary bg-primary px-8 py-3 text-base font-medium text-white transition duration-300 ease-in-out hover:bg-blue-dark"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
};

export default CompletionStep;
