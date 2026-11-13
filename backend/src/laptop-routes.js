import { z } from "zod";
import { prisma } from "./db.js";
import { requireAuth } from "./auth.js";
import { evidenceKey, normalizedDeviceIdentifier, serialFingerprint } from "./laptop-ownership-crypto.js";

const amount = z.number().finite().min(-100_000_000).max(100_000_000);
const listingSchema = z.object({
  deviceType: z.enum(["LAPTOP", "PHONE"]),
  brand: z.string().trim().min(2).max(60),
  model: z.string().trim().min(2).max(100),
  processor: z.string().trim().max(100).default("Not disclosed"),
  ramGb: z.number().int().min(0).max(512),
  storageGb: z.number().int().min(16).max(16384),
  storageType: z.enum(["SSD", "HDD", "EMMC", "INTERNAL"]),
  condition: z.enum(["EXCELLENT", "GOOD", "FAIR", "NEEDS_REPAIR"]),
  batteryHealth: z.number().int().min(0).max(100).nullable().optional(),
  faults: z.string().trim().min(3).max(600),
  description: z.string().trim().max(2000).default(""),
  imageUrl: z.union([z.url().startsWith("https://").max(2000), z.literal("")]).optional(),
  serialNumber: z.string().trim().min(6).max(50),
  lockStatus: z.enum(["NOT_CHECKED", "DECLARED_CLEAR"]),
  ownershipDeclared: z.literal(true),
  price: z.number().finite().min(1000).max(100_000_000),
  allowSwap: z.boolean(),
  location: z.string().trim().min(2).max(120),
}).strict();
const offerSchema = z.object({
  type: z.enum(["BUY", "SWAP"]),
  offeredId: z.string().optional().nullable(),
  amount,
  note: z.string().trim().max(400).default(""),
}).strict();
const statusSchema = z.object({ status: z.enum(["ACTIVE", "PAUSED", "CLOSED"]) }).strict();
const decisionSchema = z.object({ status: z.enum(["ACCEPTED", "DECLINED", "WITHDRAWN"]) }).strict();
const sellerName = { seller: { select: { id: true, name: true } } };
const ownerView = {
  seller: { select: { id: true, name: true } },
  ownershipEvidence: { select: { documentType: true, uploadedAt: true, byteLength: true } },
};
// Never publish or return serial fingerprints, private reviewer comments or proof documents.
const withoutPrivateFields = ({ serialFingerprint, ownershipReviewNote, ...safe }) => safe;
const isReviewed = (item) => item.status === "ACTIVE" && item.ownershipStatus === "REVIEWED";
const offerIncludes = {
  buyer: { select: { id: true, name: true } },
  target: { select: { id: true, brand: true, model: true, price: true, sellerId: true } },
  offered: { select: { id: true, brand: true, model: true, price: true } },
};
const fail = (res, parsed) => res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid input" });
const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);

export function registerLaptopRoutes(app) {
  // These are seller advertisements, not inspected, authenticated, or certified devices.
  app.get("/api/laptops", asyncRoute(async (req, res) => {
    const q = String(req.query.q || "").trim().slice(0, 100);
    const condition = String(req.query.condition || "");
    if (condition && !["EXCELLENT", "GOOD", "FAIR", "NEEDS_REPAIR"].includes(condition))
      return res.status(400).json({ error: "Invalid condition" });
    const where = {
      status: "ACTIVE",
      ownershipStatus: "REVIEWED",
      ...(condition ? { condition } : {}),
      ...(["PHONE", "LAPTOP"].includes(req.query.deviceType) ? { deviceType: req.query.deviceType } : {}),
      ...(req.query.swap === "true" ? { allowSwap: true } : {}),
      ...(q ? { OR: [
        { brand: { contains: q, mode: "insensitive" } },
        { model: { contains: q, mode: "insensitive" } },
        { processor: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } },
      ] } : {}),
    };
    const items = await prisma.laptopListing.findMany({
      where, include: sellerName, orderBy: { createdAt: "desc" }, take: 40,
    });
    res.json({ items: items.map(withoutPrivateFields) });
  }));

  app.get("/api/laptops/mine", requireAuth, asyncRoute(async (req, res) => {
    const items = await prisma.laptopListing.findMany({
      where: { sellerId: req.userId }, include: ownerView, orderBy: { createdAt: "desc" }, take: 100,
    });
    res.json({ items: items.map(withoutPrivateFields) });
  }));

  app.get("/api/laptops/offers", requireAuth, asyncRoute(async (req, res) => {
    const items = await prisma.laptopOffer.findMany({
      where: { OR: [{ buyerId: req.userId }, { target: { is: { sellerId: req.userId } }, status: { not: "PENDING" } }] },
      include: offerIncludes, orderBy: { createdAt: "desc" }, take: 100,
    });
    res.json({ items });
  }));

  app.post("/api/laptops", requireAuth, asyncRoute(async (req, res) => {
    const parsed = listingSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed);
    let serial, fingerprint;
    try {
      serial = normalizedDeviceIdentifier(parsed.data.deviceType, parsed.data.serialNumber);
      fingerprint = serialFingerprint(serial, evidenceKey(), parsed.data.deviceType);
    } catch (error) {
      return res.status(error.message.includes("not configured") ? 503 : 400).json({ error: error.message });
    }
    const { imageUrl, serialNumber, ...data } = parsed.data;
    const conflicting = await prisma.laptopListing.findFirst({
      where: { serialFingerprint: fingerprint, status: { not: "CLOSED" } },
      select: { id: true },
    });
    if (conflicting) return res.status(409).json({ error: "This device is already listed. Contact support if you are the lawful new owner." });
    try {
      const item = await prisma.laptopListing.create({
        data: { ...data, imageUrl: imageUrl || null, serialLast4: serial.slice(-4),
          serialFingerprint: fingerprint, ownershipStatus: "NOT_SUBMITTED", sellerId: req.userId },
      });
      res.status(201).json(withoutPrivateFields(item));
    } catch (error) {
      if (error.code === "P2002") return res.status(409).json({ error: "This device is already listed" });
      throw error;
    }
  }));

  app.patch("/api/laptops/:id/status", requireAuth, asyncRoute(async (req, res) => {
    const parsed = statusSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed);
    const existing = await prisma.laptopListing.findUnique({ where: { id: req.params.id } });
    if (!existing) return res.status(404).json({ error: "Laptop listing not found" });
    if (existing.sellerId !== req.userId) return res.status(403).json({ error: "Not your listing" });
    const item = await prisma.$transaction(async (tx) => {
      const updated = await tx.laptopListing.update({
        where: { id: existing.id, sellerId: req.userId }, data: { status: parsed.data.status },
      });
      if (parsed.data.status !== "ACTIVE") {
        await tx.laptopOffer.updateMany({
          where: { targetId: existing.id, status: { in: ["PENDING", "ADMIN_APPROVED"] } }, data: { status: "DECLINED" },
        });
        // Pending outgoing swaps are no longer valid when the offered laptop is paused/closed.
        await tx.laptopOffer.updateMany({
          where: { offeredId: existing.id, status: { in: ["PENDING", "ADMIN_APPROVED"] } }, data: { status: "WITHDRAWN" },
        });
      }
      return updated;
    });
    res.json(withoutPrivateFields(item));
  }));

  app.post("/api/laptops/:id/offers", requireAuth, asyncRoute(async (req, res) => {
    const parsed = offerSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed);
    const { type, offeredId, amount: offerAmount, note } = parsed.data;
    const target = await prisma.laptopListing.findUnique({ where: { id: req.params.id } });
    if (!target || !isReviewed(target)) return res.status(404).json({ error: "Listing unavailable until ownership documents have been reviewed" });
    if (target.sellerId === req.userId) return res.status(403).json({ error: "You cannot bid on your own laptop" });
    if (type === "BUY" && (offeredId || offerAmount < 1000))
      return res.status(400).json({ error: "Provide a cash offer of at least ₦1,000 without a swap device" });
    if (type === "SWAP") {
      if (!target.allowSwap) return res.status(400).json({ error: "Seller is not accepting swaps" });
      if (!offeredId) return res.status(400).json({ error: "Choose your own active laptop listing" });
      const offered = await prisma.laptopListing.findUnique({ where: { id: offeredId } });
      if (!offered || offered.sellerId !== req.userId || !isReviewed(offered))
        return res.status(400).json({ error: "Swap device must be your own active listing" });
    }
    const outstanding = await prisma.laptopOffer.count({
      where: { buyerId: req.userId, status: { in: ["PENDING", "ADMIN_APPROVED"] } },
    });
    if (outstanding >= 10) return res.status(429).json({ error: "You have ten open offers. Withdraw or complete an offer before submitting another." });
    const item = await prisma.laptopOffer.create({
      data: { type, amount: offerAmount, note, offeredId: type === "SWAP" ? offeredId : null, targetId: target.id, buyerId: req.userId },
    });
    res.status(201).json({ ...item, message: "Offer sent for discussion and in-person inspection; no payment or transfer has occurred." });
  }));

  app.patch("/api/laptops/offers/:id", requireAuth, asyncRoute(async (req, res) => {
    const parsed = decisionSchema.safeParse(req.body);
    if (!parsed.success) return fail(res, parsed);
    const offer = await prisma.laptopOffer.findUnique({
      where: { id: req.params.id }, include: {
        target: { select: { sellerId: true, status: true, ownershipStatus: true } },
        offered: { select: { sellerId: true, status: true, ownershipStatus: true } },
      },
    });
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    const isBuyer = offer.buyerId === req.userId;
    const isSeller = offer.target.sellerId === req.userId;
    if (parsed.data.status === "WITHDRAWN" ? !isBuyer : !isSeller)
      return res.status(403).json({ error: "Not authorised for this offer action" });
    if (!["PENDING", "ADMIN_APPROVED"].includes(offer.status)) return res.status(409).json({ error: "Offer is no longer pending" });
    if (parsed.data.status === "ACCEPTED" && (offer.status !== "ADMIN_APPROVED" || !isSeller))
      return res.status(409).json({ error: "The marketplace owner must approve the offer before the seller can agree" });
    if (parsed.data.status === "DECLINED" && (offer.status !== "ADMIN_APPROVED" || !isSeller))
      return res.status(409).json({ error: "Only owner-approved offers can be declined by the seller" });
    if (parsed.data.status === "ACCEPTED" &&
        (!isReviewed(offer.target) ||
          (offer.type === "SWAP" && (!offer.offered || !isReviewed(offer.offered) || offer.offered.sellerId !== offer.buyerId)))) {
      return res.status(409).json({ error: "One of the laptops is no longer available for this offer" });
    }
    const result = await prisma.laptopOffer.updateMany({
      where: { id: offer.id, status: offer.status }, data: { status: parsed.data.status },
    });
    if (!result.count) return res.status(409).json({ error: "Offer changed; reload and try again" });
    res.json({ status: parsed.data.status, message: "Offer status updated. This does not exchange funds or transfer ownership." });
  }));
}
