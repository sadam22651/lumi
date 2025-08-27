-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "detail" TEXT NOT NULL DEFAULT 'detail belum di tambahkan',
ALTER COLUMN "updatedAt" SET DEFAULT CURRENT_TIMESTAMP;
