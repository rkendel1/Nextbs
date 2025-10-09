import { prisma } from '@/utils/prismaDB';

interface PlatformStats {
  totalCreators: number;
  totalProducts: number;
  totalSubscribers: number;
}

const PlatformEmbed = ({ stats }: { stats: PlatformStats }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
      <div className="max-w-md w-full space-y-6">
        <h1 className="text-2xl font-bold text-center text-gray-900">Platform Overview</h1>
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Total Creators</h2>
            <p className="text-3xl font-bold text-blue-600">{stats.totalCreators}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Total Products</h2>
            <p className="text-3xl font-bold text-green-600">{stats.totalProducts}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow-md border">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Total Subscribers</h2>
            <p className="text-3xl font-bold text-purple-600">{stats.totalSubscribers}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default async function PlatformEmbedPage() {
  const [totalCreators, totalProducts, totalSubscribers] = await Promise.all([
    prisma.saasCreator.count(),
    prisma.product.count(),
    prisma.subscription.count({ where: { status: 'active' } })
  ]);

  const stats: PlatformStats = {
    totalCreators,
    totalProducts,
    totalSubscribers
  };

  return <PlatformEmbed stats={stats} />;
}

export const metadata = {
  title: 'Platform Embed',
};