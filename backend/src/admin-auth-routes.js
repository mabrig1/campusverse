import express from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "./db.js";
import { signAdminToken, requireAdminAuth } from "./auth.js";

const router = express.Router();
const RESET_MINUTES = 30;
let schemaReady = false;
let resetTableReady = false;

async function ensureAdminSchema() {
  if (schemaReady) return;
  await prisma.$executeRawUnsafe(`ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "username" TEXT`);
  await prisma.$executeRawUnsafe(`CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username")`);
  schemaReady = true;
}

async function ensureResetTable() {
  await ensureAdminSchema();
  if (resetTableReady) return;
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS admin_password_resets (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, token_hash TEXT NOT NULL UNIQUE, expires_at TIMESTAMP(3) NOT NULL, used_at TIMESTAMP(3), created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_admin_password_resets_user ON admin_password_resets(user_id)`);
  resetTableReady = true;
}

async function bootstrapAdmin() {
  await ensureAdminSchema();
  const username = String(process.env.ADMIN_USERNAME || "").trim().toLowerCase();
  const email = String(process.env.ADMIN_EMAIL || username).trim().toLowerCase();
  const password = String(process.env.ADMIN_PASSWORD || "");
  if (!username || !email || !password) return null;

  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) return existingAdmin;
  if (password.length < 12) throw new Error("ADMIN_PASSWORD must be at least 12 characters");

  const existing = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } });
  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data: { role: "ADMIN", username: existing.username || username, emailVerified: true } });
  }

  const passwordHash = await bcrypt.hash(password, 12);
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

async function sendResetEmail({ to, username, resetUrl }) {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!key || !from) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "CampusVerse Admin password reset",
      html: `<div style="font-family:Arial,sans-serif;max-width:620px;margin:auto"><h2>CampusVerse Admin</h2><p>A password reset was requested for <strong>${username}</strong>.</p><p><a href="${resetUrl}" style="display:inline-block;background:#087f5b;color:#fff;padding:12px 18px;border-radius:8px;text-decoration:none">Reset admin password</a></p><p>This link expires in ${RESET_MINUTES} minutes and can only be used once.</p><p>If you did not request this, you can safely ignore this email.</p></div>`,
    }),
  });
  return response.ok;
}

const loginSchema = z.object({ username: z.string().min(1).max(200), password: z.string().min(1).max(200) });

router.post("/api/admin/auth/login", async (req, res) => {
  try {
    await bootstrapAdmin();
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Enter your admin username and password" });
    const identifier = parsed.data.username.trim().toLowerCase();
    const user = await prisma.user.findFirst({ where: { OR: [{ username: identifier }, { email: identifier }] } });
    if (!user || user.role !== "ADMIN" || !user.passwordHash || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return res.status(401).json({ error: "Invalid administrator credentials" });
    const token = signAdminToken(user);
    res.json({ token, expiresIn: "8h", user: { id: user.id, name: user.name, username: user.username, email: user.email, role: user.role } });
  } catch (err) {
    console.error("Admin login error", err);
    res.status(500).json({ error: "Admin authentication is temporarily unavailable" });
  }
});

router.get("/api/admin/auth/me", requireAdminAuth, async (req, res) => {
  await ensureAdminSchema();
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });
  res.json({ id: user.id, name: user.name, username: user.username, email: user.email, role: user.role });
});

router.post("/api/admin/auth/forgot-password", async (req, res) => {
  const generic = { message: "If an administrator account matches, a password reset link has been sent." };
  try {
    await ensureResetTable();
    const identifier = String(req.body?.username || "").trim().toLowerCase();
    if (!identifier) return res.json(generic);
    const user = await prisma.user.findFirst({ where: { role: "ADMIN", OR: [{ username: identifier }, { email: identifier }] } });
    if (!user) return res.json(generic);

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(rawToken).digest("hex");
    await prisma.$executeRawUnsafe(`DELETE FROM admin_password_resets WHERE user_id=$1 OR expires_at < CURRENT_TIMESTAMP`, user.id);
    await prisma.$executeRawUnsafe(`INSERT INTO admin_password_resets (id,user_id,token_hash,expires_at) VALUES ($1,$2,$3,$4)`, crypto.randomUUID(), user.id, tokenHash, new Date(Date.now() + RESET_MINUTES * 60 * 1000));

    const base = process.env.PUBLIC_APP_URL || "https://www.campusverse.store";
    const resetUrl = `${base.replace(/\/$/, "")}/admin/reset?token=${encodeURIComponent(rawToken)}`;
    const sent = await sendResetEmail({ to: user.email, username: user.username || user.email, resetUrl });
    if (!sent) console.warn("Admin password reset email is not configured; set RESEND_API_KEY and RESEND_FROM_EMAIL.");
    return res.json(generic);
  } catch (err) {
    console.error("Admin forgot-password error", err);
    return res.json(generic);
  }
});

const resetSchema = z.object({ token: z.string().min(32), password: z.string().min(12).max(200) });
router.post("/api/admin/auth/reset-password", async (req, res) => {
  try {
    await ensureResetTable();
    const parsed = resetSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: "Password must be at least 12 characters" });
    const tokenHash = crypto.createHash("sha256").update(parsed.data.token).digest("hex");
    const rows = await prisma.$queryRawUnsafe(`SELECT * FROM admin_password_resets WHERE token_hash=$1 AND used_at IS NULL AND expires_at > CURRENT_TIMESTAMP LIMIT 1`, tokenHash);
    const reset = rows[0];
    if (!reset) return res.status(400).json({ error: "This reset link is invalid or has expired" });
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    await prisma.$transaction(async (tx) => {
      await tx.user.update({ where: { id: reset.user_id }, data: { passwordHash, role: "ADMIN" } });
      await tx.$executeRawUnsafe(`UPDATE admin_password_resets SET used_at=CURRENT_TIMESTAMP WHERE id=$1`, reset.id);
    });
    res.json({ message: "Password updated. You can now sign in to the Admin Portal." });
  } catch (err) {
    console.error("Admin reset-password error", err);
    res.status(500).json({ error: "Unable to reset the administrator password" });
  }
});

export function registerAdminAuthRoutes(app) { app.use(router); }
