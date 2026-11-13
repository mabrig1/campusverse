import { prisma } from "./db.js";
// Explicit first-launch owner-only gate. Any other ADMIN is deliberately denied.
export async function requireTradingOwner(req, res, next) {
  const configured = String(process.env.TRADING_OWNER_EMAIL || "").trim().toLowerCase();
  if (!configured) return res.status(503).json({ error: "Trading desk owner account has not been configured" });
  try {
    const owner = await prisma.user.findUnique({ where: { id: req.userId }, select: { email: true, role: true } });
    if (!owner || owner.role !== "ADMIN" || owner.email.toLowerCase() !== configured)
      return res.status(403).json({ error: "Only the designated marketplace owner can manage device approvals" });
    next();
  } catch (error) { next(error); }
}
