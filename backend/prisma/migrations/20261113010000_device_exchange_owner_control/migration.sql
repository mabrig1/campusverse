CREATE TYPE "DeviceType" AS ENUM ('LAPTOP','PHONE');
ALTER TABLE "LaptopListing" ADD COLUMN "deviceType" "DeviceType" NOT NULL DEFAULT 'LAPTOP';
ALTER TYPE "LaptopOfferStatus" ADD VALUE IF NOT EXISTS 'ADMIN_APPROVED';
ALTER TYPE "LaptopOfferStatus" ADD VALUE IF NOT EXISTS 'COMPLETED';
ALTER TYPE "LaptopOfferStatus" ADD VALUE IF NOT EXISTS 'REJECTED_BY_ADMIN';
ALTER TYPE "LaptopOfferStatus" ADD VALUE IF NOT EXISTS 'DISPUTED';
ALTER TABLE "LaptopOffer"
  ADD COLUMN "adminReviewedAt" TIMESTAMP(3),
  ADD COLUMN "completedAt" TIMESTAMP(3),
  ADD COLUMN "adminNotes" TEXT;
CREATE TABLE "DeviceOfferAudit" (
  "id" TEXT NOT NULL,
  "offerId" TEXT NOT NULL,
  "adminId" TEXT NOT NULL,
  "action" "LaptopOfferStatus" NOT NULL,
  "note" TEXT NOT NULL,
  "inspectionConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "paymentConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "handoverConfirmed" BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DeviceOfferAudit_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "DeviceOfferAudit_offerId_createdAt_idx" ON "DeviceOfferAudit"("offerId","createdAt");
ALTER TABLE "DeviceOfferAudit" ADD CONSTRAINT "DeviceOfferAudit_offerId_fkey"
  FOREIGN KEY ("offerId") REFERENCES "LaptopOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
