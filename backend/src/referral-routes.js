import express from "express";
import { randomUUID } from "node:crypto";
import { prisma } from "./db.js";
import { requireAuth } from "./auth.js";

const router = express.Router();
let tablesReady = false;

async function ensureTables() {
  if (tablesReady) return;
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS referral_partners (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL UNIQUE,
      status TEXT NOT NULL DEFAULT 'ACTIVE',
      commission_rate DOUBLE PRECISION NOT NULL DEFAULT 0.20,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS referrals (
      id TEXT PRIMARY KEY,
      referrer_user_id TEXT NOT NULL,
      referred_user_id TEXT NOT NULL UNIQUE,
      code TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'LEAD',
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      qualified_at TIMESTAMP(3)
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS referral_commissions (
      id TEXT PRIMARY KEY,
      referral_id TEXT NOT NULL,
      source_type TEXT NOT NULL,
      source_id TEXT,
      base_amount DOUBLE PRECISION NOT NULL,
      commission_rate DOUBLE PRECISION NOT NULL,
      commission_amount DOUBLE PRECISION NOT NULL,
      status TEXT NOT NULL DEFAULT 'PENDING',
      note TEXT,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      paid_at TIMESTAMP(3)
    )
  `);
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS referral_images (
      id TEXT PRIMARY KEY,
      uploaded_by TEXT NOT NULL,
      file_name TEXT NOT NULL,
      url TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_user_id)`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS idx_commissions_referral ON referral_commissions(referral_id)`);
  tablesReady = true;
}

async function currentUser(userId) {
  return prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true, email: true, role: true } });
}

async function requireAdmin(req, res, next) {
  await ensureTables();
  const user = await currentUser(req.userId);
  if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });
  req.adminUser = user;
  next();
}

function makeCode() {
  return `CV-${randomUUID().replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

async function getOrCreatePartner(userId) {
  const existing = await prisma.$queryRawUnsafe(`SELECT * FROM referral_partners WHERE user_id = $1 LIMIT 1`, userId);
  if (existing[0]) return existing[0];
  let code = makeCode();
  for (let i = 0; i < 5; i += 1) {
    try {
      const id = randomUUID();
      await prisma.$executeRawUnsafe(
        `INSERT INTO referral_partners (id, user_id, code) VALUES ($1, $2, $3)`,
        id,
        userId,
        code
      );
      return (await prisma.$queryRawUnsafe(`SELECT * FROM referral_partners WHERE user_id = $1 LIMIT 1`, userId))[0];
    } catch (err) {
      code = makeCode();
      if (i === 4) throw err;
    }
  }
}

async function partnerPayload(userId) {
  const partner = await getOrCreatePartner(userId);
  const referrals = await prisma.$queryRawUnsafe(
    `SELECT r.*, u.name AS referred_name, u.email AS referred_email
     FROM referrals r JOIN "User" u ON u.id = r.referred_user_id
     WHERE r.referrer_user_id = $1 ORDER BY r.created_at DESC`,
    userId
  );
  const commissions = await prisma.$queryRawUnsafe(
    `SELECT c.*, r.code, u.name AS referred_name
     FROM referral_commissions c
     JOIN referrals r ON r.id = c.referral_id
     JOIN "User" u ON u.id = r.referred_user_id
     WHERE r.referrer_user_id = $1 ORDER BY c.created_at DESC`,
    userId
  );
  const totals = await prisma.$queryRawUnsafe(
    `SELECT
       COALESCE(SUM(CASE WHEN status IN ('PENDING','APPROVED','PAID') THEN commission_amount ELSE 0 END),0) AS total,
       COALESCE(SUM(CASE WHEN status = 'PENDING' THEN commission_amount ELSE 0 END),0) AS pending,
       COALESCE(SUM(CASE WHEN status = 'APPROVED' THEN commission_amount ELSE 0 END),0) AS approved,
       COALESCE(SUM(CASE WHEN status = 'PAID' THEN commission_amount ELSE 0 END),0) AS paid
     FROM referral_commissions c JOIN referrals r ON r.id = c.referral_id
     WHERE r.referrer_user_id = $1`,
    userId
  );
  return {
    code: partner.code,
    status: partner.status,
    commissionRate: Number(partner.commission_rate),
    referralLink: `${process.env.PUBLIC_APP_URL || "https://www.campusverse.store"}/?ref=${partner.code}`,
    stats: {
      referrals: referrals.length,
      qualified: referrals.filter((r) => r.status === "QUALIFIED").length,
      pending: Number(totals[0]?.pending || 0),
      approved: Number(totals[0]?.approved || 0),
      paid: Number(totals[0]?.paid || 0),
      total: Number(totals[0]?.total || 0),
    },
    referrals,
    commissions,
  };
}

router.get("/api/referrals/me", requireAuth, async (req, res) => {
  res.json(await partnerPayload(req.userId));
});

router.post("/api/referrals/attach", requireAuth, async (req, res) => {
  await ensureTables();
  const code = String(req.body?.code || "").trim().toUpperCase();
  if (!/^CV-[A-Z0-9]{8}$/.test(code)) return res.status(400).json({ error: "Invalid referral code" });
  const partner = await prisma.$queryRawUnsafe(`SELECT * FROM referral_partners WHERE code = $1 LIMIT 1`, code);
  if (!partner[0]) return res.status(404).json({ error: "Referral code not found" });
  if (partner[0].user_id === req.userId) return res.status(400).json({ error: "You cannot refer yourself" });
  const existing = await prisma.$queryRawUnsafe(`SELECT * FROM referrals WHERE referred_user_id = $1 LIMIT 1`, req.userId);
  if (existing[0]) return res.json({ attached: false, message: "This account already has a referral attribution" });
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO referrals (id, referrer_user_id, referred_user_id, code) VALUES ($1,$2,$3,$4)`,
    id,
    partner[0].user_id,
    req.userId,
    code
  );
  res.status(201).json({ attached: true, referralId: id, code });
});

router.get("/api/referrals/admin/overview", requireAuth, requireAdmin, async (_req, res) => {
  const [users, products, referrals, commissions, pending] = await Promise.all([
    prisma.user.count(),
    prisma.product.count(),
    prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM referrals`),
    prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count, COALESCE(SUM(commission_amount),0) AS amount FROM referral_commissions WHERE status IN ('PENDING','APPROVED','PAID')`),
    prisma.$queryRawUnsafe(`SELECT COUNT(*)::int AS count FROM referral_commissions WHERE status = 'PENDING'`),
  ]);
  res.json({
    users,
    products,
    referrals: Number(referrals[0]?.count || 0),
    commissions: Number(commissions[0]?.amount || 0),
    commissionCount: Number(commissions[0]?.count || 0),
    pendingCommissions: Number(pending[0]?.count || 0),
  });
});

router.get("/api/referrals/admin/referrals", requireAuth, requireAdmin, async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(
    `SELECT r.*, p.code, p.commission_rate, ru.name AS referrer_name, ru.email AS referrer_email,
            uu.name AS referred_name, uu.email AS referred_email,
            COALESCE(SUM(c.commission_amount),0) AS commission_total
     FROM referrals r
     JOIN referral_partners p ON p.user_id = r.referrer_user_id
     JOIN "User" ru ON ru.id = r.referrer_user_id
     JOIN "User" uu ON uu.id = r.referred_user_id
     LEFT JOIN referral_commissions c ON c.referral_id = r.id
     GROUP BY r.id,p.code,p.commission_rate,ru.name,ru.email,uu.name,uu.email
     ORDER BY r.created_at DESC`
  );
  res.json(rows);
});

router.post("/api/referrals/admin/conversions", requireAuth, requireAdmin, async (req, res) => {
  const referralId = String(req.body?.referralId || "").trim();
  const sourceType = String(req.body?.sourceType || "SERVICE").trim().toUpperCase();
  const sourceId = String(req.body?.sourceId || "").trim() || null;
  const baseAmount = Number(req.body?.baseAmount);
  const note = String(req.body?.note || "").trim() || null;
  if (!referralId || !Number.isFinite(baseAmount) || baseAmount <= 0) return res.status(400).json({ error: "Referral and a positive order amount are required" });
  const referral = await prisma.$queryRawUnsafe(`SELECT r.*, p.commission_rate FROM referrals r JOIN referral_partners p ON p.user_id = r.referrer_user_id WHERE r.id = $1 LIMIT 1`, referralId);
  if (!referral[0]) return res.status(404).json({ error: "Referral not found" });
  const rate = Number(referral[0].commission_rate || 0.2);
  const commission = Math.round(baseAmount * rate * 100) / 100;
  const id = randomUUID();
  await prisma.$executeRawUnsafe(
    `INSERT INTO referral_commissions (id, referral_id, source_type, source_id, base_amount, commission_rate, commission_amount, note)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
    id,
    referralId,
    sourceType,
    sourceId,
    baseAmount,
    rate,
    commission,
    note
  );
  await prisma.$executeRawUnsafe(`UPDATE referrals SET status='QUALIFIED', qualified_at=COALESCE(qualified_at,CURRENT_TIMESTAMP) WHERE id=$1`, referralId);
  res.status(201).json({ id, baseAmount, commissionRate: rate, commissionAmount: commission, status: "PENDING" });
});

router.patch("/api/referrals/admin/commissions/:id", requireAuth, requireAdmin, async (req, res) => {
  const id = req.params.id;
  const status = String(req.body?.status || "").toUpperCase();
  if (!["PENDING", "APPROVED", "PAID", "REVERSED"].includes(status)) return res.status(400).json({ error: "Invalid commission status" });
  await prisma.$executeRawUnsafe(
    `UPDATE referral_commissions SET status=$1, paid_at=CASE WHEN $1='PAID' THEN CURRENT_TIMESTAMP ELSE paid_at END WHERE id=$2`,
    status,
    id
  );
  res.json({ success: true, status });
});

router.get("/api/referrals/admin/images", requireAuth, requireAdmin, async (_req, res) => {
  const rows = await prisma.$queryRawUnsafe(`SELECT * FROM referral_images ORDER BY created_at DESC LIMIT 100`);
  res.json(rows);
});

router.post(
  "/api/referrals/admin/images",
  requireAuth,
  requireAdmin,
  express.raw({ type: ["application/octet-stream", "image/*"], limit: "8mb" }),
  async (req, res) => {
    const mime = String(req.headers["x-file-type"] || req.headers["content-type"] || "").split(";")[0].toLowerCase();
    const fileName = String(req.headers["x-file-name"] || `campusverse-${Date.now()}`).replace(/[^a-zA-Z0-9._-]/g, "-");
    if (!mime.startsWith("image/")) return res.status(400).json({ error: "Only image files are allowed" });
    const body = Buffer.isBuffer(req.body) ? req.body : Buffer.from([]);
    if (!body.length) return res.status(400).json({ error: "Image file is empty" });
    const supabaseUrl = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseUrl || !serviceKey) {
      return res.status(503).json({ error: "Image storage is not configured. Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to the backend." });
    }
    const bucket = process.env.SUPABASE_STORAGE_BUCKET || "campusverse";
    const bucketHeaders = { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": "application/json" };
    const bucketCheck = await fetch(`${supabaseUrl}/storage/v1/bucket/${bucket}`, { headers: bucketHeaders });
    if (!bucketCheck.ok) {
      await fetch(`${supabaseUrl}/storage/v1/bucket`, {
        method: "POST",
        headers: bucketHeaders,
        body: JSON.stringify({ id: bucket, name: bucket, public: true }),
      });
    }
    const objectPath = `products/${new Date().getFullYear()}/${randomUUID()}-${fileName}`;
    const upload = await fetch(`${supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
      method: "POST",
      headers: { apikey: serviceKey, Authorization: `Bearer ${serviceKey}`, "Content-Type": mime, "x-upsert": "true" },
      body,
    });
    if (!upload.ok) return res.status(502).json({ error: `Storage upload failed: ${await upload.text()}` });
    const url = `${supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
    const id = randomUUID();
    await prisma.$executeRawUnsafe(
      `INSERT INTO referral_images (id, uploaded_by, file_name, url, mime_type) VALUES ($1,$2,$3,$4,$5)`,
      id,
      req.userId,
      fileName,
      url,
      mime
    );
    res.status(201).json({ id, fileName, url, mimeType: mime });
  }
);

export function registerReferralRoutes(app) {
  app.use(router);
}
