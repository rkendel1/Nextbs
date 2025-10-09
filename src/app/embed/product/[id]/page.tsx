import { notFound } from 'next/navigation';
import { prisma } from '@/utils/prismaDB';

interface Product {
  id: string;
  name: string;
  description?: string | null;
  saasCreator: {
    id: string;
    businessName: string;
    logoUrl?: string | null;
    primaryColor?: string | null;
  } | null;
}

const EmbedViewer = ({ product, saasCreator }: { product: Product; saasCreator: Product['saasCreator'] }) => {
  const bgColor = saasCreator.primaryColor || 'white';

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4 text-center"
      style={{ backgroundColor: bgColor }}
    >
      {saasCreator.logoUrl && (
        <img 
          src={saasCreator.logoUrl} 
          alt={saasCreator.businessName}
          className="w-full max-w-xs mb-6 rounded shadow-md"
        />
      )}
      <h1 className="text-2xl font-bold mb-4 text-gray-900">
        {product.name}
      </h1>
      {product.description && (
        <p className="text-gray-700 max-w-md leading-relaxed">
          {product.description}
        </p>
      )}
    </div>
  );
};

export default async function EmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { saasCreator: true }
  }) as Product | null;

  if (!product || !product.saasCreator) {
    notFound();
  }

  return <EmbedViewer product={product} saasCreator={product.saasCreator} />;
}

export const metadata = {
  title: 'Product Embed',
};