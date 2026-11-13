import { prisma } from "./db.js";

// First-launch business model: one shop, owned and operated by the designated admin.
// No time-based auto-opening and no independent seller storefront permissions.
export const PERSONAL_STORE_ONLY = process.env.CAMPUSVERSE_PERSONAL_STORE_ONLY !== "false";

export async function getPersonalStoreOwnerId(tx = prisma) {
  const email = String(process.env.TRADING_OWNER_EMAIL || "").trim();
  if (!email) return null;
  const owner = await tx.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, role: "ADMIN" },
    select: { id: true },
  });
  return owner?.id || null;
}

export function isStoreStock(item, ownerId) {
  return !!ownerId && !!item && item.sellerId === ownerId &&
    item.storeInventory === true && item.status === "ACTIVE" &&
    item.ownershipStatus === "REVIEWED" && !!item.storeAcquiredAt;
}

export function storeNotice() {
  return "CampusVerse currently operates a single owner-managed shop. Students can sell devices to CampusVerse or buy approved stock from CampusVerse; independent stores are not available.";
}
