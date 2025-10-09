-- AlterTable
ALTER TABLE "SaasCreator" ADD COLUMN     "companyAddress" TEXT,
ADD COLUMN     "contactInfo" TEXT,
ADD COLUMN     "crawlCompletedAt" TIMESTAMP(3),
ADD COLUMN     "crawlConfidence" TEXT,
ADD COLUMN     "crawlJobId" TEXT,
ADD COLUMN     "crawlStatus" TEXT DEFAULT 'pending',
ADD COLUMN     "faviconUrl" TEXT,
ADD COLUMN     "fonts" TEXT,
ADD COLUMN     "logoUrl" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "productsParsed" TEXT,
ADD COLUMN     "secondaryColor" TEXT,
ADD COLUMN     "voiceAndTone" TEXT;
