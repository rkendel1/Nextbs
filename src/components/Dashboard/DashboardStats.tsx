interface DashboardStatsProps {
  stats: {
    totalProducts: number;
    totalSubscribers: number;
    activeSubscriptions: number;
    monthlyRevenue: number;
    mrr: number;
    arr: number;
    totalRevenue: number;
    churnRate: string;
  };
}

const DashboardStats = ({ stats }: DashboardStatsProps) => {
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total Products */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-900/20">
          <svg
            className="h-6 w-6 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          {stats.totalProducts}
        </h3>
        <p className="text-sm text-body-color dark:text-dark-6">Total Products</p>
      </div>

      {/* Total Subscribers */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-50 dark:bg-green-900/20">
          <svg
            className="h-6 w-6 text-green-600 dark:text-green-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          {stats.totalSubscribers}
        </h3>
        <p className="text-sm text-body-color dark:text-dark-6">Total Subscribers</p>
      </div>

      {/* Active Subscriptions */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20">
          <svg
            className="h-6 w-6 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          {stats.activeSubscriptions}
        </h3>
        <p className="text-sm text-body-color dark:text-dark-6">
          Active Subscriptions
        </p>
      </div>

      {/* Monthly Revenue */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-yellow-50 dark:bg-yellow-900/20">
          <svg
            className="h-6 w-6 text-yellow-600 dark:text-yellow-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          ${(stats.monthlyRevenue / 100).toLocaleString()}
        </h3>
        <p className="text-sm text-body-color dark:text-dark-6">Monthly Revenue</p>
      </div>

      {/* MRR */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-50 dark:bg-indigo-900/20">
          <svg
            className="h-6 w-6 text-indigo-600 dark:text-indigo-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          ${(stats.mrr / 100).toLocaleString()}
        </h3>
        <p className="text-sm text-body-color dark:text-dark-6">MRR</p>
      </div>

      {/* ARR */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-purple-50 dark:bg-purple-900/20">
          <svg
            className="h-6 w-6 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          ${(stats.arr / 100).toLocaleString()}
        </h3>
        <p className="text-sm text-body-color dark:text-dark-6">ARR</p>
      </div>

      {/* Total Revenue */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-900/20">
          <svg
            className="h-6 w-6 text-red-600 dark:text-red-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h3 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          ${(stats.totalRevenue / 100).toLocaleString()}
        </h3>
        <p className="text-sm text-body-color dark:text-dark-6">Total Revenue</p>
      </div>

      {/* Churn Rate */}
      <div className="rounded-xl bg-white p-6 shadow-lg dark:bg-dark-2">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-orange-50 dark:bg-orange-900/20">
          <svg
            className="h-6 w-6 text-orange-600 dark:text-orange-400"
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
        <h3 className="mb-2 text-2xl font-bold text-dark dark:text-white">
          {stats.churnRate}%
        </h3>
        <p className="text-sm text-body-color dark:text-dark-6">Churn Rate (30d)</p>
      </div>
    </div>
  );
};

export default DashboardStats;
