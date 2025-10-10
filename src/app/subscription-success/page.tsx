import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SubscriptionSuccessPage() {
  const session = await getServerSession();

  if (!session) {
    redirect(`/auth/signin?callbackUrl=%2Fpayment-success`);
  }

  return (
    <section className="bg-[#F4F7FF] py-14 dark:bg-dark lg:py-20">
      <div className="container">
        <div className="mx-auto max-w-[800px] text-center">
          <div className="mx-auto mb-8 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary text-white">
            ✓
          </div>
          <h1 className="mb-4 text-3xl font-bold text-dark dark:text-white sm:text-4xl md:text-5xl">
            Subscription Successful!
          </h1>
          <p className="mb-8 text-base text-body-color dark:text-body-color-dark">
            Congratulations! Your subscription is now active. You're one step away from launching as a creator.
          </p>
          
          <div className="mb-12 rounded-lg bg-white p-8 shadow-lg dark:bg-dark-3">
            <h2 className="mb-4 text-xl font-semibold text-dark dark:text-white">
              What to Expect in Onboarding
            </h2>
            <ul className="mb-6 space-y-3 text-left text-base text-body-color dark:text-body-color-dark">
              <li className="flex items-start">
                <span className="mr-3 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-primary text-white text-xs">1</span>
                <span>Enter your business details (2 mins) – Tell us about your SaaS venture.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-primary text-white text-xs">2</span>
                <span>Connect Stripe for payouts (3 mins) – Securely link your account to receive earnings.</span>
              </li>
              <li className="flex items-start">
                <span className="mr-3 mt-0.5 inline-flex h-5 w-5 items-center justify-center rounded bg-primary text-white text-xs">3</span>
                <span>Set up your first product (5 mins) – Configure pricing and features to start selling.</span>
              </li>
            </ul>
            <p className="text-base text-body-color dark:text-body-color-dark">
              Total time: ~10 minutes. Once complete, you'll unlock full creator tools in your dashboard.
            </p>
          </div>

          <Link
            href="/saas/onboarding"
            className="inline-flex items-center justify-center rounded-full bg-primary px-8 py-4 text-base font-semibold text-white transition duration-300 ease-in-out hover:bg-opacity-90"
          >
            Start Onboarding Now
          </Link>
        </div>
      </div>
    </section>
  );
}