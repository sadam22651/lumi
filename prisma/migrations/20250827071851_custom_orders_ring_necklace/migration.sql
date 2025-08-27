-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('PENDING', 'REVIEW', 'CONFIRMED', 'PRODUCING', 'SHIPPED', 'DONE', 'CANCELLED');

-- CreateTable
CREATE TABLE "RingOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "address" TEXT NOT NULL,
    "ringSize" INTEGER NOT NULL,
    "engraveText" VARCHAR(40),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RingOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NecklaceOrder" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "customerName" VARCHAR(100) NOT NULL,
    "phone" VARCHAR(30) NOT NULL,
    "address" TEXT NOT NULL,
    "nameText" VARCHAR(20) NOT NULL,
    "chainLength" INTEGER NOT NULL,
    "fontStyle" VARCHAR(50),
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "notes" TEXT,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NecklaceOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OrderImage" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "filename" VARCHAR(200),
    "mimeType" VARCHAR(100),
    "ringOrderId" TEXT,
    "necklaceOrderId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OrderImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "RingOrder_createdAt_idx" ON "RingOrder"("createdAt");

-- CreateIndex
CREATE INDEX "RingOrder_status_idx" ON "RingOrder"("status");

-- CreateIndex
CREATE INDEX "NecklaceOrder_createdAt_idx" ON "NecklaceOrder"("createdAt");

-- CreateIndex
CREATE INDEX "NecklaceOrder_status_idx" ON "NecklaceOrder"("status");

-- CreateIndex
CREATE INDEX "OrderImage_ringOrderId_idx" ON "OrderImage"("ringOrderId");

-- CreateIndex
CREATE INDEX "OrderImage_necklaceOrderId_idx" ON "OrderImage"("necklaceOrderId");

-- AddForeignKey
ALTER TABLE "RingOrder" ADD CONSTRAINT "RingOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NecklaceOrder" ADD CONSTRAINT "NecklaceOrder_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderImage" ADD CONSTRAINT "OrderImage_ringOrderId_fkey" FOREIGN KEY ("ringOrderId") REFERENCES "RingOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OrderImage" ADD CONSTRAINT "OrderImage_necklaceOrderId_fkey" FOREIGN KEY ("necklaceOrderId") REFERENCES "NecklaceOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;
