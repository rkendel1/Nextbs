import { notFound } from 'next/navigation';
import { prisma } from '@/utils/prismaDB';
import WhiteLabelLayout from '@/components/WhiteLabel/WhiteLabelLayout';

interface PaymentSuccessPageProps {
  params: { domain: string };
  searchParams: { session_id?: string };
}

export default async function PaymentSuccessPage({ params, searchParams }: PaymentSuccessPageProps) {
  const { domain } = params;
  const { session_id } = searchParams;

  // Fetch whiteLabelConfig by domain
  const whiteLabelConfig = await prisma.whiteLabelConfig.findFirst({
    where: {
      OR: [
        { customDomain: domain },
        { subdomain: domain }
      ]
    },
    include: {
      saasCreator: {
        include: {
          products: true,
          stripeAccount: true,
        },
      },
    },
  });

  if (!whiteLabelConfig || !whiteLabelConfig.saasCreator) {
    notFound();
  }

  // Optional: Verify session if session_id provided
  let subscriptionDetails = null;
  if (session_id) {
    try {
      const response = await fetch(`${process.env.SITE_URL || 'http://localhost:3001'}/api/saas/verify-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id }),
      });
      if (response.ok) {
        const data = await response.json();
        subscriptionDetails = {
          status: data.status || 'active',
          product: data.productName || 'Product',
          tier: data.tierName || 'Standard',
        };
      }
    } catch (error) {
      console.error('Session verification failed:', error);
    }
  }

  return (
    <WhiteLabelLayout domain={domain}>
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
              Payment Successful!
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              Thank you for subscribing to {subscriptionDetails?.product || 'our product'}.
              {subscriptionDetails && (
                <span> Your {subscriptionDetails.tier} plan is now active.</span>
              )}
            </p>
            {session_id && (
              <p className="mt-1 text-center text-sm text-green-600">
                Session ID: {session_id.slice(-8)} (verified)
              </p>
            )}
          </div>
          <div className="mt-8">
            <a
              href={`/${domain}/products`}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              View Your Products
            </a>
          </div>
          <p className="text-center text-xs text-gray-500">
            Questions? Contact support.
          </p>
        </div>
      </div>
    </WhiteLabelLayout>
  );
}