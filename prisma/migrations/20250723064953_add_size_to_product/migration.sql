/*
  Warnings:

  - You are about to drop the column `ringSize` on the `Product` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Product" DROP COLUMN "ringSize",
ADD COLUMN     "size" TEXT;
