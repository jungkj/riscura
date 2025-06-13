-- CreateTable
CREATE TABLE "rcsa_entries" (
    "id" TEXT NOT NULL,
    "riskId" TEXT NOT NULL,
    "riskDescription" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "uploadedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "rcsa_entries_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "control_entries" (
    "id" TEXT NOT NULL,
    "controlId" TEXT NOT NULL,
    "controlDescription" TEXT NOT NULL,
    "rcsaEntryId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "control_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "rcsa_entries_riskId_organizationId_key" ON "rcsa_entries"("riskId", "organizationId");

-- CreateIndex
CREATE INDEX "rcsa_entries_organizationId_idx" ON "rcsa_entries"("organizationId");

-- CreateIndex
CREATE INDEX "rcsa_entries_riskId_idx" ON "rcsa_entries"("riskId");

-- CreateIndex
CREATE INDEX "rcsa_entries_createdAt_idx" ON "rcsa_entries"("createdAt");

-- CreateIndex
CREATE INDEX "control_entries_rcsaEntryId_idx" ON "control_entries"("rcsaEntryId");

-- CreateIndex
CREATE INDEX "control_entries_controlId_idx" ON "control_entries"("controlId");

-- CreateIndex
CREATE INDEX "control_entries_createdAt_idx" ON "control_entries"("createdAt");

-- AddForeignKey
ALTER TABLE "rcsa_entries" ADD CONSTRAINT "rcsa_entries_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "rcsa_entries" ADD CONSTRAINT "rcsa_entries_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "control_entries" ADD CONSTRAINT "control_entries_rcsaEntryId_fkey" FOREIGN KEY ("rcsaEntryId") REFERENCES "rcsa_entries"("id") ON DELETE CASCADE ON UPDATE CASCADE; 