// SaaS Creator Types
export interface SaasCreator {
  id: string;
  userId: string;
  businessName: string;
  businessDescription?: string;
  website?: string;
  onboardingCompleted: boolean;
  onboardingStep: number;
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
  userId: string;
  brandName?: string;
  primaryColor?: string;
  logoUrl?: string;
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
  BUSINESS_INFO = 1,
  STRIPE_CONNECT = 2,
  PRODUCT_SETUP = 3,
  COMPLETE = 4,
}
