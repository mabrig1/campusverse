import { z } from "zod";
import { prisma } from "./db.js";
import { requireAdminAuth } from "./auth.js";
import { requireTradingOwner } from "./trading-owner.js";
import { getPersonalStoreOwnerId, isStoreStock, PERSONAL_STORE_ONLY } from "./store-pilot.js";

const handler = fn => (req,res,next) => Promise.resolve(fn(req,res)).catch(next);
const schema = z.object({
  action: z.enum(["ADMIN_APPROVED","ACCEPTED","REJECTED_BY_ADMIN","COMPLETED","DISPUTED"]),
  note: z.string().trim().min(12).max(600),
  inspectionConfirmed: z.boolean().default(false),
  paymentConfirmed: z.boolean().default(false),
  handoverConfirmed: z.boolean().default(false),
}).strict();
const includes = {
  buyer: { select: { id: true, name: true, email: true } },
  target: { select: { id: true, deviceType: true, brand: true, model: true, price: true, sellerId: true, ownershipStatus: true, status: true,
    seller: { select: { name: true, email: true } } } },
  offered: { select: { id: true, deviceType: true, brand: true, model: true, price: true, sellerId: true, status: true, ownershipStatus: true } },
};
const available = d => !!d && d.status === "ACTIVE" && d.ownershipStatus === "REVIEWED";
export function registerDeviceOfferAdminRoutes(app) {
  app.get("/api/admin/v2/device-offers", requireAdminAuth, requireTradingOwner, handler(async (_req,res) => {
    const items = await prisma.laptopOffer.findMany({ include: includes, orderBy: { createdAt: "desc" }, take: 150 });
    res.setHeader("Cache-Control", "no-store"); res.json({ items });
  }));
  app.post("/api/admin/v2/device-offers/:id/decision", requireAdminAuth, requireTradingOwner, handler(async (req,res) => {
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message || "Invalid action" });
    const { action, note, inspectionConfirmed, paymentConfirmed, handoverConfirmed } = parsed.data;
    const offer = await prisma.laptopOffer.findUnique({ where: { id: req.params.id }, include: includes });
    if (!offer) return res.status(404).json({ error: "Offer not found" });
    if (PERSONAL_STORE_ONLY) {
      const ownerId = await getPersonalStoreOwnerId();
      if (!isStoreStock(offer.target, ownerId))
        return res.status(409).json({ error: "You can only manage transactions involving your acquired CampusVerse shop stock" });
    }
    if ((action === "ADMIN_APPROVED" || action === "COMPLETED" || action === "ACCEPTED") &&
        (!available(offer.target) || (offer.type === "SWAP" && (!available(offer.offered) || offer.offered.sellerId !== offer.buyerId))))
      return res.status(409).json({ error: "One or both devices are not approved or are no longer available" });
    if (action === "ACCEPTED" && !(PERSONAL_STORE_ONLY && ["PENDING","ADMIN_APPROVED"].includes(offer.status)))
      return res.status(409).json({ error: "Only the owner can directly accept an active offer on store stock" });
    if (action === "ADMIN_APPROVED" && offer.status !== "PENDING")
      return res.status(409).json({ error: "Only newly submitted offers can be owner-approved" });
    if (action === "COMPLETED") {
      if (offer.status !== "ACCEPTED") return res.status(409).json({ error: "Seller must agree before the owner can mark handover completed" });
      if (!inspectionConfirmed || !paymentConfirmed || !handoverConfirmed)
        return res.status(400).json({ error: "Confirm device inspection, independent receipt of payment and physical handover" });
    }
    if (action === "REJECTED_BY_ADMIN" && !["PENDING", "ADMIN_APPROVED"].includes(offer.status))
      return res.status(409).json({ error: "Offer cannot be rejected in its current state" });
    if (action === "DISPUTED" && !["ADMIN_APPROVED", "ACCEPTED"].includes(offer.status))
      return res.status(409).json({ error: "Only an active negotiated offer can be marked disputed" });
    const changed = await prisma.$transaction(async tx => {
      const result = await tx.laptopOffer.updateMany({
        where: { id: offer.id, status: offer.status },
        data: { status: action, adminReviewedAt: new Date(), adminNotes: note,
          ...(action === "COMPLETED" ? { completedAt: new Date() } : {}) },
      });
      if (!result.count) return false;
      await tx.deviceOfferAudit.create({ data: {
        offerId: offer.id, adminId: req.userId, action, note,
        inspectionConfirmed, paymentConfirmed, handoverConfirmed,
      } });
      if (action === "COMPLETED") {
        const ids = [offer.targetId, ...(offer.offeredId ? [offer.offeredId] : [])];
        await tx.laptopListing.updateMany({ where: { id: { in: ids } }, data: { status: "CLOSED" } });
        // On a completed swap, the buyer physically hands in their reviewed
        // device as part payment. Record it as newly acquired store stock.
        if (offer.type === "SWAP" && offer.offered) {
          const incoming = await tx.laptopListing.findUnique({ where: { id: offer.offeredId } });
          if (!incoming || incoming.ownershipStatus !== "REVIEWED" || incoming.storeInventory ||
              !incoming.identifierMatchedAt || incoming.sellerId !== offer.buyerId)
            throw new Error("Swap trade-in verification changed; completion cancelled");
          await tx.laptopListing.create({data:{
            sellerId: req.userId, deviceType: incoming.deviceType, brand: incoming.brand,
            model: incoming.model, processor: incoming.processor, ramGb: incoming.ramGb,
            storageGb: incoming.storageGb, storageType: incoming.storageType,
            condition: incoming.condition, batteryHealth: incoming.batteryHealth,
            faults: incoming.faults, description: incoming.description, imageUrl: incoming.imageUrl,
            serialLast4: incoming.serialLast4, serialFingerprint: incoming.serialFingerprint,
            lockStatus: incoming.lockStatus, ownershipDeclared: true, ownershipStatus: "REVIEWED",
            ownershipReviewedAt: new Date(), identifierMatchedAt: incoming.identifierMatchedAt,
            identifierMatchedBy: incoming.identifierMatchedBy,
            price: incoming.price, allowSwap: incoming.allowSwap, location: incoming.location,
            storeInventory: true, storeAcquiredAt: new Date(), originListingId: incoming.id,
            status: "PAUSED", // Owner prices and inspects the trade-in before public resale.
          }});
        }
        await tx.laptopOffer.updateMany({ where: {
          id: { not: offer.id }, status: { in: ["PENDING","ADMIN_APPROVED"] },
          OR: [{ targetId: { in: ids } }, { offeredId: { in: ids } }],
        }, data: { status: "DECLINED" } });
      }
      return true;
    });
    if (!changed) return res.status(409).json({ error: "Offer changed while processing; refresh" });
    res.json({ status: action, message: "Owner decision recorded and audited. Payment confirmation was manual, not from a bank API." });
  }));
}
