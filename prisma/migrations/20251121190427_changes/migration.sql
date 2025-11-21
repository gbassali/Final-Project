/*
  Warnings:

  - Added the required column `type` to the `TrainerAvailability` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "AvailabilityType" AS ENUM ('ONE_TIME', 'WEEKLY');

-- AlterTable
ALTER TABLE "Member" ADD COLUMN     "pastClassCount" INTEGER;

-- AlterTable
ALTER TABLE "TrainerAvailability" ADD COLUMN     "dayOfWeek" INTEGER,
ADD COLUMN     "endDateTime" TIMESTAMP(3),
ADD COLUMN     "startDateTime" TIMESTAMP(3),
ADD COLUMN     "type" "AvailabilityType" NOT NULL,
ALTER COLUMN "startTime" DROP NOT NULL,
ALTER COLUMN "startTime" SET DATA TYPE TIME,
ALTER COLUMN "endTime" DROP NOT NULL,
ALTER COLUMN "endTime" SET DATA TYPE TIME;

-- CreateTable
CREATE TABLE "FitnessGoals" (
    "id" SERIAL NOT NULL,
    "memberId" INTEGER NOT NULL,
    "recordedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "active" BOOLEAN NOT NULL,
    "value" TEXT NOT NULL,

    CONSTRAINT "FitnessGoals_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FitnessGoals_memberId_recordedAt_idx" ON "FitnessGoals"("memberId", "recordedAt");

-- AddForeignKey
ALTER TABLE "FitnessGoals" ADD CONSTRAINT "FitnessGoals_memberId_fkey" FOREIGN KEY ("memberId") REFERENCES "Member"("id") ON DELETE CASCADE ON UPDATE CASCADE;
