/*
  Warnings:

  - Added the required column `courierName` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `etd` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `isCod` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `serviceName` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `shippingCost` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "courierName" TEXT NOT NULL,
ADD COLUMN     "etd" TEXT NOT NULL,
ADD COLUMN     "isCod" BOOLEAN NOT NULL,
ADD COLUMN     "serviceName" TEXT NOT NULL,
ADD COLUMN     "shippingCost" INTEGER NOT NULL,
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'paid';
