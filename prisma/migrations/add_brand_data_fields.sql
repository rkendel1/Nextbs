-- Migration: Add brand data fields to SaasCreator table
-- This migration adds fields for storing crawler-fetched brand information

-- Add brand asset fields
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "logoUrl" TEXT;
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "faviconUrl" TEXT;

-- Add design token fields
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "primaryColor" TEXT;
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "secondaryColor" TEXT;
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "fonts" TEXT; -- JSON array

-- Add company info fields
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "companyAddress" TEXT;
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "contactInfo" TEXT; -- JSON object

-- Add parsed data fields
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "productsParsed" TEXT; -- JSON array
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "voiceAndTone" TEXT;

-- Add crawler job tracking fields
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "crawlJobId" TEXT;
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "crawlStatus" TEXT DEFAULT 'pending';
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "crawlConfidence" TEXT; -- JSON object
ALTER TABLE "SaasCreator" ADD COLUMN IF NOT EXISTS "crawlCompletedAt" TIMESTAMP;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "SaasCreator_crawlStatus_idx" ON "SaasCreator"("crawlStatus");
CREATE INDEX IF NOT EXISTS "SaasCreator_crawlJobId_idx" ON "SaasCreator"("crawlJobId");

-- Update existing records to have pending status
UPDATE "SaasCreator" 
SET "crawlStatus" = 'pending' 
WHERE "crawlStatus" IS NULL;

-- Comments for documentation
COMMENT ON COLUMN "SaasCreator"."logoUrl" IS 'URL to company logo fetched by crawler';
COMMENT ON COLUMN "SaasCreator"."faviconUrl" IS 'URL to company favicon fetched by crawler';
COMMENT ON COLUMN "SaasCreator"."primaryColor" IS 'Primary brand color (hex) from crawler';
COMMENT ON COLUMN "SaasCreator"."secondaryColor" IS 'Secondary brand color (hex) from crawler';
COMMENT ON COLUMN "SaasCreator"."fonts" IS 'JSON array of detected fonts';
COMMENT ON COLUMN "SaasCreator"."companyAddress" IS 'Physical company address from crawler';
COMMENT ON COLUMN "SaasCreator"."contactInfo" IS 'JSON object with email, phone, etc.';
COMMENT ON COLUMN "SaasCreator"."productsParsed" IS 'JSON array of products found on website';
COMMENT ON COLUMN "SaasCreator"."voiceAndTone" IS 'AI-detected brand voice and tone description';
COMMENT ON COLUMN "SaasCreator"."crawlJobId" IS 'Unique identifier for the crawler job';
COMMENT ON COLUMN "SaasCreator"."crawlStatus" IS 'Status: pending, processing, completed, failed';
COMMENT ON COLUMN "SaasCreator"."crawlConfidence" IS 'JSON object with confidence scores per field';
COMMENT ON COLUMN "SaasCreator"."crawlCompletedAt" IS 'Timestamp when crawler job completed';
