-- AlterTable
ALTER TABLE "User" ADD COLUMN     "notificationPreferences" JSONB,
ADD COLUMN     "sessionTimeout" INTEGER NOT NULL DEFAULT 30,
ADD COLUMN     "theme" TEXT NOT NULL DEFAULT 'light';
