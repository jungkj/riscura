-- CreateTable
CREATE TABLE "extracted_risks" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceDocument" TEXT NOT NULL,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION,
    "organizationId" TEXT NOT NULL,
    "extractedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracted_risks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "extracted_controls" (
    "id" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "sourceDocument" TEXT NOT NULL,
    "extractedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "confidence" DOUBLE PRECISION,
    "organizationId" TEXT NOT NULL,
    "extractedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "extracted_controls_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "extracted_risks_organizationId_idx" ON "extracted_risks"("organizationId");

-- CreateIndex
CREATE INDEX "extracted_risks_sourceDocument_idx" ON "extracted_risks"("sourceDocument");

-- CreateIndex
CREATE INDEX "extracted_risks_extractedAt_idx" ON "extracted_risks"("extractedAt");

-- CreateIndex
CREATE INDEX "extracted_controls_organizationId_idx" ON "extracted_controls"("organizationId");

-- CreateIndex
CREATE INDEX "extracted_controls_sourceDocument_idx" ON "extracted_controls"("sourceDocument");

-- CreateIndex
CREATE INDEX "extracted_controls_extractedAt_idx" ON "extracted_controls"("extractedAt");

-- AddForeignKey
ALTER TABLE "extracted_risks" ADD CONSTRAINT "extracted_risks_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_risks" ADD CONSTRAINT "extracted_risks_extractedBy_fkey" FOREIGN KEY ("extractedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_controls" ADD CONSTRAINT "extracted_controls_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "extracted_controls" ADD CONSTRAINT "extracted_controls_extractedBy_fkey" FOREIGN KEY ("extractedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE; 