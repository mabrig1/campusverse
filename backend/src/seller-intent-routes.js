import express from "express";
import { randomBytes, timingSafeEqual } from "node:crypto";
import { prisma } from "./db.js";
import { requireAuth, requireAdminAuth } from "./auth.js";
import { requireTradingOwner } from "./trading-owner.js";
import {
  evidenceKey, encryptEvidence, decryptEvidence, recognizedSellerVideo,
  MAX_SELLER_VIDEO_BYTES, sellerVideoAAD,
} from "./laptop-ownership-crypto.js";

const asyncRoute = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const CHALLENGE_LIFETIME_MS = 10 * 60 * 1000;
const CHALLENGE_COOLDOWN_MS = 60 * 1000;
const HIDDEN = "private, no-store, max-age=0";
const deny = (res, status, message) => res.status(status).json({ error: message });
function eligible(listing, userId) {
  if (!listing) return { status: 404, error: "Listing not found" };
  if (listing.sellerId !== userId) return { status: 403, error: "This is not your device listing" };
  if (listing.status === "CLOSED" || ["FLAGGED","REVOKED"].includes(listing.ownershipStatus))
    return { status: 409, error: "This listing requires direct trading-desk assistance" };
  return null;
}
async function revokeOpenOffers(tx, id) {
  await tx.laptopOffer.updateMany({
    where: { targetId: id, status: { in: ["PENDING","ADMIN_APPROVED"] } },
    data: { status: "DECLINED" },
  });
  await tx.laptopOffer.updateMany({
    where: { offeredId: id, status: { in: ["PENDING","ADMIN_APPROVED"] } },
    data: { status: "WITHDRAWN" },
  });
}
function securePrivateDownload(res, proof, key, listingId) {
  let bytes;
  try {
    bytes = decryptEvidence(proof, key, sellerVideoAAD(listingId));
  } catch {
    return deny(res, 503, "Private recording cannot be decrypted with the configured key");
  }
  res.setHeader("Cache-Control", HIDDEN);
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Content-Security-Policy", "default-src 'none'; sandbox");
  res.setHeader("Content-Disposition", 'attachment; filename="seller-authorisation.' +
    (proof.mimeType === "video/mp4" ? "mp4" : "webm") + '"');
  res.setHeader("Content-Type", "application/octet-stream");
  return res.send(bytes);
}

export function registerSellerIntentRoutes(app) {
  // The seller must deliberately start each recording. A fresh one-time challenge
  // makes reusing an old video harder; it is not automatic face/liveness verification.
  app.post("/api/laptops/:id/seller-video-challenge", requireAuth, asyncRoute(async (req,res) => {
    res.setHeader("Cache-Control", HIDDEN);
    const listing = await prisma.laptopListing.findUnique({
      where: { id: req.params.id },
      select: { id: true, sellerId: true, status: true, ownershipStatus: true,
        brand: true, model: true, serialLast4: true,
        ownershipEvidence: { select: { id: true } } },
    });
    const blocked = eligible(listing, req.userId);
    if (blocked) return deny(res, blocked.status, blocked.error);
    if (!listing.ownershipEvidence) return deny(res, 409, "Submit your ownership receipt or lawful transfer document first");

    const current = await prisma.laptopSellerVideoChallenge.findUnique({ where: { listingId: listing.id } });
    const now = Date.now();
    if (current && now - new Date(current.issuedAt).getTime() < CHALLENGE_COOLDOWN_MS) {
      return deny(res, 429, "A challenge was just issued. Use it or try again after one minute.");
    }
    const code = randomBytes(4).toString("hex").toUpperCase();
    const expiresAt = new Date(now + CHALLENGE_LIFETIME_MS);
    await prisma.$transaction(async tx => {
      await tx.laptopSellerVideoChallenge.upsert({
        where: { listingId: listing.id },
        create: { listingId: listing.id, challenge: code, expiresAt, issuedAt: new Date(now) },
        update: { challenge: code, expiresAt, issuedAt: new Date(now) },
      });
      await tx.laptopSellerVideoEvidence.deleteMany({ where: { listingId: listing.id } });
      // Requesting a new video invalidates any previous proof approval immediately.
      await tx.laptopListing.update({ where: { id: listing.id },
        data: { ownershipStatus: "PENDING", ownershipReviewedAt: null,
          ownershipReviewNote: null, identifierMatchedAt: null, identifierMatchedBy: null } });
      await revokeOpenOffers(tx, listing.id);
    });
    return res.json({
      challenge: code, expiresAt: expiresAt.toISOString(),
      prompt: "I personally authorise selling or swapping my " + listing.brand + " " + listing.model +
        " on CampusVerse. Its serial or IMEI ends " + (listing.serialLast4 || "unknown") +
        ". My one-time challenge is " + code + ".",
      message: "Record yourself with the front camera saying the statement and code clearly. Videos are private and manually reviewed.",
    });
  }));

  app.post("/api/laptops/:id/seller-video", requireAuth,
    express.raw({ type: "application/octet-stream", limit: "2mb" }),
    asyncRoute(async (req,res) => {
      res.setHeader("Cache-Control", HIDDEN);
      let key;
      try { key = evidenceKey(); } catch {
        return deny(res, 503, "Encrypted seller recording storage is not configured");
      }
      const consent = req.get("x-seller-video-consent");
      if (consent !== "yes") return deny(res, 400, "Explicit consent to private video review is required");
      const suppliedCode = String(req.get("x-seller-video-challenge") || "").trim().toUpperCase();
      if (!/^[A-F0-9]{8}$/.test(suppliedCode)) return deny(res,400,"Missing or invalid one-time challenge");
      const declaredMime = String(req.get("x-seller-video-mime") || "");
      if (!Buffer.isBuffer(req.body) || req.body.length < 16 || req.body.length > MAX_SELLER_VIDEO_BYTES)
        return deny(res, 413, "Record a short selfie video smaller than 2 MB");
      const actualMime = recognizedSellerVideo(req.body);
      if (!actualMime || declaredMime !== actualMime)
        return deny(res, 415, "Video format must be WebM or MP4 from the camera recorder");
      const listing = await prisma.laptopListing.findUnique({
        where: { id: req.params.id },
        select: { sellerId: true, ownershipStatus: true, status: true, ownershipEvidence: { select: { id:true } } },
      });
      const blocked = eligible(listing,req.userId);
      if (blocked) return deny(res,blocked.status,blocked.error);
      if (!listing.ownershipEvidence) return deny(res,409,"Upload ownership evidence before a selfie video");
      const challenge = await prisma.laptopSellerVideoChallenge.findUnique({ where: { listingId: req.params.id } });
      if (!challenge || challenge.expiresAt.getTime() <= Date.now()) return deny(res,409,"Challenge expired; request a new live recording");
      const left=Buffer.from(challenge.challenge,"utf8"),right=Buffer.from(suppliedCode,"utf8");
      if (left.length !== right.length || !timingSafeEqual(left,right))
        return deny(res,409,"The video challenge does not match the current listing");
      const encrypted = encryptEvidence(req.body,key,sellerVideoAAD(req.params.id));
      await prisma.$transaction(async tx => {
        // A serialised update and challenge consumption prevent replay after upload.
        const consumed = await tx.laptopSellerVideoChallenge.deleteMany({
          where: { listingId: req.params.id, challenge: suppliedCode, expiresAt: { gt: new Date() } },
        });
        if (!consumed.count) throw Object.assign(new Error("Recording challenge already used or expired"), { status: 409 });
        await tx.laptopSellerVideoEvidence.upsert({
          where: { listingId: req.params.id },
          create: { listingId: req.params.id, ...encrypted, mimeType: actualMime,
            byteLength: req.body.length, challenge: suppliedCode, consentedAt: new Date() },
          update: { ...encrypted, mimeType: actualMime, byteLength: req.body.length,
            challenge: suppliedCode, consentedAt: new Date(), uploadedAt: new Date() },
        });
        await tx.laptopListing.update({ where: { id: req.params.id },
          data: { ownershipStatus: "PENDING", ownershipReviewedAt: null } });
        await revokeOpenOffers(tx,req.params.id);
      }).catch(error => {
        if (error.status === 409) return deny(res,409,error.message);
        throw error;
      });
      if (res.headersSent) return;
      return res.status(201).json({
        ownershipStatus: "PENDING", videoReceived: true,
        message: "Your fresh seller-authorisation video is encrypted and awaiting private owner review. This is not automatic identity verification.",
      });
    }));

  app.delete("/api/laptops/:id/seller-video", requireAuth, asyncRoute(async (req,res) => {
    const listing = await prisma.laptopListing.findUnique({
      where: { id: req.params.id }, select: { sellerId: true, ownershipStatus: true, status: true },
    });
    if (!listing) return deny(res,404,"Listing not found");
    if (listing.sellerId !== req.userId) return deny(res,403,"Only the listing seller may erase the recording");
    await prisma.$transaction(async tx => {
      await tx.laptopSellerVideoEvidence.deleteMany({ where: { listingId: req.params.id } });
      await tx.laptopSellerVideoChallenge.deleteMany({ where: { listingId: req.params.id } });
      await tx.laptopListing.update({ where: { id: req.params.id }, data: {
        ownershipStatus: ["FLAGGED","REVOKED"].includes(listing.ownershipStatus) ? listing.ownershipStatus : "NOT_SUBMITTED",
        ownershipReviewedAt: null, identifierMatchedAt: null, identifierMatchedBy: null, ownershipReviewNote: null,
      } });
      await revokeOpenOffers(tx, req.params.id);
    });
    res.setHeader("Cache-Control", HIDDEN);
    res.json({ message: "Private selfie video erased; listing approval revoked. Existing review records remain for dispute handling." });
  }));

  app.get("/api/admin/v2/laptop-ownership/:id/seller-video",
    requireAdminAuth, requireTradingOwner, asyncRoute(async (req,res) => {
      let key;
      try { key = evidenceKey(); } catch { return deny(res,503,"Encrypted video access not configured"); }
      const recording = await prisma.laptopSellerVideoEvidence.findUnique({ where: { listingId: req.params.id } });
      if (!recording) return deny(res,404,"No seller authorisation video has been submitted");
      return securePrivateDownload(res,recording,key,req.params.id);
    }));
}
