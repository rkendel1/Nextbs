"use client";

import { useEffect } from "react";
import { cn } from "@/lib/utils";

interface WhiteLabelLayoutProps {
  children: React.ReactNode;
  domain?: string;
  config?: any;
  creator?: any;
  designTokens?: any;
  unifiedData?: any;
}

const WhiteLabelLayout = ({ children, domain, config, creator, designTokens, unifiedData }: WhiteLabelLayoutProps) => {
  const primaryColor = config?.primaryColor || designTokens?.primaryColor || '#667eea';
  const secondaryColor = config?.secondaryColor || designTokens?.secondaryColor || '#f5f5f5';
  const brandName = config?.brandName || creator?.businessName || 'Your Brand';

  // Set CSS custom properties for design tokens
  useEffect(() => {
    if (designTokens) {
      const root = document.documentElement;
      root.style.setProperty('--color-primary', primaryColor);
      root.style.setProperty('--color-secondary', secondaryColor);
      root.style.setProperty('--color-background-default', designTokens.background?.default || '#ffffff');
      root.style.setProperty('--color-text-primary', designTokens.text?.primary || '#000000');
      root.style.setProperty('--font-family-primary', designTokens.font?.family?.primary || 'system-ui');
      root.style.setProperty('--font-size-body', designTokens.font?.size?.body || '1rem');
      root.style.setProperty('--font-size-heading', designTokens.font?.size?.heading || '2rem');
      root.style.setProperty('--font-weight-heading', designTokens.font?.weight?.heading?.toString() || '600');
      root.style.setProperty('--space-0', '0.25rem');
      root.style.setProperty('--space-1', '0.5rem');
      root.style.setProperty('--space-2', '1rem');
      root.style.setProperty('--space-3', '1.5rem');
      root.style.setProperty('--radius-card', designTokens.radius?.card || '0.5rem');
    }
  }, [designTokens, primaryColor, secondaryColor]);

  return (
    <div className="min-h-screen bg-[var(--color-background-default)]">
      {children}
    </div>
  );
};

export default WhiteLabelLayout;