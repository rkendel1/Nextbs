"use client";
import { useState } from "react";
import Link from "next/link";
import toast from "react-hot-toast";

interface UpgradeModalProps {
  onClose: () => void;
  limitType: string; // e.g., "products", "subscribers"
}

const UpgradeModal = ({ onClose, limitType }: UpgradeModalProps) => {
  const [isOpen, setIsOpen] = useState(true);

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(onClose, 300); // Delay for animation
  };

  const limitText = limitType === "products" ? "add more products" : "unlock advanced features";

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="mx-4 max-w-md rounded-lg bg-white p-6 shadow-xl dark:bg-dark-2 md:p-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Upgrade Required
              </h3>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              >
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="mb-6 text-base text-body-color dark:text-dark-6">
              You've reached the free plan limit for {limitType}. Upgrade to Pro to {limitText} and unlock unlimited features.
            </p>
            <div className="space-y-3">
              <Link
                href="/pricing"
                className="block w-full rounded-md bg-primary px-4 py-3 text-center text-base font-medium text-white transition hover:bg-blue-dark"
                onClick={handleClose}
              >
                Upgrade to Pro
              </Link>
              <button
                onClick={handleClose}
                className="block w-full rounded-md border border-stroke px-4 py-3 text-center text-base font-medium text-dark transition hover:bg-gray-50 dark:border-dark-3 dark:text-white dark:hover:bg-dark-1"
              >
                Maybe Later
              </button>
            </div>
            <p className="mt-4 text-xs text-body-color dark:text-dark-6 text-center">
              Pro plan starts at $29/month with unlimited {limitType} and priority support.
            </p>
          </div>
        </div>
      )}
    </>
  );
};

export default UpgradeModal;