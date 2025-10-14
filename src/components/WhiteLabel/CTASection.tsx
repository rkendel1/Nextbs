"use client";
import { useState } from "react";
import Link from "next/link";

interface BrandVoice {
  tone: string;
  themes: string[];
}

interface CTASectionProps {
  brandVoice?: BrandVoice | null;
  primaryColor: string;
  secondaryColor: string;
}

const CTASection = ({ brandVoice, primaryColor, secondaryColor }: CTASectionProps) => {
  const [hovered, setHovered] = useState(false);
  const isFriendly = brandVoice?.tone === 'friendly';
  const headingText = isFriendly ? "Ready to get started? Let's make it happen!" : "Ready to Get Started?";
  const subText = isFriendly ? "Join thousands of businesses already thriving with our platform!" : "Join thousands of businesses already using our platform";

  return (
    <section 
      className="py-[var(--space-3)] text-center" 
      style={{ 
        background: `linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%)` 
      }}
    >
      <div className="max-w-7xl mx-auto px-[var(--space-3)] sm:px-[var(--space-3)] lg:px-[var(--space-3)]">
        <h2 className="text-[var(--font-size-heading)] font-[var(--font-weight-heading)] text-[var(--color-background-default)] mb-[var(--space-1)]">
          {headingText}
        </h2>
        <p className="text-[var(--font-size-body)] text-[var(--color-background-default)] opacity-90 mb-[var(--space-2)]">
          {subText}
        </p>
        <Link
          href="/products"
          className="inline-flex items-center px-[var(--space-2)] py-[var(--space-1)] border-2 border-[var(--color-background-default)] text-base font-medium rounded-[var(--radius-card)] hover:bg-[var(--color-background-default)] transition-colors"
          style={{ 
            color: primaryColor,
            backgroundColor: hovered ? secondaryColor : 'var(--color-background-default)'
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
        >
          Explore Products
        </Link>
      </div>
    </section>
  );
};

export default CTASection;