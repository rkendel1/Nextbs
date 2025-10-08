-- AlterTable User - Add role field
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'creator';

-- AlterTable WhiteLabelConfig - Change from userId to saasCreatorId
ALTER TABLE "WhiteLabelConfig" DROP CONSTRAINT IF EXISTS "WhiteLabelConfig_userId_fkey";
ALTER TABLE "WhiteLabelConfig" DROP CONSTRAINT IF EXISTS "WhiteLabelConfig_userId_key";
ALTER TABLE "WhiteLabelConfig" RENAME COLUMN "userId" TO "saasCreatorId";
ALTER TABLE "WhiteLabelConfig" ADD COLUMN "secondaryColor" TEXT;
ALTER TABLE "WhiteLabelConfig" ADD COLUMN "faviconUrl" TEXT;
ALTER TABLE "WhiteLabelConfig" ADD CONSTRAINT "WhiteLabelConfig_saasCreatorId_key" UNIQUE ("saasCreatorId");
ALTER TABLE "WhiteLabelConfig" ADD CONSTRAINT "WhiteLabelConfig_saasCreatorId_fkey" FOREIGN KEY ("saasCreatorId") REFERENCES "SaasCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable ApiKey
CREATE TABLE "ApiKey" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "permissions" TEXT[],
    "lastUsedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ApiKey_pkey" PRIMARY KEY ("id")
);

-- CreateTable EmailNotification
CREATE TABLE "EmailNotification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "recipient" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "sentAt" TIMESTAMP(3),
    "error" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "EmailNotification_pkey" PRIMARY KEY ("id")
);

-- CreateTable WebhookEvent
CREATE TABLE "WebhookEvent" (
    "id" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "payload" JSONB NOT NULL,
    "processedAt" TIMESTAMP(3),
    "error" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WebhookEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable AnalyticsSnapshot
CREATE TABLE "AnalyticsSnapshot" (
    "id" TEXT NOT NULL,
    "saasCreatorId" TEXT,
    "period" TEXT NOT NULL,
    "periodStart" TIMESTAMP(3) NOT NULL,
    "periodEnd" TIMESTAMP(3) NOT NULL,
    "totalRevenue" INTEGER NOT NULL DEFAULT 0,
    "newSubscribers" INTEGER NOT NULL DEFAULT 0,
    "churnedSubscribers" INTEGER NOT NULL DEFAULT 0,
    "activeSubscribers" INTEGER NOT NULL DEFAULT 0,
    "totalUsage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AnalyticsSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ApiKey_key_key" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "ApiKey_userId_idx" ON "ApiKey"("userId");

-- CreateIndex
CREATE INDEX "ApiKey_key_idx" ON "ApiKey"("key");

-- CreateIndex
CREATE INDEX "EmailNotification_userId_idx" ON "EmailNotification"("userId");

-- CreateIndex
CREATE INDEX "EmailNotification_status_idx" ON "EmailNotification"("status");

-- CreateIndex
CREATE INDEX "EmailNotification_createdAt_idx" ON "EmailNotification"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "WebhookEvent_eventId_key" ON "WebhookEvent"("eventId");

-- CreateIndex
CREATE INDEX "WebhookEvent_eventType_idx" ON "WebhookEvent"("eventType");

-- CreateIndex
CREATE INDEX "WebhookEvent_status_idx" ON "WebhookEvent"("status");

-- CreateIndex
CREATE INDEX "WebhookEvent_createdAt_idx" ON "WebhookEvent"("createdAt");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_saasCreatorId_idx" ON "AnalyticsSnapshot"("saasCreatorId");

-- CreateIndex
CREATE INDEX "AnalyticsSnapshot_periodStart_idx" ON "AnalyticsSnapshot"("periodStart");

-- CreateIndex
CREATE UNIQUE INDEX "AnalyticsSnapshot_saasCreatorId_period_periodStart_key" ON "AnalyticsSnapshot"("saasCreatorId", "period", "periodStart");

-- AddForeignKey
ALTER TABLE "ApiKey" ADD CONSTRAINT "ApiKey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailNotification" ADD CONSTRAINT "EmailNotification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AnalyticsSnapshot" ADD CONSTRAINT "AnalyticsSnapshot_saasCreatorId_fkey" FOREIGN KEY ("saasCreatorId") REFERENCES "SaasCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
