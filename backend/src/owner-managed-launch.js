import { optionalAuth, requireAdminAuth } from "./auth.js";
import { requireTradingOwner } from "./trading-owner.js";

export const ownerManagedLaunch = process.env.CAMPUSVERSE_OWNER_MANAGED_LAUNCH !== "false";
const denied = (res) => res.status(423).json({ error: "Self-service transactions are paused during the owner-managed launch. Use the supervised phone and laptop trading desk." });

export function ownerManagedGuard(req,res,next) {
  if (!ownerManagedLaunch || req.method === "GET") return next();
  const path = req.path;
  // These legacy routes can move simulated wallet value or release escrow without the owner's approval.
  if (path === "/api/wallet/topup" || path === "/api/wallet/transfer" ||
      path === "/api/escrow" || path.startsWith("/api/escrow/") ||
      /^\/api\/products\/[^/]+\/promote$/.test(path)) return denied(res);
  // Only the configured trading owner may publish non-device catalog products.
  if (path === "/api/products" && req.method === "POST") {
    return optionalAuth(req,res,() => requireAdminAuth(req,res,() => requireTradingOwner(req,res,next)));
  }
  // Old pretend clearance and fake ID verification must not masquerade as theft prevention or KYC.
  if (["/api/verify/imei","/api/verify/nin","/api/verify/bvn","/api/verify/selfie","/api/verify/student-id"].includes(path))
    return res.status(503).json({ error: "Simulated verification is disabled for launch. This is not an official identity or stolen-device database check." });
  next();
}

export function serializeSellerContact({phone,whatsappLink}) {
  return ownerManagedLaunch ? {phone: null, whatsappLink: null} : {phone,whatsappLink};
}
