import { notFound } from 'next/navigation';
import { prisma } from '@/utils/prismaDB';
import EmbedViewer from '@/components/EmbedViewer';

interface ProductDetailsProps {
  params: {
    domain: string;
    id: string;
  };
}

export default async function ProductDetails({ params }: ProductDetailsProps) {
  const { domain, id } = params;

  const product = await prisma.product.findUnique({
    where: { id },
    include: { tiers: true },
  });

  if (!product) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
      <p className="text-lg mb-8">{product.description}</p>
      
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-4">Pricing</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {product.tiers.map((tier) => (
            <div key={tier.id} className="bg-white shadow-lg rounded-lg p-6">
              <h3 className="text-xl font-semibold mb-4">{tier.name}</h3>
              <p className="text-gray-600 mb-4">{tier.description}</p>
              <div className="text-2xl font-bold">${tier.priceAmount / 100}/month</div>
            </div>
          ))}
        </div>
      </div>

      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Embed Code</h2>
        <EmbedViewer productId={product.id} />
      </div>
    </div>
  );
}