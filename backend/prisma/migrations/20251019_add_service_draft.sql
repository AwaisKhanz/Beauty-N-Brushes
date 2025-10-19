-- CreateTable
CREATE TABLE "ServiceDraft" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "draftData" JSONB NOT NULL,
    "currentStep" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceDraft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ServiceDraft_providerId_key" ON "ServiceDraft"("providerId");

-- CreateIndex
CREATE INDEX "ServiceDraft_providerId_idx" ON "ServiceDraft"("providerId");

-- CreateIndex
CREATE INDEX "ServiceDraft_expiresAt_idx" ON "ServiceDraft"("expiresAt");

-- AddForeignKey
ALTER TABLE "ServiceDraft" ADD CONSTRAINT "ServiceDraft_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "ProviderProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

