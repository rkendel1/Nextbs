// User Role Types
export type UserRole = 'creator' | 'platform_owner';

// SaaS Creator Types
export interface SaasCreator {
  id: string;
  userId: string;
  businessName: string;
  businessDescription?: string;
  website?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
  // Brand data from crawler
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  fonts?: string; // JSON array
  companyAddress?: string;
  contactInfo?: string; // JSON object
  productsParsed?: string; // JSON array
  voiceAndTone?: string;
  crawlJobId?: string;
  crawlStatus?: string;
  crawlConfidence?: string; // JSON object
  crawlCompletedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OnboardingData {
  businessName: string;
  businessDescription?: string;
  website?: string;
  stripeAccountId?: string;
}

// Product & Tier Types
export interface Product {
  id: string;
  saasCreatorId: string;
  name: string;
  description?: string;
  isActive: boolean;
  stripePriceId?: string;
  stripeProductId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Tier {
  id: string;
  productId: string;
  name: string;
  description?: string;
  priceAmount: number;
  billingPeriod: string;
  features: string[];
  usageLimit?: number;
  stripePriceId?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProductWithTiers extends Product {
  tiers: Tier[];
}

// Subscription Types
export interface Subscription {
  id: string;
  userId: string;
  saasCreatorId: string;
  productId: string;
  tierId: string;
  stripeSubscriptionId?: string;
  status: string;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface SubscriptionWithDetails extends Subscription {
  product: Product;
  tier: Tier;
  saasCreator: SaasCreator;
}

// Usage & Metering Types
export interface UsageRecord {
  id: string;
  subscriptionId: string;
  userId: string;
  quantity: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  reportedAt: Date;
}

export interface MeteringConfig {
  id: string;
  productId: string;
  meteringType: string;
  meteringUnit: string;
  aggregationType: string;
  usageReportingUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Stripe Account Types
export interface StripeAccount {
  id: string;
  saasCreatorId: string;
  stripeAccountId: string;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  scope?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// White Label Types
export interface WhiteLabelConfig {
  id: string;
  saasCreatorId: string;
  brandName?: string;
  primaryColor?: string;
  secondaryColor?: string;
  logoUrl?: string;
  faviconUrl?: string;
  customDomain?: string;
  subdomain?: string;
  customCss?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalSubscribers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  totalUsage: number;
}

// Onboarding Step Types
export enum OnboardingStep {
  PLAN_SELECTION = 1,
  URL_ENTRY = 2,
  STRIPE_CONNECT = 3,
  COMPANY_INFO_REVIEW = 4,
  COMPLETE = 5,
}

// Brand Data from Crawler
export interface BrandData {
  logo_url?: string;
  favicon_url?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  fonts?: string[];
  company_name?: string;
  company_address?: string;
  contact_info?: {
    email?: string;
    phone?: string;
  };
  products?: string[];
  voice?: string;
  confidence_scores?: {
    logo?: number;
    colors?: number;
    fonts?: number;
    company_info?: number;
  };
}

export interface CrawlJobStatus {
  jobId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  data?: BrandData;
  error?: string;
}

// API Key Types
export interface ApiKey {
  id: string;
  saasCreatorId: string;
  name: string;
  key: string;
  lastUsedAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiKeyCreate {
  name: string;
  permissions?: string[];
  expiresAt?: Date;
}

// Email Notification Types
export interface EmailNotification {
  id: string;
  userId: string;
  type: string;
  subject: string;
  body: string;
  recipient: string;
  status: string;
  sentAt?: Date;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type EmailNotificationType =
  | 'subscription_created'
  | 'subscription_updated'
  | 'subscription_cancelled'
  | 'payment_succeeded'
  | 'payment_failed'
  | 'trial_ending'
  | 'usage_limit_warning';

// Webhook Event Types
export interface WebhookEvent {
  id: string;
  eventId: string;
  eventType: string;
  status: string;
  payload: Record<string, unknown>;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// Analytics Types
export interface AnalyticsSnapshot {
  id: string;
  saasCreatorId?: string;
  period: string;
  periodStart: Date;
  periodEnd: Date;
  totalRevenue: number;
  newSubscribers: number;
  churnedSubscribers: number;
  activeSubscribers: number;
  totalUsage: number;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export interface AnalyticsData {
  revenue: {
    total: number;
    growth: number;
    monthlyBreakdown: Array<{ month: string; amount: number }>;
  };
  subscribers: {
    total: number;
    active: number;
    churned: number;
    growth: number;
  };
  usage: {
    total: number;
    trend: Array<{ date: string; value: number }>;
  };
}
