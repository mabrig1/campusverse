-- Seller-declared laptop adverts and negotiation-only offers; no automated funds or ownership transfer.
CREATE TYPE "LaptopCondition" AS ENUM ('EXCELLENT', 'GOOD', 'FAIR', 'NEEDS_REPAIR');
CREATE TYPE "LaptopLockStatus" AS ENUM ('NOT_CHECKED', 'DECLARED_CLEAR');
CREATE TYPE "LaptopListingStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CLOSED');
CREATE TYPE "LaptopOfferType" AS ENUM ('BUY', 'SWAP');
CREATE TYPE "LaptopOfferStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED', 'WITHDRAWN');

CREATE TABLE "LaptopListing" (
  "id" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "brand" TEXT NOT NULL,
  "model" TEXT NOT NULL,
  "processor" TEXT NOT NULL,
  "ramGb" INTEGER NOT NULL,
  "storageGb" INTEGER NOT NULL,
  "storageType" TEXT NOT NULL,
  "condition" "LaptopCondition" NOT NULL,
  "batteryHealth" INTEGER,
  "faults" TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "imageUrl" TEXT,
  "serialLast4" TEXT,
  "lockStatus" "LaptopLockStatus" NOT NULL DEFAULT 'NOT_CHECKED',
  "ownershipDeclared" BOOLEAN NOT NULL DEFAULT false,
  "price" DOUBLE PRECISION NOT NULL,
  "allowSwap" BOOLEAN NOT NULL DEFAULT false,
  "location" TEXT NOT NULL,
  "status" "LaptopListingStatus" NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LaptopListing_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "LaptopOffer" (
  "id" TEXT NOT NULL,
  "targetId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "offeredId" TEXT,
  "type" "LaptopOfferType" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "note" TEXT NOT NULL DEFAULT '',
  "status" "LaptopOfferStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "LaptopOffer_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "LaptopListing_sellerId_status_idx" ON "LaptopListing"("sellerId", "status");
CREATE INDEX "LaptopListing_status_createdAt_idx" ON "LaptopListing"("status", "createdAt");
CREATE INDEX "LaptopOffer_targetId_status_idx" ON "LaptopOffer"("targetId", "status");
CREATE INDEX "LaptopOffer_buyerId_status_idx" ON "LaptopOffer"("buyerId", "status");
ALTER TABLE "LaptopListing" ADD CONSTRAINT "LaptopListing_sellerId_fkey" FOREIGN KEY ("sellerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LaptopOffer" ADD CONSTRAINT "LaptopOffer_targetId_fkey" FOREIGN KEY ("targetId") REFERENCES "LaptopListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LaptopOffer" ADD CONSTRAINT "LaptopOffer_buyerId_fkey" FOREIGN KEY ("buyerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "LaptopOffer" ADD CONSTRAINT "LaptopOffer_offeredId_fkey" FOREIGN KEY ("offeredId") REFERENCES "LaptopListing"("id") ON DELETE SET NULL ON UPDATE CASCADE;
