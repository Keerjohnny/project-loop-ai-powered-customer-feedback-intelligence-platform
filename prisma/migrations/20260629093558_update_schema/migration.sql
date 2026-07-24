/*
  Warnings:

  - The values [IN_PROGRESS,RESOLVED] on the enum `FeedbackStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `customerEmail` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `customerName` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `message` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `title` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `summary` on the `Report` table. All the data in the column will be lost.
  - You are about to drop the column `password` on the `User` table. All the data in the column will be lost.
  - Added the required column `content` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `customerLabel` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `confidence` to the `FeedbackTheme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `contentJson` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodEnd` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `periodStart` to the `Report` table without a default value. This is not possible if the table is not empty.
  - Added the required column `color` to the `Theme` table without a default value. This is not possible if the table is not empty.
  - Added the required column `passwordHash` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "public"."FeedbackStatus_new" AS ENUM ('NEW', 'REVIEWED', 'ACTIONED', 'CLOSED');
ALTER TABLE "public"."Feedback" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "public"."Feedback" ALTER COLUMN "status" TYPE "public"."FeedbackStatus_new" USING ("status"::text::"public"."FeedbackStatus_new");
ALTER TYPE "public"."FeedbackStatus" RENAME TO "FeedbackStatus_old";
ALTER TYPE "public"."FeedbackStatus_new" RENAME TO "FeedbackStatus";
DROP TYPE "public"."FeedbackStatus_old";
ALTER TABLE "public"."Feedback" ALTER COLUMN "status" SET DEFAULT 'NEW';
COMMIT;

-- AlterTable
ALTER TABLE "public"."Feedback" DROP COLUMN "customerEmail",
DROP COLUMN "customerName",
DROP COLUMN "message",
DROP COLUMN "title",
ADD COLUMN     "content" TEXT NOT NULL,
ADD COLUMN     "customerLabel" TEXT NOT NULL,
ADD COLUMN     "sentimentScore" DOUBLE PRECISION,
ADD COLUMN     "sourceRef" TEXT;

-- AlterTable
ALTER TABLE "public"."FeedbackTheme" ADD COLUMN     "confidence" DOUBLE PRECISION NOT NULL;

-- AlterTable
ALTER TABLE "public"."Report" DROP COLUMN "summary",
ADD COLUMN     "contentJson" JSONB NOT NULL,
ADD COLUMN     "periodEnd" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "periodStart" TIMESTAMP(3) NOT NULL;

-- AlterTable
ALTER TABLE "public"."Theme" ADD COLUMN     "color" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "password",
ADD COLUMN     "passwordHash" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "Feedback_workspaceId_idx" ON "public"."Feedback"("workspaceId");

-- CreateIndex
CREATE INDEX "Feedback_channel_idx" ON "public"."Feedback"("channel");

-- CreateIndex
CREATE INDEX "Feedback_status_idx" ON "public"."Feedback"("status");

-- CreateIndex
CREATE INDEX "Report_workspaceId_idx" ON "public"."Report"("workspaceId");

-- CreateIndex
CREATE INDEX "Theme_workspaceId_idx" ON "public"."Theme"("workspaceId");

-- CreateIndex
CREATE INDEX "User_workspaceId_idx" ON "public"."User"("workspaceId");
