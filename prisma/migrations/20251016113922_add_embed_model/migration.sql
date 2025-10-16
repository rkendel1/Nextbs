-- CreateEnum
CREATE TYPE "EmbedType" AS ENUM ('PAGE', 'COLLECTION', 'COMPONENT', 'WIDGET');

-- CreateEnum
CREATE TYPE "WidgetType" AS ENUM ('CHAT', 'FORM', 'NOTIFICATION', 'CUSTOM');

-- CreateEnum
CREATE TYPE "AnalyticsEvent" AS ENUM ('LOAD', 'VIEW', 'CLICK', 'SUBMIT', 'CLOSE', 'MINIMIZE', 'ERROR');

-- CreateEnum
CREATE TYPE "SubmissionStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'COMPLETED', 'SPAM', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "MessageSender" AS ENUM ('USER', 'BOT', 'AGENT');

-- CreateEnum
CREATE TYPE "UserPlan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateTable
CREATE TABLE "Embed" (
    "id" TEXT NOT NULL,
    "saasCreatorId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "EmbedType" NOT NULL,
    "description" TEXT,
    "features" JSONB,
    "config" JSONB NOT NULL,
    "designVersionId" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Embed_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "short_codes" (
    "id" TEXT NOT NULL,
    "code" VARCHAR(12) NOT NULL,
    "config" TEXT NOT NULL,
    "widgetId" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "userId" VARCHAR(100),

    CONSTRAINT "short_codes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widgets" (
    "id" TEXT NOT NULL,
    "widgetId" VARCHAR(100) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "contentType" "WidgetType" NOT NULL,
    "designTokens" JSONB NOT NULL,
    "apiEndpoint" TEXT NOT NULL DEFAULT '/api/embed/content',
    "customCSS" TEXT,
    "customJS" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" VARCHAR(100),

    CONSTRAINT "widgets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "widget_analytics" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "eventType" "AnalyticsEvent" NOT NULL,
    "eventData" JSONB,
    "sessionId" VARCHAR(100),
    "userAgent" VARCHAR(500),
    "ipHash" VARCHAR(64),
    "referrer" VARCHAR(500),
    "country" VARCHAR(2),
    "city" VARCHAR(100),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "widget_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "form_submissions" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "formData" JSONB NOT NULL,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "status" "SubmissionStatus" NOT NULL DEFAULT 'NEW',
    "assignedTo" VARCHAR(100),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "referrer" VARCHAR(500),
    "userAgent" VARCHAR(500),

    CONSTRAINT "form_submissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "chat_messages" (
    "id" TEXT NOT NULL,
    "widgetId" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "sender" "MessageSender" NOT NULL,
    "sessionId" VARCHAR(100) NOT NULL,
    "agentId" VARCHAR(100),
    "aiModel" VARCHAR(50),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parentId" TEXT,

    CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255),
    "plan" "UserPlan" NOT NULL DEFAULT 'FREE',
    "widgetLimit" INTEGER NOT NULL DEFAULT 3,
    "apiKey" VARCHAR(64),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "lastLoginAt" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "rate_limits" (
    "id" TEXT NOT NULL,
    "identifier" VARCHAR(255) NOT NULL,
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "windowStart" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rate_limits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Embed_saasCreatorId_idx" ON "Embed"("saasCreatorId");

-- CreateIndex
CREATE INDEX "Embed_type_idx" ON "Embed"("type");

-- CreateIndex
CREATE INDEX "Embed_designVersionId_idx" ON "Embed"("designVersionId");

-- CreateIndex
CREATE INDEX "Embed_isActive_idx" ON "Embed"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "short_codes_code_key" ON "short_codes"("code");

-- CreateIndex
CREATE INDEX "short_codes_code_idx" ON "short_codes"("code");

-- CreateIndex
CREATE INDEX "short_codes_widgetId_idx" ON "short_codes"("widgetId");

-- CreateIndex
CREATE INDEX "short_codes_userId_idx" ON "short_codes"("userId");

-- CreateIndex
CREATE INDEX "short_codes_createdAt_idx" ON "short_codes"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "widgets_widgetId_key" ON "widgets"("widgetId");

-- CreateIndex
CREATE INDEX "widgets_widgetId_idx" ON "widgets"("widgetId");

-- CreateIndex
CREATE INDEX "widgets_userId_idx" ON "widgets"("userId");

-- CreateIndex
CREATE INDEX "widgets_contentType_idx" ON "widgets"("contentType");

-- CreateIndex
CREATE INDEX "widgets_isActive_idx" ON "widgets"("isActive");

-- CreateIndex
CREATE INDEX "widget_analytics_widgetId_idx" ON "widget_analytics"("widgetId");

-- CreateIndex
CREATE INDEX "widget_analytics_eventType_idx" ON "widget_analytics"("eventType");

-- CreateIndex
CREATE INDEX "widget_analytics_createdAt_idx" ON "widget_analytics"("createdAt");

-- CreateIndex
CREATE INDEX "widget_analytics_sessionId_idx" ON "widget_analytics"("sessionId");

-- CreateIndex
CREATE INDEX "form_submissions_widgetId_idx" ON "form_submissions"("widgetId");

-- CreateIndex
CREATE INDEX "form_submissions_status_idx" ON "form_submissions"("status");

-- CreateIndex
CREATE INDEX "form_submissions_createdAt_idx" ON "form_submissions"("createdAt");

-- CreateIndex
CREATE INDEX "form_submissions_email_idx" ON "form_submissions"("email");

-- CreateIndex
CREATE INDEX "chat_messages_widgetId_idx" ON "chat_messages"("widgetId");

-- CreateIndex
CREATE INDEX "chat_messages_sessionId_idx" ON "chat_messages"("sessionId");

-- CreateIndex
CREATE INDEX "chat_messages_createdAt_idx" ON "chat_messages"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_apiKey_key" ON "users"("apiKey");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_apiKey_idx" ON "users"("apiKey");

-- CreateIndex
CREATE UNIQUE INDEX "rate_limits_identifier_key" ON "rate_limits"("identifier");

-- CreateIndex
CREATE INDEX "rate_limits_identifier_idx" ON "rate_limits"("identifier");

-- CreateIndex
CREATE INDEX "rate_limits_windowStart_idx" ON "rate_limits"("windowStart");

-- AddForeignKey
ALTER TABLE "Embed" ADD CONSTRAINT "Embed_saasCreatorId_fkey" FOREIGN KEY ("saasCreatorId") REFERENCES "SaasCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Embed" ADD CONSTRAINT "Embed_designVersionId_fkey" FOREIGN KEY ("designVersionId") REFERENCES "DesignVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "short_codes" ADD CONSTRAINT "short_codes_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "widgets"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "widget_analytics" ADD CONSTRAINT "widget_analytics_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "widgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "form_submissions" ADD CONSTRAINT "form_submissions_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "widgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "chat_messages" ADD CONSTRAINT "chat_messages_widgetId_fkey" FOREIGN KEY ("widgetId") REFERENCES "widgets"("id") ON DELETE CASCADE ON UPDATE CASCADE;
