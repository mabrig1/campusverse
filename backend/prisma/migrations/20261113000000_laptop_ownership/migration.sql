-- Add review-gated ownership proof for laptop listings.
-- All existing laptop listings default to NOT_SUBMITTED and are hidden from browsing.
CREATE TYPE "OwnershipReviewStatus" AS ENUM ('NOT_SUBMITTED','PENDING','REVIEWED','NEEDS_MORE_INFO','REJECTED','FLAGGED','REVOKED');
CREATE TYPE "OwnershipDocumentType" AS ENUM ('PURCHASE_RECEIPT','BILL_OF_SALE','ORGANISATION_RELEASE');
CREATE TYPE "LaptopReportReason" AS ENUM ('SUSPECTED_STOLEN','FALSE_DETAILS','LOCKED_DEVICE','OTHER');
CREATE TYPE "LaptopReportStatus" AS ENUM ('OPEN','RESOLVED');
ALTER TABLE "LaptopListing"
  ADD COLUMN "serialFingerprint" TEXT,
  ADD COLUMN "ownershipStatus" "OwnershipReviewStatus" NOT NULL DEFAULT 'NOT_SUBMITTED',
  ADD COLUMN "ownershipReviewedAt" TIMESTAMP(3),
  ADD COLUMN "ownershipReviewNote" TEXT;
CREATE INDEX "LaptopListing_serialFingerprint_idx" ON "LaptopListing"("serialFingerprint");
CREATE INDEX "LaptopListing_ownershipStatus_idx" ON "LaptopListing"("ownershipStatus");

CREATE TABLE "LaptopOwnershipEvidence" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "documentType" "OwnershipDocumentType" NOT NULL,
  "cipherText" BYTEA NOT NULL,
  "iv" BYTEA NOT NULL,
  "authTag" BYTEA NOT NULL,
  "mimeType" TEXT NOT NULL,
  "byteLength" INTEGER NOT NULL,
  "uploadedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LaptopOwnershipEvidence_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "LaptopOwnershipEvidence_listingId_key" ON "LaptopOwnershipEvidence"("listingId");
ALTER TABLE "LaptopOwnershipEvidence" ADD CONSTRAINT "LaptopOwnershipEvidence_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "LaptopListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LaptopOwnershipReview" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "reviewerId" TEXT NOT NULL,
  "action" "OwnershipReviewStatus" NOT NULL,
  "note" TEXT NOT NULL,
  "serialMatched" BOOLEAN NOT NULL DEFAULT false,
  "provenanceChecked" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "LaptopOwnershipReview_pkey" PRIMARY KEY("id")
);
CREATE INDEX "LaptopOwnershipReview_listingId_createdAt_idx" ON "LaptopOwnershipReview"("listingId","createdAt");
ALTER TABLE "LaptopOwnershipReview" ADD CONSTRAINT "LaptopOwnershipReview_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "LaptopListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "LaptopSafetyReport" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "reporterId" TEXT NOT NULL,
  "reason" "LaptopReportReason" NOT NULL,
  "detail" TEXT NOT NULL,
  "status" "LaptopReportStatus" NOT NULL DEFAULT 'OPEN',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolvedAt" TIMESTAMP(3),
  CONSTRAINT "LaptopSafetyReport_pkey" PRIMARY KEY("id")
);
CREATE UNIQUE INDEX "LaptopSafetyReport_listingId_reporterId_key" ON "LaptopSafetyReport"("listingId","reporterId");
CREATE INDEX "LaptopSafetyReport_status_createdAt_idx" ON "LaptopSafetyReport"("status","createdAt");
ALTER TABLE "LaptopSafetyReport" ADD CONSTRAINT "LaptopSafetyReport_listingId_fkey"
  FOREIGN KEY ("listingId") REFERENCES "LaptopListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "LaptopSafetyReport" ADD CONSTRAINT "LaptopSafetyReport_reporterId_fkey"
  FOREIGN KEY ("reporterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Enforce one open listing per normalized private serial fingerprint, including under concurrent requests.
CREATE UNIQUE INDEX "LaptopListing_active_serial_fingerprint_unique"
ON "LaptopListing"("serialFingerprint")
WHERE "serialFingerprint" IS NOT NULL AND "status" <> 'CLOSED';
