"use client";
import Link from "next/link";
import Image from "next/image";

interface SectionItem {
  name: string;
  image?: string | null;
  href: string;
}

interface SectionData {
  type: 'content' | 'categoryGrid';
  title: string;
  paragraphs?: string[];
  items?: SectionItem[];
}

const DynamicSection = ({ data }: { data: SectionData }) => {
  if (data.type === 'content') {
    return (
      <section className="py-[var(--space-3)] bg-[var(--color-background-default)]">
        <div className="max-w-7xl mx-auto px-[var(--space-3)]">
          <h2 className="text-[var(--font-size-heading)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] text-center mb-[var(--space-2)]">
            {data.title}
          </h2>
          {data.paragraphs?.map((paragraph, index) => (
            <p key={index} className="text-[var(--font-size-body)] text-[var(--color-text-primary)] mb-[var(--space-1)] max-w-3xl mx-auto">
              {paragraph}
            </p>
          ))}
        </div>
      </section>
    );
  }

  if (data.type === 'categoryGrid') {
    return (
      <section className="py-[var(--space-3)] bg-[var(--color-background-default)]">
        <div className="max-w-7xl mx-auto px-[var(--space-3)]">
          <h2 className="text-[var(--font-size-heading)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] text-center mb-[var(--space-2)]">
            {data.title}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-[var(--space-2)]">
            {data.items?.map((item, index) => (
              <div key={index} className="bg-[var(--color-background-default)] rounded-[var(--radius-card)] shadow-lg p-[var(--space-2)] text-center border-t-4" style={{ borderTopColor: 'var(--color-brand-primary)' }}>
                <h3 className="text-[var(--font-size-body)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] mb-[var(--space-1)]">
                  {item.name}
                </h3>
                {item.image && (
                  <Image 
                    src={item.image} 
                    alt={item.name} 
                    className="mx-auto mb-[var(--space-1)] rounded-[var(--radius-card)]" 
                    width={200} 
                    height={150} 
                  />
                )}
                <Link
                  href={item.href}
                  className="block w-full text-center px-[var(--space-1)] py-[var(--space-0)] border border-transparent text-sm font-medium rounded-[var(--radius-card)] text-[var(--color-background-default)] hover:opacity-90 transition-opacity"
                  style={{ backgroundColor: 'var(--color-brand-primary)' }}
                >
                  Learn More
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return null;
};

export default DynamicSection;