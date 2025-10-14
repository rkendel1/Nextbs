"use client";
import Link from "next/link";
import Image from "next/image";

interface HeroData {
  title: string;
  subtitle?: string;
  image?: string | null;
  cta?: { label: string; href: string } | null;
}

const Hero = ({ data }: { data: HeroData }) => {
  const gradientTo = data.cta ? 'var(--color-brand-primary)15' : '#f5f5f5';

  return (
    <section 
      className="relative py-[var(--space-3)] text-center"
      style={{
        background: `linear-gradient(135deg, var(--color-background-default) 0%, ${gradientTo} 100%)`
      }}
    >
      <div className="max-w-7xl mx-auto px-[var(--space-3)] sm:px-[var(--space-3)] lg:px-[var(--space-3)]">
        <div className="text-center">
          <h1 className="text-[var(--font-size-heading)] md:text-[calc(var(--font-size-heading)*1.5)] font-[var(--font-weight-heading)] text-[var(--color-text-primary)] mb-[var(--space-2)]">
            {data.title}
          </h1>
          {data.subtitle && (
            <p className="text-[var(--font-size-body)] text-[var(--color-text-primary)] mb-[var(--space-3)] max-w-3xl mx-auto">
              {data.subtitle}
            </p>
          )}
          {data.image && (
            <Image 
              src={data.image} 
              alt="" 
              className="mx-auto mb-[var(--space-2)] rounded-[var(--radius-card)]" 
              width={600} 
              height={300} 
            />
          )}
          <div className="flex flex-col sm:flex-row gap-[var(--space-1)] justify-center">
            {data.cta && (
              <Link
                href={data.cta.href}
                className="inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] border border-transparent text-base font-medium rounded-[var(--radius-card)] text-[var(--color-background-default)] hover:opacity-90 transition-opacity"
                style={{ backgroundColor: 'var(--color-brand-primary)' }}
              >
                {data.cta.label}
              </Link>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;