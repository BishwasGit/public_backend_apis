-- AlterTable
ALTER TABLE "MediaFile" ADD COLUMN     "isLocked" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "unlockPrice" DOUBLE PRECISION DEFAULT 0;

-- CreateTable
CREATE TABLE "MediaUnlock" (
    "id" TEXT NOT NULL,
    "mediaId" TEXT NOT NULL,
    "patientId" TEXT NOT NULL,
    "paidAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "amount" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "MediaUnlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MediaUnlock_patientId_idx" ON "MediaUnlock"("patientId");

-- CreateIndex
CREATE UNIQUE INDEX "MediaUnlock_mediaId_patientId_key" ON "MediaUnlock"("mediaId", "patientId");

-- AddForeignKey
ALTER TABLE "MediaUnlock" ADD CONSTRAINT "MediaUnlock_mediaId_fkey" FOREIGN KEY ("mediaId") REFERENCES "MediaFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
