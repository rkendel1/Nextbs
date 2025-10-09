-- CreateTable
CREATE TABLE "ScrapedSite" (
    "id" TEXT NOT NULL,
    "saasCreatorId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "domain" TEXT,
    "title" TEXT,
    "description" TEXT,
    "crawledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "rawHtml" TEXT,
    "screenshot" BYTEA,

    CONSTRAINT "ScrapedSite_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyInfo" (
    "id" TEXT NOT NULL,
    "scrapedSiteId" TEXT NOT NULL,
    "companyName" TEXT,
    "legalName" TEXT,
    "contactEmails" TEXT[],
    "contactPhones" TEXT[],
    "addresses" TEXT[],
    "structuredJson" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CompanyInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DesignToken" (
    "id" TEXT NOT NULL,
    "scrapedSiteId" TEXT NOT NULL,
    "tokenKey" TEXT NOT NULL,
    "tokenType" TEXT NOT NULL,
    "tokenValue" TEXT NOT NULL,
    "source" TEXT,
    "meta" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DesignToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ScrapedProduct" (
    "id" TEXT NOT NULL,
    "scrapedSiteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
    "price" TEXT,
    "description" TEXT,
    "productUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ScrapedProduct_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BrandVoice" (
    "id" TEXT NOT NULL,
    "scrapedSiteId" TEXT NOT NULL,
    "summary" TEXT,
    "guidelines" JSONB,
    "embedding" vector(1536),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BrandVoice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedSite_saasCreatorId_key" ON "ScrapedSite"("saasCreatorId");

-- CreateIndex
CREATE UNIQUE INDEX "ScrapedSite_url_key" ON "ScrapedSite"("url");

-- CreateIndex
CREATE INDEX "ScrapedSite_url_idx" ON "ScrapedSite"("url");

-- CreateIndex
CREATE INDEX "ScrapedSite_domain_idx" ON "ScrapedSite"("domain");

-- CreateIndex
CREATE UNIQUE INDEX "CompanyInfo_scrapedSiteId_key" ON "CompanyInfo"("scrapedSiteId");

-- CreateIndex
CREATE INDEX "CompanyInfo_scrapedSiteId_idx" ON "CompanyInfo"("scrapedSiteId");

-- CreateIndex
CREATE INDEX "DesignToken_scrapedSiteId_idx" ON "DesignToken"("scrapedSiteId");

-- CreateIndex
CREATE INDEX "DesignToken_tokenType_idx" ON "DesignToken"("tokenType");

-- CreateIndex
CREATE INDEX "ScrapedProduct_scrapedSiteId_idx" ON "ScrapedProduct"("scrapedSiteId");

-- CreateIndex
CREATE UNIQUE INDEX "BrandVoice_scrapedSiteId_key" ON "BrandVoice"("scrapedSiteId");

-- CreateIndex
CREATE INDEX "BrandVoice_scrapedSiteId_idx" ON "BrandVoice"("scrapedSiteId");

-- AddForeignKey
ALTER TABLE "ScrapedSite" ADD CONSTRAINT "ScrapedSite_saasCreatorId_fkey" FOREIGN KEY ("saasCreatorId") REFERENCES "SaasCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyInfo" ADD CONSTRAINT "CompanyInfo_scrapedSiteId_fkey" FOREIGN KEY ("scrapedSiteId") REFERENCES "ScrapedSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DesignToken" ADD CONSTRAINT "DesignToken_scrapedSiteId_fkey" FOREIGN KEY ("scrapedSiteId") REFERENCES "ScrapedSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ScrapedProduct" ADD CONSTRAINT "ScrapedProduct_scrapedSiteId_fkey" FOREIGN KEY ("scrapedSiteId") REFERENCES "ScrapedSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BrandVoice" ADD CONSTRAINT "BrandVoice_scrapedSiteId_fkey" FOREIGN KEY ("scrapedSiteId") REFERENCES "ScrapedSite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
