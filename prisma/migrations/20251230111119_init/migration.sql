-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "NotificationType" ADD VALUE 'SESSION_REQUEST';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_APPROVED';
ALTER TYPE "NotificationType" ADD VALUE 'SESSION_REJECTED';

-- AlterEnum
ALTER TYPE "SessionStatus" ADD VALUE 'PENDING';

-- AlterTable
ALTER TABLE "ServiceOption" ADD COLUMN     "deletedAt" TIMESTAMP(3);
