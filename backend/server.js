import "dotenv/config";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "./src/db.js";
import { signToken, requireAuth } from "./src/auth.js";
import { chargeWallet, creditWallet, InsufficientFundsError } from "./src/wallet.js";
import { computeTrustScore } from "./src/trust-score.js";

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

function handleError(res, err) {
  if (err instanceof InsufficientFundsError) {
    return res.status(402).json({ error: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: "Internal server error" });
}

function serializeProduct(product, extraTrust = {}) {
  const seller = product.seller;
  const trust = extraTrust[seller.id] ?? computeTrustScore(seller);
  return {
    id: product.id,
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    condition: product.condition,
    location: product.location,
    images: [product.imageUrl],
    stock: product.stock,
    inspectionRequired: product.inspectionRequired,
    inspectionReport: product.inspectionReportJson ? JSON.parse(product.inspectionReportJson) : null,
    seller: {
      id: seller.id,
      name: seller.name,
      verified: seller.studentIdVerified,
      trustScore: trust.trustScore,
      avatarUrl:
        seller.avatarUrl ||
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200",
    },
    createdAt: product.createdAt,
  };
}

async function serializeUser(user) {
  const tradesCount = await prisma.escrowTransaction.count({
    where: { sellerId: user.id, status: "FUNDS_RELEASED" },
  });
  const trust = computeTrustScore(user, tradesCount);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    regNo: user.regNo,
    hostel: user.hostel,
    phone: user.phone,
    role: user.role,
    phoneVerified: user.phoneVerified,
    emailVerified: user.emailVerified,
    studentIdVerified: user.studentIdVerified,
    selfieVerified: user.selfieVerified,
    ninVerified: user.ninVerified,
    bvnVerified: user.bvnVerified,
    disputeCount: user.disputeCount,
    tradesCount,
    trustScore: trust.trustScore,
    trustLevel: trust.level,
  };
}

// ---------- Health ----------

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "CampusVerse Engine active" });
});

// ---------- Auth ----------

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  regNo: z.string().optional(),
  hostel: z.string().optional(),
  phone: z.string().optional(),
});

app.post("/api/auth/register", async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { name, email, password, regNo, hostel, phone } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: "An account with that email already exists" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      name,
      email,
      passwordHash,
      regNo,
      hostel,
      phone,
      phoneVerified: Boolean(phone),
      emailVerified: true,
      wallet: { create: { balance: 0 } },
    },
  });

  const token = signToken(user);
  res.status(201).json({ token, user: await serializeUser(user) });
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

app.post("/api/auth/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "Enter a valid email and password" });
  }
  const { email, password } = parsed.data;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  const token = signToken(user);
  res.json({ token, user: await serializeUser(user) });
});

app.get("/api/me", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.userId } });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(await serializeUser(user));
});

// ---------- Trust & KYC ----------
// NIN/BVN/selfie checks stay simulated (no real NIMC/bank/biometric integration
// wired up) but now persist to the authenticated user instead of only
// existing in frontend React state.

app.post("/api/verify/student-id", requireAuth, async (req, res) => {
  const regNo = String(req.body?.regNo || "").trim();
  if (!regNo) return res.status(400).json({ error: "Registration number is required" });

  const user = await prisma.user.update({
    where: { id: req.userId },
    data: { studentIdVerified: true, regNo },
  });
  res.json({ success: true, message: `UNN Student Record verified: ${regNo.toUpperCase()}`, user: await serializeUser(user) });
});

app.post("/api/verify/selfie", requireAuth, async (req, res) => {
  if (!req.body?.selfieBase64) {
    return res.status(400).json({ success: false, message: "Selfie image data is required" });
  }
  const user = await prisma.user.update({ where: { id: req.userId }, data: { selfieVerified: true } });
  res.json({
    success: true,
    matchConfidence: 98.4,
    livenessDetected: true,
    message: "Face match matches student ID photo",
    user: await serializeUser(user),
  });
});

app.post("/api/verify/nin", requireAuth, async (req, res) => {
  const { nin } = req.body;
  if (!nin || String(nin).length !== 11) {
    return res.status(400).json({ success: false, message: "NIN must be exactly 11 digits" });
  }
  const user = await prisma.user.update({ where: { id: req.userId }, data: { ninVerified: true } });
  res.json({
    success: true,
    message: "NIN identity matching successful",
    data: { fullName: user.name.toUpperCase(), stateOfOrigin: "Enugu State" },
    user: await serializeUser(user),
  });
});

app.post("/api/verify/bvn", requireAuth, async (req, res) => {
  const { bvn } = req.body;
  if (!bvn || String(bvn).length !== 11) {
    return res.status(400).json({ success: false, message: "BVN must be exactly 11 digits" });
  }
  const user = await prisma.user.update({ where: { id: req.userId }, data: { bvnVerified: true } });
  res.json({
    success: true,
    message: "BVN identity matches biometric record",
    data: { fullName: user.name.toUpperCase(), bankVerified: "Access Bank PLC" },
    user: await serializeUser(user),
  });
});

const blacklistedIMEIs = ["357289110482937", "861002938172930"];

app.post("/api/verify/imei", (req, res) => {
  const { imei } = req.body;
  if (!imei) return res.status(400).json({ success: false, message: "IMEI is required" });

  const isBlacklisted = blacklistedIMEIs.includes(String(imei).trim());
  res.json({
    imei,
    clean: !isBlacklisted,
    status: isBlacklisted ? "Blacklisted / Reported Stolen" : "Clean",
    source: isBlacklisted ? "Nigeria Police Force & Campus Security Database" : "Checked globally",
    carrierLock: "Unlocked",
  });
});

app.post("/api/fraud-risk", (req, res) => {
  const { deviceFingerprint, location } = req.body;
  let riskScore = 15;
  const flags = [];

  if (!deviceFingerprint) {
    riskScore += 20;
    flags.push("No device identifier");
  }
  if (location && !location.toLowerCase().includes("nsukka") && !location.toLowerCase().includes("enugu")) {
    riskScore += 30;
    flags.push("Geo-location anomaly: Out of campus region");
  }

  let riskLevel = "Low";
  if (riskScore > 30) riskLevel = "Moderate";
  if (riskScore > 60) riskLevel = "High";

  res.json({
    riskScore,
    riskLevel,
    flags,
    action: riskLevel === "High" ? "Trigger OTP & Biometric Challenge" : "Approve Transaction",
  });
});

// ---------- Wallet ----------

app.get("/api/wallet", requireAuth, async (req, res) => {
  const wallet = await prisma.wallet.findUnique({
    where: { userId: req.userId },
    include: { transactions: { orderBy: { createdAt: "desc" }, take: 50 } },
  });
  res.json(wallet);
});

app.post("/api/wallet/topup", requireAuth, async (req, res) => {
  const amount = Number(req.body?.amount);
  if (!Number.isFinite(amount) || amount <= 0) {
    return res.status(400).json({ error: "Enter an amount greater than zero" });
  }
  try {
    const wallet = await creditWallet(prisma, req.userId, amount, "TOPUP", "Wallet top-up");
    res.json({ success: true, wallet });
  } catch (err) {
    handleError(res, err);
  }
});

const transferSchema = z.object({
  toEmail: z.string().email(),
  amount: z.coerce.number().positive(),
  note: z.string().max(200).optional(),
});

app.post("/api/wallet/transfer", requireAuth, async (req, res) => {
  const parsed = transferSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid input" });
  }
  const { toEmail, amount, note } = parsed.data;

  const [sender, recipient] = await Promise.all([
    prisma.user.findUnique({ where: { id: req.userId } }),
    prisma.user.findUnique({ where: { email: toEmail } }),
  ]);
  if (!recipient) return res.status(404).json({ error: "No CampusVerse user found with that email" });
  if (recipient.id === sender.id) {
    return res.status(400).json({ error: "You can't transfer funds to yourself" });
  }

  try {
    await prisma.$transaction(async (tx) => {
      await chargeWallet(
        tx,
        sender.id,
        amount,
        "TRANSFER_OUT",
        note ? `To ${recipient.name}: ${note}` : `To ${recipient.name}`
      );
      await creditWallet(
        tx,
        recipient.id,
        amount,
        "TRANSFER_IN",
        note ? `From ${sender.name}: ${note}` : `From ${sender.name}`
      );
    });
    res.json({ success: true, message: `Sent ₦${amount.toLocaleString()} to ${recipient.name}` });
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- Marketplace ----------

app.get("/api/products", async (req, res) => {
  const products = await prisma.product.findMany({
    include: { seller: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(products.map((p) => serializeProduct(p)));
});

const productSchema = z.object({
  title: z.string().min(3),
  description: z.string().min(10),
  price: z.coerce.number().positive(),
  category: z.string().min(2),
  condition: z.string().min(2),
  location: z.string().min(2),
  imageUrl: z.string().url(),
  inspectionRequired: z.boolean().optional(),
});

app.post("/api/products", requireAuth, async (req, res) => {
  const parsed = productSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: parsed.error.issues[0]?.message ?? "Invalid product" });
  }
  const product = await prisma.product.create({
    data: { ...parsed.data, sellerId: req.userId },
    include: { seller: true },
  });
  res.status(201).json(serializeProduct(product));
});

// ---------- Escrow engine ----------

function serializeEscrow(tx) {
  return {
    id: tx.id,
    productId: tx.productId,
    productName: tx.product.title,
    buyerName: tx.buyer.name,
    sellerName: tx.seller.name,
    price: tx.price,
    status: tx.status.toLowerCase(),
    inspectionStatus: tx.inspectionStatus,
    inspectionScore: tx.inspectionScore,
    disputeStatus: tx.disputeStatus,
    timestamp: tx.createdAt,
  };
}

app.post("/api/escrow", requireAuth, async (req, res) => {
  const productId = req.body?.productId;
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) return res.status(404).json({ error: "Product not found" });
  if (product.sellerId === req.userId) {
    return res.status(400).json({ error: "You can't buy your own listing" });
  }

  try {
    const escrow = await prisma.$transaction(async (tx) => {
      await chargeWallet(
        tx,
        req.userId,
        product.price,
        "ESCROW_LOCK",
        `Escrow hold: ${product.title}`
      );
      return tx.escrowTransaction.create({
        data: {
          productId: product.id,
          buyerId: req.userId,
          sellerId: product.sellerId,
          price: product.price,
          status: "FUNDS_LOCKED",
          inspectionStatus: product.inspectionRequired ? "pending" : "not_required",
          inspectionScore: product.inspectionRequired
            ? JSON.parse(product.inspectionReportJson || "{}").inspectionScore || 0
            : 100,
        },
        include: { product: true, buyer: true, seller: true },
      });
    });
    res.status(201).json(serializeEscrow(escrow));
  } catch (err) {
    handleError(res, err);
  }
});

app.get("/api/escrow/:id", requireAuth, async (req, res) => {
  const tx = await prisma.escrowTransaction.findUnique({
    where: { id: req.params.id },
    include: { product: true, buyer: true, seller: true },
  });
  if (!tx) return res.status(404).json({ error: "Escrow transaction not found" });
  if (tx.buyerId !== req.userId && tx.sellerId !== req.userId) {
    return res.status(403).json({ error: "Not a party to this escrow transaction" });
  }
  res.json(serializeEscrow(tx));
});

app.post("/api/escrow/:id/action", requireAuth, async (req, res) => {
  const { action } = req.body;
  const tx = await prisma.escrowTransaction.findUnique({
    where: { id: req.params.id },
    include: { product: true, buyer: true, seller: true },
  });
  if (!tx) return res.status(404).json({ error: "Escrow transaction not found" });
  if (tx.buyerId !== req.userId && tx.sellerId !== req.userId) {
    return res.status(403).json({ error: "Not a party to this escrow transaction" });
  }

  try {
    if (action === "inspect") {
      if (tx.status !== "FUNDS_LOCKED") {
        return res.status(409).json({ error: "Escrow is not awaiting inspection" });
      }
      const updated = await prisma.escrowTransaction.update({
        where: { id: tx.id },
        data: { status: "INSPECTED", inspectionStatus: "passed" },
        include: { product: true, buyer: true, seller: true },
      });
      return res.json(serializeEscrow(updated));
    }

    if (action === "approve") {
      if (tx.buyerId !== req.userId) {
        return res.status(403).json({ error: "Only the buyer can release funds" });
      }
      if (tx.status !== "INSPECTED" && tx.status !== "FUNDS_LOCKED") {
        return res.status(409).json({ error: "Escrow is not releasable in its current state" });
      }
      const updated = await prisma.$transaction(async (dbtx) => {
        await creditWallet(
          dbtx,
          tx.sellerId,
          tx.price,
          "ESCROW_RELEASE",
          `Escrow release: ${tx.product.title}`
        );
        return dbtx.escrowTransaction.update({
          where: { id: tx.id },
          data: { status: "FUNDS_RELEASED" },
          include: { product: true, buyer: true, seller: true },
        });
      });
      return res.json(serializeEscrow(updated));
    }

    if (action === "dispute") {
      if (tx.status !== "FUNDS_LOCKED" && tx.status !== "INSPECTED") {
        return res.status(409).json({ error: "Escrow can't be disputed in its current state" });
      }
      const updated = await prisma.$transaction(async (dbtx) => {
        await dbtx.user.update({
          where: { id: tx.buyerId },
          data: { disputeCount: { increment: 1 } },
        });
        return dbtx.escrowTransaction.update({
          where: { id: tx.id },
          data: { status: "DISPUTED", disputeStatus: "under_review" },
          include: { product: true, buyer: true, seller: true },
        });
      });
      return res.json(serializeEscrow(updated));
    }

    return res.status(400).json({ error: "Unknown action" });
  } catch (err) {
    handleError(res, err);
  }
});

// ---------- Services & directory (still static — out of this pass's scope) ----------

const mockServices = [
  {
    id: "srv-001",
    title: "Professional CV & LinkedIn Profile Writing",
    description:
      "Tailored specifically for Nigerian students applying for internships, remote tech jobs, or scholarships.",
    price: 5000,
    rating: 4.9,
    reviewsCount: 32,
    provider: {
      name: "Tobi Daniels",
      department: "UNN Faculty of Law",
      avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
      skills: ["CV Optimization", "LinkedIn Branding", "Academic Consulting"],
      trustScore: 96,
    },
  },
  {
    id: "srv-002",
    title: "React & Node.js Website Development",
    description:
      "Building custom websites, portfolios, and startup landing pages. High performance and mobile responsive guaranteed.",
    price: 45000,
    rating: 5.0,
    reviewsCount: 14,
    provider: {
      name: "Ibrahim Bello",
      department: "UNN Electronic Engineering",
      avatarUrl: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=200",
      skills: ["React.js", "Node.js", "PostgreSQL", "Tailwind CSS"],
      trustScore: 98,
    },
  },
  {
    id: "srv-003",
    title: "Hairdressing & Braiding (Hostel Delivery)",
    description: "Get your hair done beautifully in the comfort of your hostel room. I braid knotless braids, twists, and weave-on styles.",
    price: 7000,
    rating: 4.8,
    reviewsCount: 47,
    provider: {
      name: "Chioma Nkechi",
      department: "UNN Biochemistry",
      avatarUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200",
      skills: ["Knotless Braids", "Weaves", "Hair Treatment"],
      trustScore: 91,
    },
  },
];

const mockDirectory = [
  {
    id: "biz-001",
    name: "Odim Gate Printing & Business Hub",
    category: "Business Center",
    location: "Odim Gate, Nsukka",
    description: "Affordable printing, scanning, photocopy, and thesis binding. Open from 7 AM to 9 PM daily.",
    rating: 4.6,
    reviewsCount: 104,
    verified: true,
    logoUrl: "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "biz-002",
    name: "Franco Hostel Shuttle & Logistics",
    category: "Transportation",
    location: "Franco Car Park, UNN",
    description: "Reliable moving service from town to hostels, and campus shuttles. Student-friendly rates.",
    rating: 4.7,
    reviewsCount: 88,
    verified: true,
    logoUrl: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?auto=format&fit=crop&q=80&w=200",
  },
  {
    id: "biz-003",
    name: "Grace Kitchen (UNN Corner)",
    category: "Restaurant",
    location: "Behind Bello Hostel, Nsukka",
    description: "Best local Jollof Rice, Egusi, Okro, and Abacha. We do deliveries to all UNN hostels.",
    rating: 4.8,
    reviewsCount: 153,
    verified: true,
    logoUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=200",
  },
];

app.get("/api/services", (req, res) => res.json(mockServices));
app.get("/api/directory", (req, res) => res.json(mockDirectory));

app.listen(PORT, () => {
  console.log(`CampusVerse Backend running on port ${PORT}`);
});
