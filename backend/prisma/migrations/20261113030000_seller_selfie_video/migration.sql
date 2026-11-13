-- Mandatory seller-initiated selfie video evidence: all previous approvals are held for new review.
CREATE TABLE "LaptopSellerVideoChallenge" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "challenge" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LaptopSellerVideoChallenge_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LaptopSellerVideoChallenge_listingId_key" ON "LaptopSellerVideoChallenge"("listingId");
ALTER TABLE "LaptopSellerVideoChallenge" ADD CONSTRAINT "LaptopSellerVideoChallenge_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LaptopListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
CREATE TABLE "LaptopSellerVideoEvidence" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "cipherText" BYTEA NOT NULL,
  "iv" BYTEA NOT NULL,
  "authTag" BYTEA NOT NULL,
  "mimeType" TEXT NOT NULL,
  "byteLength" INTEGER NOT NULL,
  "challenge" TEXT NOT NULL,
  "consentedAt" TIMESTAMP(3) NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LaptopSellerVideoEvidence_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "LaptopSellerVideoEvidence_listingId_key" ON "LaptopSellerVideoEvidence"("listingId");
ALTER TABLE "LaptopSellerVideoEvidence" ADD CONSTRAINT "LaptopSellerVideoEvidence_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "LaptopListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LaptopOwnershipReview" ADD COLUMN "sellerIntentConfirmed" BOOLEAN NOT NULL DEFAULT FALSE;
-- Fail closed: previous document-only approval no longer authorises buying or swapping.
UPDATE "LaptopListing" SET "ownershipStatus" = 'PENDING', "ownershipReviewedAt" = NULL
WHERE "ownershipStatus" = 'REVIEWED';
-- Existing, incompletely verified offers must not remain actionable.
UPDATE "LaptopOffer" SET "status"='DECLINED'
WHERE "status" IN ('PENDING','ADMIN_APPROVED') AND "targetId" IN
  (SELECT "id" FROM "LaptopListing" WHERE "ownershipStatus"='PENDING');
UPDATE "LaptopOffer" SET "status"='WITHDRAWN'
WHERE "status" IN ('PENDING','ADMIN_APPROVED') AND "offeredId" IN
  (SELECT "id" FROM "LaptopListing" WHERE "ownershipStatus"='PENDING');
