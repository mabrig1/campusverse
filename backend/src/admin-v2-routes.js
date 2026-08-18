import express from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "./db.js";
import { signAdminToken, requireAdminAuth } from "./auth.js";

const router = express.Router();
const RESET_MINUTES = 30;
let resetTableReady = false;

async function ensureAdminSchema() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`);
}

async function ensureResetTable() {
  if (resetTableReady) return;
  await ensureAdminSchema();
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS admin_password_resets_v2 (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMP(3) NOT NULL, used_at TIMESTAMP(3), created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_admin_reset_v2_user ON admin_password_resets_v2(user_id)`);
  resetTableReady = true;
}

async function bootstrapAdmin() {
  await ensureAdminSchema();
  const username = String(process.env.ADMIN_USERNAME || "").trim().toLowerCase();
  const email = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!username || !email || !password) return null;
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must contain at least 12 characters");

  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) return existingAdmin;

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  const passwordHash = await bcrypt.hash(password, 12);
  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN", username, email, passwordHash, emailVerified: true } });
  }

  return prisma.user.create({
    data: {
      name: process.env.ADMIN_NAME || "CampusVerse Administrator",
      email,
      username,
      passwordHash,
      role: "ADMIN",
      emailVerified: true,
      wallet: { create: { balance: 0 } },
    },
  });
}

const loginSchema = z.object({ username: z.string().trim().min(1).max(200), password: z.string().min(1).max(200) });

router.post("/api/admin/v2/login", async (req, res) => {
  try {
    await bootstrapAdmin();
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter your administrator username and password" });
    const identifier = parsed.data.username.toLowerCase();
    const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] } });
    if (!user || user.role !== "ADMIN" || !user.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) {
      return res.status(401).json({ error: "Invalid administrator credentials" });
    }
    const token = signAdminToken(user);
    res.json({ token, expiresIn: "8h", user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role } });
  } catch (error) {
    console.error("Admin v2 login error", error);
    res.status(500).json({ error: "Administrator authentication is not configured correctly" });
  }
});

router.get("/api/admin/v2/me", requireAdminAuth, async (req, res) => {
  await ensureAdminSchema();
  const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { id: true, name: true, username: true, email: true, role: true } });
  if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });
  res.json(user);
});

router.post("/api/admin/v2/forgot-password", async (req, res) => {
  const generic = { message: "If the administrator account matches, a reset link has been sent." };
  try {
    await ensureResetTable();
    const identifier = String(req.body?.username || "").trim().toLowerCase();
    if (!identifier) return res.json(generic);
    const user = await prisma.user.findFirst({ where: { role: "ADMIN", OR: [{ username: identifier }, { email: identifier }] } });
    if (!user) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await prisma.$executeRawUnsafe(`DELETE FROM admin_password_resets_v2 WHERE user_id=$1 OR expires_at < CURRENT_TIMESTAMP`, user.id);
    await prisma.$executeRawUnsafe(`INSERT INTO admin_password_resets_v2 (id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,$4)`, crypto.randomUUID(), user.id, tokenHash, new Date(Date.now() + RESET_MINUTES * 60 * 1000));

    const base = (process.env.PUBLIC_APP_URL || "https://campusverse.store").replace(/\/$/, "");
    const resetUrl = `${base}/admin?reset=${encodeURIComponent(rawToken)}`;
    const key = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM_EMAIL;
    if (key && from) {
      await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from, to: [user.email], subject: "CampusVerse Admin password reset", html: `<p>A password reset was requested for ${user.username || user.email}.</p><p><a href="${resetUrl}">Reset administrator password</a></p><p>This link expires in ${RESET_MINUTES} minutes and can only be used once.</p>` }),
      });
    }
    res.json(generic);
  } catch (error) {
    console.error("Admin v2 forgot-password error", error);
    res.json(generic);
  }
});

router.post("/api/admin/v2/reset-password", async (req, res) => {
  try {
    await ensureResetTable();
    const parsed = z.object({ token: z.string().min(32), password: z.string().min(12).max(200) }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Password must be at least 12 characters" });
    const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM admin_password_resets_v2 WHERE token_hash=$1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP LIMIT 1`, tokenHash);
    const reset = rows[0];
    if (!reset) return res.status(400).json({ error: "This reset link is invalid or has expired" });
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: reset.user_id }, data: { passwordHash, role: "ADMIN" } });
      await tx.$executeRawUnsafe(`UPDATE admin_password_resets_v2 SET used_at=CURRENT_TIMESTAMP WHERE id=$1`, reset.id);
    });
    res.json({ message: "Administrator password updated. Sign in again." });
  } catch (error) {
    console.error("Admin v2 reset-password error", error);
    res.status(500).json({ error: "Unable to reset administrator password" });
  }
});

router.get("/api/admin/v2/overview", requireAdminAuth, async (_req, res) => {
  const [users, products, referrals, commissions, pending] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM referrals`).catch(() => [{ count: 0 }]),
    prisma.$queryRawUnsafe(`SELECT COALESCE(SUM(commission_amount),0) AS amount FROM referral_commissions WHERE status IN ('PENDING','APPROVED','PAID')`).catch(() => [{ amount: 0 }]),
    prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM referral_commissions WHERE status='PENDING'`).catch(() => [{ count: 0 }]),
  ]);
  res.json({ users, products, referrals: Number(referrals[0]?.count || 0), commissions: Number(commissions[0]?.amount || 0), pendingCommissions: Number(pending[0]?.count || 0) });
});

router.get("/api/admin/v2/products", requireAdminAuth, async (_req, res) => {
  const products = await prisma.product.findMany({ orderBy: { createdAt: "desc" }, take: 100, include: { seller: { select: { name: true, email: true } } } });
  res.json(products.map((p) => ({ ...p, images: JSON.parse(p.imagesJson || "[]") })));
});

export function registerAdminV2Routes(app) {
  app.use(router);
}
