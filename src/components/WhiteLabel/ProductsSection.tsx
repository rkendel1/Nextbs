"use client";
import Link from "next/link";
import Image from "next/image";

interface Product {
  id: string;
  name: string;
  description?: string;
  tiers: Array<{
    id: string;
    name: string;
    priceAmount: number;
    billingPeriod: string;
    features: string[];
  }>;
}

interface ProductsSectionProps {
  products: Product[];
  primaryColor: string;
}

const ProductsSection = ({ products, primaryColor }: ProductsSectionProps) => {
  return (
    <section className="py-[var(--space-3)]" style={{ backgroundColor: 'var(--color-secondary)' }}>
      <div className="max-w-7xl mx-auto px-[var(--space-3)] sm:px-[var(--space-3)] lg:px-[var(--space-3)]">
        <div className="text-center mb-[var(--space-3)]">
          <h2 className="text-[var(--font-size-heading)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] mb-[var(--space-1)]">
            Our Products
          </h2>
          <p className="text-[var(--font-size-body)] text-[var(--color-text-primary)] opacity-70">
            Discover our range of solutions designed for your business
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-2)]">
          {products.map((product) => (
            <div 
              key={product.id} 
              className="bg-[var(--color-background-default)] rounded-[var(--radius-card)] shadow-lg overflow-hidden hover:shadow-xl transition-shadow border-t-4"
              style={{ borderTopColor: primaryColor }}
            >
              <div className="p-[var(--space-2)]">
                <h3 className="text-[var(--font-size-body)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] mb-[var(--space-1)]">
                  {product.name}
                </h3>
                {product.description && (
                  <p className="text-[var(--color-text-primary)] opacity-70 mb-[var(--space-1)] line-clamp-3">
                    {product.description}
                  </p>
                )}
                
                {product.tiers && product.tiers.length > 0 && (
                  <div className="mb-[var(--space-1)]">
                    <p className="text-sm text-[var(--color-text-primary)] opacity-70 mb-[var(--space-0)]">Starting from:</p>
                    <div className="flex items-baseline">
                      <span className="text-[var(--font-size-heading)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)]">
                        ${(product.tiers[0].priceAmount / 100).toFixed(0)}
                      </span>
                      <span className="text-[var(--color-text-primary)] opacity-70 ml-1">
                        /{product.tiers[0].billingPeriod}
                      </span>
                    </div>
                  </div>
                )}

                <Link
                  href={`/products/${product.id}`}
                  className="block w-full text-center px-[var(--space-1)] py-[var(--space-0)] border border-transparent text-sm font-medium rounded-[var(--radius-card)] text-[var(--color-background-default)] hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: primaryColor }}
                >
                  Learn More
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-[var(--space-2)]">
          <Link
            href="/products"
            className="inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] border border-[var(--color-text-primary)] opacity-70 text-base font-medium rounded-[var(--radius-card)] text-[var(--color-text-primary)] bg-[var(--color-background-default)] hover:bg-[var(--color-secondary)]"
          >
            View All Products
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductsSection;