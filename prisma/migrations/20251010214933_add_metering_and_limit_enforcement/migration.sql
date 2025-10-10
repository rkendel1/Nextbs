-- AlterTable
ALTER TABLE "Tier" ADD COLUMN "softLimitPercent" DOUBLE PRECISION DEFAULT 0.8,
ADD COLUMN "limitAction" TEXT NOT NULL DEFAULT 'warn',
ADD COLUMN "overageAllowed" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "overageRate" INTEGER,
ADD COLUMN "warningThresholds" JSONB,
ADD COLUMN "meteringEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "stripePriceIdMetered" TEXT,
ADD COLUMN "unitPrice" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Tier_stripePriceIdMetered_key" ON "Tier"("stripePriceIdMetered");

-- CreateTable
CREATE TABLE "UsageLimitEvent" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "threshold" DOUBLE PRECISION NOT NULL,
    "currentUsage" DOUBLE PRECISION NOT NULL,
    "usageLimit" INTEGER NOT NULL,
    "percentage" DOUBLE PRECISION NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notificationSent" BOOLEAN NOT NULL DEFAULT false,
    "notifiedAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "UsageLimitEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StripeSubscriptionItem" (
    "id" TEXT NOT NULL,
    "subscriptionId" TEXT NOT NULL,
    "stripeSubscriptionItemId" TEXT NOT NULL,
    "stripePriceId" TEXT NOT NULL,
    "itemType" TEXT NOT NULL,
    "meteringType" TEXT,
    "lastReportedUsage" DOUBLE PRECISION DEFAULT 0,
    "lastReportedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StripeSubscriptionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UsageLimitEvent_subscriptionId_timestamp_idx" ON "UsageLimitEvent"("subscriptionId", "timestamp");

-- CreateIndex
CREATE INDEX "UsageLimitEvent_userId_timestamp_idx" ON "UsageLimitEvent"("userId", "timestamp");

-- CreateIndex
CREATE INDEX "UsageLimitEvent_eventType_idx" ON "UsageLimitEvent"("eventType");

-- CreateIndex
CREATE UNIQUE INDEX "StripeSubscriptionItem_stripeSubscriptionItemId_key" ON "StripeSubscriptionItem"("stripeSubscriptionItemId");

-- CreateIndex
CREATE INDEX "StripeSubscriptionItem_subscriptionId_idx" ON "StripeSubscriptionItem"("subscriptionId");

-- CreateIndex
CREATE INDEX "StripeSubscriptionItem_stripeSubscriptionItemId_idx" ON "StripeSubscriptionItem"("stripeSubscriptionItemId");

-- AddForeignKey
ALTER TABLE "UsageLimitEvent" ADD CONSTRAINT "UsageLimitEvent_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsageLimitEvent" ADD CONSTRAINT "UsageLimitEvent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StripeSubscriptionItem" ADD CONSTRAINT "StripeSubscriptionItem_subscriptionId_fkey" FOREIGN KEY ("subscriptionId") REFERENCES "Subscription"("id") ON DELETE CASCADE ON UPDATE CASCADE;
