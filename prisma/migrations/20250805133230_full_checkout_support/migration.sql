/*
  Warnings:

  - Added the required column `address` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientName` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `recipientPhone` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subdistrictId` to the `Transaction` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subdistrictName` to the `Transaction` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Product" ALTER COLUMN "detail" SET DEFAULT 'detail belum ditambahkan';

-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "address" TEXT NOT NULL,
ADD COLUMN     "recipientName" TEXT NOT NULL,
ADD COLUMN     "recipientPhone" TEXT NOT NULL,
ADD COLUMN     "subdistrictId" INTEGER NOT NULL,
ADD COLUMN     "subdistrictName" TEXT NOT NULL;
