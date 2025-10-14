-- CreateTable
CREATE TABLE "DesignVersion" (
    "id" TEXT NOT NULL,
    "saasCreatorId" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "tokensJson" JSONB NOT NULL,
    "whiteLabelJson" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DesignVersion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DesignVersion_saasCreatorId_idx" ON "DesignVersion"("saasCreatorId");

-- CreateIndex
CREATE INDEX "DesignVersion_isActive_idx" ON "DesignVersion"("isActive");

-- AddForeignKey
ALTER TABLE "DesignVersion" ADD CONSTRAINT "DesignVersion_saasCreatorId_fkey" FOREIGN KEY ("saasCreatorId") REFERENCES "SaasCreator"("id") ON DELETE CASCADE ON UPDATE CASCADE;
