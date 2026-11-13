-- One-owner store pilot: prior peer-to-peer listings are not stock.
ALTER TABLE "LaptopListing"
  ADD COLUMN "storeInventory" BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN "storeAcquiredAt" TIMESTAMP(3),
  ADD COLUMN "originListingId" TEXT;
CREATE UNIQUE INDEX "LaptopListing_originListingId_key" ON "LaptopListing"("originListingId");
CREATE INDEX "LaptopListing_storeInventory_status_idx" ON "LaptopListing"("storeInventory","status");
CREATE TYPE "StoreQuoteStatus" AS ENUM ('OFFERED','SELLER_ACCEPTED','SELLER_DECLINED','ACQUIRED','CANCELLED');
CREATE TABLE "StoreIntakeQuote"(
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "ownerId" TEXT NOT NULL,
  "price" DOUBLE PRECISION NOT NULL,
  "status" "StoreQuoteStatus" NOT NULL DEFAULT 'OFFERED',
  "note" TEXT NOT NULL DEFAULT '',
  "offeredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "agreedAt" TIMESTAMP(3),
  "acquiredAt" TIMESTAMP(3),
  "handoverNote" TEXT,
  CONSTRAINT "StoreIntakeQuote_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "StoreIntakeQuote_listingId_key" ON "StoreIntakeQuote"("listingId");
CREATE INDEX "StoreIntakeQuote_status_idx" ON "StoreIntakeQuote"("status");
ALTER TABLE "StoreIntakeQuote" ADD CONSTRAINT "StoreIntakeQuote_listingId_fkey"
FOREIGN KEY("listingId") REFERENCES "LaptopListing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "StoreIntakeQuote" ADD CONSTRAINT "StoreIntakeQuote_ownerId_fkey"
FOREIGN KEY("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
-- Old public peer-to-peer inventory remains private until the owner takes possession.
UPDATE "LaptopListing" SET "storeInventory"=FALSE WHERE "storeInventory"=FALSE;
-- Invalidate old open peer-to-peer offers to prevent bypass after switching business model.
UPDATE "LaptopOffer" SET "status"='DECLINED' WHERE "status" IN ('PENDING','ADMIN_APPROVED')
AND "targetId" IN (SELECT "id" FROM "LaptopListing" WHERE "storeInventory"=FALSE);
