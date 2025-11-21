/*
  Warnings:

  - You are about to drop the column `email` on the `AdminStaff` table. All the data in the column will be lost.
  - You are about to drop the column `email` on the `Trainer` table. All the data in the column will be lost.
  - You are about to drop the column `phone` on the `Trainer` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AdminStaff_email_key";

-- DropIndex
DROP INDEX "Trainer_email_key";

-- AlterTable
ALTER TABLE "AdminStaff" DROP COLUMN "email";

-- AlterTable
ALTER TABLE "Trainer" DROP COLUMN "email",
DROP COLUMN "phone";
