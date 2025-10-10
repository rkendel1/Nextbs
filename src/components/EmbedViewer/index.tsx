import React from 'react';

interface Product {
  id: string;
  name: string;
  description?: string | null;
}

interface SaasCreator {
  id: string;
  businessName: string;
  logoUrl?: string | null;
  primaryColor?: string | null;
}

interface EmbedViewerProps {
  product: Product;
  saasCreator: SaasCreator;
}

const EmbedViewer: React.FC<EmbedViewerProps> = ({ product, saasCreator }) => {
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

export { EmbedViewer };