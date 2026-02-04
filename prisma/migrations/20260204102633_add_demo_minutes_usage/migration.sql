-- CreateTable
CREATE TABLE "demo_minutes_usage" (
    "id" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "psychologistId" TEXT NOT NULL,
    "minutesUsed" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_minutes_usage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "demo_minutes_usage_patientId_idx" ON "demo_minutes_usage"("patientId");

-- CreateIndex
CREATE INDEX "demo_minutes_usage_psychologistId_idx" ON "demo_minutes_usage"("psychologistId");

-- CreateIndex
CREATE UNIQUE INDEX "demo_minutes_usage_patientId_psychologistId_key" ON "demo_minutes_usage"("patientId", "psychologistId");
