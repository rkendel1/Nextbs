"use client";

const Documentation = () => {
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <section className="bg-[#F4F7FF] py-14 dark:bg-dark lg:py-20">
      <div className="container">
        <div className="mb-12">
          <h1 className="mb-4 text-4xl font-bold text-dark dark:text-white lg:text-5xl">
            API Documentation
          </h1>
          <p className="text-lg text-body-color dark:text-dark-6">
            Learn how to integrate your SaaS product with our platform
          </p>
        </div>

        <div className="space-y-8">
          {/* Getting Started */}
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
            <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">
              Getting Started
            </h2>
            <div className="space-y-4 text-base text-body-color dark:text-dark-6">
              <p>
                Welcome to the SaaS for SaaS platform API documentation. This guide will help you integrate your SaaS product with our platform to manage subscriptions, track usage, and process payments.
              </p>
              <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                <h3 className="mb-2 text-sm font-semibold text-blue-900 dark:text-blue-300">
                  Prerequisites
                </h3>
                <ul className="list-inside list-disc space-y-1 text-sm text-blue-800 dark:text-blue-400">
                  <li>Complete the onboarding process</li>
                  <li>Connect your Stripe account</li>
                  <li>Create at least one product with pricing tiers</li>
                  <li>Configure usage metering (if applicable)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
            <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">
              Authentication
            </h2>
            <p className="mb-4 text-base text-body-color dark:text-dark-6">
              All API requests require authentication using an API key. Include your API key in the request headers:
            </p>
            <div className="relative">
              <pre className="overflow-x-auto rounded-lg bg-dark p-4 text-sm text-white dark:bg-dark-3">
                <code>{`headers: {
  "x-api-key": "your-api-key-here",
  "Content-Type": "application/json"
}`}</code>
              </pre>
              <button
                onClick={() => copyToClipboard('headers: {\n  "x-api-key": "your-api-key-here",\n  "Content-Type": "application/json"\n}')}
                className="absolute right-4 top-4 text-xs text-white hover:text-primary"
              >
                Copy
              </button>
            </div>
            <p className="mt-4 text-sm text-body-color dark:text-dark-6">
              You can generate API keys from your dashboard settings.
            </p>
          </div>

          {/* Usage Tracking */}
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
            <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">
              Track Usage
            </h2>
            <p className="mb-4 text-base text-body-color dark:text-dark-6">
              Report usage for consumption-based billing or metering:
            </p>
            
            <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">
              POST /api/saas/usage
            </h3>
            
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-dark dark:text-white">Request Body:</h4>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-dark p-4 text-sm text-white dark:bg-dark-3">
                  <code>{`{
  "subscriptionId": "sub_xxxxxxxxxxxxx",
  "userId": "user_xxxxxxxxxxxxx",
  "quantity": 100,
  "metadata": {
    "endpoint": "/api/users",
    "method": "GET"
  }
}`}</code>
                </pre>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-dark dark:text-white">Response:</h4>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-dark p-4 text-sm text-white dark:bg-dark-3">
                  <code>{`{
  "success": true,
  "usageRecord": {
    "id": "usage_xxxxxxxxxxxxx",
    "quantity": 100,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Get Usage Statistics */}
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
            <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">
              Get Usage Statistics
            </h2>
            
            <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">
              GET /api/saas/usage
            </h3>
            
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-dark dark:text-white">Query Parameters:</h4>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b border-stroke dark:border-dark-3">
                    <tr>
                      <th className="pb-3 pr-4 font-medium text-dark dark:text-white">Parameter</th>
                      <th className="pb-3 pr-4 font-medium text-dark dark:text-white">Type</th>
                      <th className="pb-3 font-medium text-dark dark:text-white">Description</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stroke dark:divide-dark-3">
                    <tr>
                      <td className="py-3 pr-4 text-body-color dark:text-dark-6">subscriptionId</td>
                      <td className="py-3 pr-4 text-body-color dark:text-dark-6">string</td>
                      <td className="py-3 text-body-color dark:text-dark-6">Filter by subscription ID</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-body-color dark:text-dark-6">userId</td>
                      <td className="py-3 pr-4 text-body-color dark:text-dark-6">string</td>
                      <td className="py-3 text-body-color dark:text-dark-6">Filter by user ID</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-body-color dark:text-dark-6">startDate</td>
                      <td className="py-3 pr-4 text-body-color dark:text-dark-6">ISO 8601</td>
                      <td className="py-3 text-body-color dark:text-dark-6">Start date for filtering</td>
                    </tr>
                    <tr>
                      <td className="py-3 pr-4 text-body-color dark:text-dark-6">endDate</td>
                      <td className="py-3 pr-4 text-body-color dark:text-dark-6">ISO 8601</td>
                      <td className="py-3 text-body-color dark:text-dark-6">End date for filtering</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-medium text-dark dark:text-white">Example Response:</h4>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-dark p-4 text-sm text-white dark:bg-dark-3">
                  <code>{`{
  "totalUsage": 5000,
  "recordCount": 50,
  "records": [
    {
      "id": "usage_xxxxxxxxxxxxx",
      "quantity": 100,
      "timestamp": "2024-01-15T10:30:00Z",
      "metadata": {}
    }
  ]
}`}</code>
                </pre>
              </div>
            </div>
          </div>

          {/* Webhooks */}
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
            <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">
              Webhooks
            </h2>
            <p className="mb-4 text-base text-body-color dark:text-dark-6">
              Configure webhook URLs in your product&apos;s metering settings to receive real-time usage notifications:
            </p>
            
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-medium text-dark dark:text-white">Webhook Payload:</h4>
              <div className="relative">
                <pre className="overflow-x-auto rounded-lg bg-dark p-4 text-sm text-white dark:bg-dark-3">
                  <code>{`{
  "subscriptionId": "sub_xxxxxxxxxxxxx",
  "userId": "user_xxxxxxxxxxxxx",
  "quantity": 100,
  "timestamp": "2024-01-15T10:30:00Z",
  "metadata": {}
}`}</code>
                </pre>
              </div>
            </div>

            <div className="rounded-lg bg-yellow-50 p-4 dark:bg-yellow-900/20">
              <h3 className="mb-2 text-sm font-semibold text-yellow-900 dark:text-yellow-300">
                Important
              </h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-400">
                Ensure your webhook endpoint responds with a 2xx status code within 10 seconds. Failed webhooks will be retried up to 3 times with exponential backoff.
              </p>
            </div>
          </div>

          {/* Code Examples */}
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
            <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">
              Code Examples
            </h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">
                  JavaScript / Node.js
                </h3>
                <div className="relative">
                  <pre className="overflow-x-auto rounded-lg bg-dark p-4 text-sm text-white dark:bg-dark-3">
                    <code>{`// Track usage
const trackUsage = async (subscriptionId, userId, quantity) => {
  const response = await fetch('https://yourplatform.com/api/saas/usage', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.SAAS_API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      subscriptionId,
      userId,
      quantity,
      metadata: {
        timestamp: new Date().toISOString()
      }
    })
  });
  
  return response.json();
};

// Get usage statistics
const getUsage = async (subscriptionId) => {
  const response = await fetch(
    \`https://yourplatform.com/api/saas/usage?subscriptionId=\${subscriptionId}\`,
    {
      headers: {
        'x-api-key': process.env.SAAS_API_KEY
      }
    }
  );
  
  return response.json();
};`}</code>
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="mb-3 text-lg font-semibold text-dark dark:text-white">
                  Python
                </h3>
                <div className="relative">
                  <pre className="overflow-x-auto rounded-lg bg-dark p-4 text-sm text-white dark:bg-dark-3">
                    <code>{`import requests
import os

# Track usage
def track_usage(subscription_id, user_id, quantity):
    response = requests.post(
        'https://yourplatform.com/api/saas/usage',
        headers={
            'x-api-key': os.environ['SAAS_API_KEY'],
            'Content-Type': 'application/json'
        },
        json={
            'subscriptionId': subscription_id,
            'userId': user_id,
            'quantity': quantity
        }
    )
    return response.json()

# Get usage statistics
def get_usage(subscription_id):
    response = requests.get(
        f'https://yourplatform.com/api/saas/usage?subscriptionId={subscription_id}',
        headers={
            'x-api-key': os.environ['SAAS_API_KEY']
        }
    )
    return response.json()`}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>

          {/* Support */}
          <div className="rounded-xl bg-white p-8 shadow-lg dark:bg-dark-2">
            <h2 className="mb-4 text-2xl font-bold text-dark dark:text-white">
              Need Help?
            </h2>
            <p className="mb-4 text-base text-body-color dark:text-dark-6">
              If you need assistance integrating with our platform, we&apos;re here to help:
            </p>
            <div className="flex gap-4">
              <a
                href="/contact"
                className="inline-flex items-center rounded-md border border-primary bg-primary px-6 py-3 text-base font-medium text-white transition hover:bg-blue-dark"
              >
                Contact Support
              </a>
              <a
                href="/dashboard"
                className="inline-flex items-center rounded-md border border-stroke px-6 py-3 text-base font-medium text-dark transition hover:border-primary hover:text-primary dark:border-dark-3 dark:text-white dark:hover:border-primary dark:hover:text-primary"
              >
                Go to Dashboard
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Documentation;
