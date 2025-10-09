import { notFound } from 'next/navigation';
import { prisma } from '@/utils/prismaDB';

interface SaasCreator {
  id: string;
  businessName: string;
  businessDescription?: string | null;
  logoUrl?: string | null;
  primaryColor?: string | null;
  website?: string | null;
}

const CreatorEmbed = ({ saasCreator }: { saasCreator: SaasCreator }) => {
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
        {saasCreator.businessName}
      </h1>
      {saasCreator.businessDescription && (
        <p className="text-gray-700 max-w-md leading-relaxed mb-6">
          {saasCreator.businessDescription}
        </p>
      )}
      {saasCreator.website && (
        <a 
          href={saasCreator.website} 
          target="_blank" 
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline text-lg"
        >
          Visit Website
        </a>
      )}
    </div>
  );
};

export default async function CreatorEmbedPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const saasCreator = await prisma.saasCreator.findUnique({
    where: { id }
  }) as SaasCreator | null;

  if (!saasCreator) {
    notFound();
  }

  return <CreatorEmbed saasCreator={saasCreator} />;
}

export const metadata = {
  title: 'Creator Embed',
};