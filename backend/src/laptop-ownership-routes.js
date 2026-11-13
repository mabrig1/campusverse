import express from "express";
import { timingSafeEqual } from "node:crypto";
import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth, requireAdminAuth } from "./auth.js";
import { requireTradingOwner } from "./trading-owner.js";
import { MAX_EVIDENCE_BYTES, PROOF_TYPES, evidenceKey, recognizedOwnershipDocument, encryptEvidence, decryptEvidence, normalizedDeviceIdentifier, serialFingerprint } from "./laptop-ownership-crypto.js";

const safe = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const invalid = (res, parsed) => res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
const reportSchema = z.object({
  reason: z.enum(["SUSPECTED_STOLEN", "FALSE_DETAILS", "LOCKED_DEVICE", "OTHER"]),
  detail: z.string().trim().min(10).max(500),
}).strict();
const reviewSchema = z.object({
  decision: z.enum(["REVIEWED", "NEEDS_MORE_INFO", "REJECTED", "REVOKED"]),
  note: z.string().trim().min(12).max(600),
  serialMatched: z.boolean().default(false),
  provenanceChecked: z.boolean().default(false),
  sellerIntentConfirmed: z.boolean().default(false),
}).strict();

const metadataSelect = {
  id: true, deviceType: true, brand: true, model: true, serialLast4: true, location: true, status: true,
  ownershipStatus: true, ownershipReviewedAt: true, identifierMatchedAt: true, createdAt: true,
  ownershipEvidence: { select: { id: true, documentType: true, mimeType: true, byteLength: true, uploadedAt: true } },
  sellerVideoEvidence: { select: { id: true, mimeType: true, byteLength: true, challenge: true, uploadedAt: true, consentedAt: true } },
  seller: { select: { id: true, name: true, email: true } },
};
const isMissingKey = error => error.message === "Ownership evidence storage not configured";
function cancelPendingOffers(tx, id) {
  return Promise.all([
    tx.laptopOffer.updateMany({ where: { targetId: id, status: { in: ["PENDING", "ADMIN_APPROVED"] } }, data: { status: "DECLINED" } }),
    tx.laptopOffer.updateMany({ where: { offeredId: id, status: { in: ["PENDING", "ADMIN_APPROVED"] } }, data: { status: "WITHDRAWN" } }),
  ]);
}

export function registerLaptopOwnershipRoutes(app) {
  // Raw uploads are not put into object storage, server logs, or public asset URLs.
  app.post("/api/laptops/:id/ownership-proof", requireAuth,
    express.raw({ type: "application/octet-stream", limit: "2mb" }),
    safe(async (req, res) => {
      let key;
      try { key = evidenceKey(); } catch (e) {
        if (isMissingKey(e)) return res.status(503).json({ error: "Private ownership document storage is not configured" });
        throw e;
      }
      const type = String(req.get("x-ownership-document-type") || "").trim();
      if (!PROOF_TYPES.includes(type)) return res.status(400).json({ error: "Choose a supported ownership document type" });
      if (!Buffer.isBuffer(req.body) || !req.body.length || req.body.length > MAX_EVIDENCE_BYTES)
        return res.status(400).json({ error: "Upload a JPEG, PNG or PDF ownership document smaller than 2 MB" });
      const mimeType = recognizedOwnershipDocument(req.body);
      if (!mimeType) return res.status(415).json({ error: "Only JPEG, PNG and PDF ownership documents are accepted" });
      const listing = await prisma.laptopListing.findUnique({ where: { id: req.params.id }, select: { sellerId: true, status: true, ownershipStatus: true } });
      if (!listing) return res.status(404).json({ error: "Laptop listing not found" });
      if (listing.sellerId !== req.userId) return res.status(403).json({ error: "Only the listing owner can submit a document" });
      if (listing.status === "CLOSED" || ["FLAGGED", "REVOKED"].includes(listing.ownershipStatus))
        return res.status(409).json({ error: "This listing requires administrator assistance before a new submission" });
      const encrypted = encryptEvidence(req.body, key, req.params.id);
      await prisma.$transaction(async tx => {
        await tx.laptopOwnershipEvidence.upsert({
          where: { listingId: req.params.id },
          create: { listingId: req.params.id, documentType: type, ...encrypted, mimeType, byteLength: req.body.length },
          update: { documentType: type, ...encrypted, mimeType, byteLength: req.body.length, uploadedAt: new Date() },
        });
        // Replacing the ownership document requires a fresh authorisation video.
        await tx.laptopSellerVideoEvidence.deleteMany({ where: { listingId: req.params.id } });
        await tx.laptopSellerVideoChallenge.deleteMany({ where: { listingId: req.params.id } });
        await tx.laptopListing.update({
          where: { id: req.params.id, sellerId: req.userId },
          data: { ownershipStatus: "PENDING", ownershipReviewedAt: null, ownershipReviewNote: null, identifierMatchedAt: null, identifierMatchedBy: null },
        });
        await cancelPendingOffers(tx, req.params.id);
      });
      res.status(201).json({ ownershipStatus: "PENDING", message: "Private document received; listing is hidden until an administrator reviews it." });
    })
  );

  app.delete("/api/laptops/:id/ownership-proof", requireAuth, safe(async (req, res) => {
    const listing = await prisma.laptopListing.findUnique({ where: { id: req.params.id }, select: { sellerId: true, ownershipStatus: true } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.sellerId !== req.userId) return res.status(403).json({ error: "Only the seller may erase this document" });
    const transferred=await prisma.storeIntakeQuote.findUnique({where:{listingId:req.params.id},select:{status:true}});
    if (transferred?.status==="ACQUIRED") return res.status(409).json({error:"This proof supports a completed store purchase. Contact management to request lawful deletion or correction."});
    await prisma.$transaction(async tx => {
      await tx.laptopOwnershipEvidence.deleteMany({ where: { listingId: req.params.id } });
      await tx.laptopSellerVideoEvidence.deleteMany({ where: { listingId: req.params.id } });
      await tx.laptopSellerVideoChallenge.deleteMany({ where: { listingId: req.params.id } });
      await tx.laptopListing.update({
        where: { id: req.params.id },
        data: {
          ownershipStatus: ["FLAGGED", "REVOKED"].includes(listing.ownershipStatus) ? listing.ownershipStatus : "NOT_SUBMITTED",
          ownershipReviewedAt: null, ownershipReviewNote: null, identifierMatchedAt: null, identifierMatchedBy: null,
        },
      });
      await cancelPendingOffers(tx, req.params.id);
    });
    res.json({ message: "Private evidence erased and public visibility revoked. Review history remains for dispute audit." });
  }));

  app.post("/api/laptops/:id/safety-report", requireAuth, safe(async (req, res) => {
    const parsed = reportSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, parsed);
    const listing = await prisma.laptopListing.findUnique({ where: { id: req.params.id }, select: { id: true, sellerId: true, ownershipStatus: true } });
    if (!listing) return res.status(404).json({ error: "Listing not found" });
    if (listing.sellerId === req.userId) return res.status(403).json({ error: "Cannot report your own listing" });
    // One report per user and listing. A suspected stolen device is quarantined pending admin review.
    try {
      const record = await prisma.$transaction(async tx => {
        const created = await tx.laptopSafetyReport.create({
          data: { listingId: req.params.id, reporterId: req.userId, ...parsed.data },
        });
        if (parsed.data.reason === "SUSPECTED_STOLEN" && listing.ownershipStatus !== "REVOKED") {
          await tx.laptopListing.update({ where: { id: req.params.id }, data: { ownershipStatus: "FLAGGED", ownershipReviewedAt: null } });
          await cancelPendingOffers(tx, req.params.id);
        }
        return created;
      });
      res.status(201).json({ id: record.id, message: "Confidential safety report recorded for administrator review." });
    } catch (error) {
      if (error.code === "P2002") return res.status(409).json({ error: "You already reported this laptop" });
      throw error;
    }
  }));

  // Admin endpoints re-check current DB role and require an 8-hour admin-scoped token.
  app.get("/api/admin/v2/laptop-ownership", requireAdminAuth, requireTradingOwner, safe(async (req, res) => {
    const records = await prisma.laptopListing.findMany({
      where: { ownershipStatus: { in: ["PENDING", "NEEDS_MORE_INFO", "REJECTED", "FLAGGED", "REVOKED"] } },
      select: metadataSelect, orderBy: { updatedAt: "desc" }, take: 80,
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({ items: records });
  }));

  app.get("/api/admin/v2/laptop-reports", requireAdminAuth, requireTradingOwner, safe(async (req, res) => {
    const records = await prisma.laptopSafetyReport.findMany({
      where: { status: "OPEN" }, take: 80, orderBy: { createdAt: "desc" },
      select: {
        id: true, reason: true, detail: true, createdAt: true, status: true,
        listing: { select: { id: true, brand: true, model: true, ownershipStatus: true } },
      },
    });
    res.setHeader("Cache-Control", "no-store");
    res.json({ items: records });
  }));

  app.post("/api/admin/v2/laptop-ownership/:id/match-identifier", requireAdminAuth, requireTradingOwner, safe(async (req, res) => {
    const parsed = z.object({ identifier: z.string().min(6).max(50) }).strict().safeParse(req.body);
    if (!parsed.success) return invalid(res, parsed);
    const listing = await prisma.laptopListing.findUnique({ where: { id: req.params.id },
      select: { deviceType: true, serialFingerprint: true, ownershipStatus: true, status: true } });
    if (!listing) return res.status(404).json({ error: "Device not found" });
    if (listing.status === "CLOSED" || !["PENDING", "NEEDS_MORE_INFO", "FLAGGED"].includes(listing.ownershipStatus))
      return res.status(409).json({ error: "Device is not awaiting fresh review" });
    let matched = false;
    try {
      const identifier = normalizedDeviceIdentifier(listing.deviceType, parsed.data.identifier);
      const fingerprint = serialFingerprint(identifier, evidenceKey(), listing.deviceType);
      if (listing.serialFingerprint) {
        const left = Buffer.from(fingerprint, "hex"), right = Buffer.from(listing.serialFingerprint, "hex");
        matched = left.length === right.length && timingSafeEqual(left, right);
      }
    } catch (error) {
      return res.status(error.message.includes("not configured") ? 503 : 400).json({ error: error.message });
    }
    if (matched) await prisma.laptopListing.update({ where: { id: req.params.id },
      data: { identifierMatchedAt: new Date(), identifierMatchedBy: req.userId } });
    res.setHeader("Cache-Control","no-store");
    res.json({ match: matched, message: matched
      ? "Identifier matches the original listing. Inspect possession and lawful transfer history separately."
      : "Identifier mismatch: do not approve until investigated." });
  }));

  app.get("/api/admin/v2/laptop-ownership/:id/document", requireAdminAuth, requireTradingOwner, safe(async (req, res) => {
    let key;
    try { key = evidenceKey(); } catch (e) {
      if (isMissingKey(e)) return res.status(503).json({ error: "Encrypted document retrieval not configured" });
      throw e;
    }
    const proof = await prisma.laptopOwnershipEvidence.findUnique({ where: { listingId: req.params.id } });
    if (!proof) return res.status(404).json({ error: "No ownership document for this listing" });
    let bytes;
    try { bytes = decryptEvidence(proof, key, req.params.id); } catch {
      return res.status(503).json({ error: "Cannot decrypt document with current key; contact a system administrator" });
    }
    res.setHeader("Cache-Control", "private, no-store");
    res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Content-Type", "application/octet-stream");
    res.setHeader("Content-Disposition", "attachment; filename=\"ownership-evidence." + (proof.mimeType === "application/pdf" ? "pdf" : proof.mimeType === "image/png" ? "png" : "jpg") + "\"");
    res.send(bytes);
  }));

  app.post("/api/admin/v2/laptop-ownership/:id/review", requireAdminAuth, requireTradingOwner, safe(async (req, res) => {
    const parsed = reviewSchema.safeParse(req.body);
    if (!parsed.success) return invalid(res, parsed);
    const { decision, note, serialMatched, provenanceChecked, sellerIntentConfirmed } = parsed.data;
    const record = await prisma.laptopListing.findUnique({
      where: { id: req.params.id }, include: { ownershipEvidence: { select: { id: true } }, sellerVideoEvidence: { select: { id: true, challenge: true } } },
    });
    if (!record) return res.status(404).json({ error: "Listing not found" });
    if (decision === "REVIEWED") {
      if (!record.ownershipEvidence || !record.sellerVideoEvidence || !sellerIntentConfirmed || !record.serialFingerprint || !record.identifierMatchedAt || !serialMatched || !provenanceChecked)
        return res.status(409).json({ error: "Ownership document, fresh seller-authorisation selfie video, physical serial match and provenance review are all required for approval" });
      if (record.status === "CLOSED") return res.status(409).json({ error: "Closed listings cannot be approved" });
      if (!["PENDING", "NEEDS_MORE_INFO", "FLAGGED", "REJECTED", "REVOKED"].includes(record.ownershipStatus))
        return res.status(409).json({ error: "This listing is not awaiting review" });
      const conflict = await prisma.laptopListing.findFirst({
        where: { id: { not: record.id }, serialFingerprint: record.serialFingerprint, status: { not: "CLOSED" } },
        select: { id: true },
      });
      if (conflict) return res.status(409).json({ error: "Duplicate device fingerprint on another open listing. Investigate before approving." });
    }
    await prisma.$transaction(async tx => {
      // Recheck sensitive evidence in the same transaction before granting access.
      if (decision === "REVIEWED") {
        const [document, video] = await Promise.all([
          tx.laptopOwnershipEvidence.findUnique({ where: { listingId: record.id }, select: { id: true } }),
          tx.laptopSellerVideoEvidence.findUnique({ where: { listingId: record.id }, select: { id: true } }),
        ]);
        if (!document || !video) throw Object.assign(new Error("Owner evidence changed during review"), { status: 409 });
      }
      await tx.laptopOwnershipReview.create({
        data: { listingId: record.id, reviewerId: req.userId, action: decision, note, serialMatched, provenanceChecked, sellerIntentConfirmed },
      });
      await tx.laptopListing.update({
        where: { id: record.id }, data: {
          ownershipStatus: decision, ownershipReviewedAt: decision === "REVIEWED" ? new Date() : null,
          ownershipReviewNote: note,
        },
      });
      if (decision !== "REVIEWED") await cancelPendingOffers(tx, record.id);
    });
    res.json({ ownershipStatus: decision, message: "Documents and seller-authorisation video reviewed. This is not official stolen-device clearance or automated identity verification." });
  }));

  app.post("/api/admin/v2/laptop-reports/:id/resolve", requireAdminAuth, requireTradingOwner, safe(async (req, res) => {
    const record = await prisma.laptopSafetyReport.findUnique({ where: { id: req.params.id } });
    if (!record) return res.status(404).json({ error: "Report not found" });
    const updated = await prisma.laptopSafetyReport.updateMany({
      where: { id: record.id, status: "OPEN" },
      data: { status: "RESOLVED", resolvedAt: new Date() },
    });
    if (!updated.count) return res.status(409).json({ error: "Report already resolved" });
    res.json({ message: "Report marked handled. This does not automatically restore a flagged listing." });
  }));
}
