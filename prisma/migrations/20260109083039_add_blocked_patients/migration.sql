-- AlterEnum
ALTER TYPE "TransactionType" ADD VALUE 'MEDIA_UNLOCK';

-- CreateTable
CREATE TABLE "BlockedPatient" (
    "id" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "reason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BlockedPatient_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "BlockedPatient_psychologistId_idx" ON "BlockedPatient"("psychologistId");

-- CreateIndex
CREATE INDEX "BlockedPatient_patientId_idx" ON "BlockedPatient"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "BlockedPatient_psychologistId_patientId_key" ON "BlockedPatient"("psychologistId", "patientId");
