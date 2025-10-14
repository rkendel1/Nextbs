// src/brandmanager/types/brand.ts

export interface DesignTokens {
  colors: Record<string, string>;
  fonts: string[];
  spacing: string[];
  borderRadius?: string[];
  shadows?: string[];
  cssVariables?: Record<string, string>;
  [key: string]: any;
}

export interface BrandVoice {
  tone: string;
  personality?: string[];
  guidelines?: Record<string, any>;
  themes?: string[];
  [key: string]: any;
}

export interface Product {
  siteId: string;
  name: string;
  slug?: string;
  price?: string | number;
  description?: string;
  productUrl?: string;
  metadata?: Record<string, any>;
}

export interface CompanyInfo {
  siteId: string;
  companyName: string;
  legalName?: string;
  contactEmails?: string[];
  contactPhones?: string[];
  addresses?: string[];
  structuredJson?: Record<string, any>;
}

export interface Site {
  id: string;
  url: string;
  domain: string;
  title?: string;
  description?: string;
  rawHtml?: string;
  screenshot?: string; // base64
  crawledAt?: string;
}

export interface BrandSnapshot {
  id: string;
  version: string;
  structure?: any;
  designTokens: DesignTokens;
  brandVoice: BrandVoice;
  meta?: any;
  screenshot?: string;
  createdAt: string;
}

export interface CompleteSiteData {
  site: Site;
  companyInfo?: CompanyInfo;
  designTokens: DesignTokens[];
  products: Product[];
  brandVoice?: BrandVoice;
}