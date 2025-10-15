-- AlterTable
ALTER TABLE "SaasCreator" ADD COLUMN     "primaryLogo" TEXT;

-- AlterTable
ALTER TABLE "ScrapedSite" ADD COLUMN     "logoUrls" JSONB,
ADD COLUMN     "primaryLogo" TEXT;
