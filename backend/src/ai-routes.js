import express from "express";
import { z } from "zod";
import { requireAuth, requireAdminAuth } from "./auth.js";
import { getOpenRouterStatus, openRouterChat } from "./openrouter.js";

const router = express.Router();

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(12000),
  })).min(1).max(20),
  model: z.string().min(1).max(160).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(2500).optional(),
});

const WINDOW_MS = 60_000;
const MAX_REQUESTS_PER_WINDOW = 20;
const requestBuckets = new Map();

function rateLimit(req, res, next) {
  const key = String(req.ip || req.headers["x-forwarded-for"] || "unknown").split(",")[0].trim();
  const now = Date.now();
  const current = requestBuckets.get(key);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    requestBuckets.set(key, { startedAt: now, count: 1 });
    return next();
  }
  if (current.count >= MAX_REQUESTS_PER_WINDOW) {
    return res.status(429).json({ error: "AI request limit reached. Please try again shortly." });
  }
  current.count += 1;
  return next();
}

// Keep this small in a serverless process; stale entries are harmless and periodically removed.
setInterval(() => {
  const cutoff = Date.now() - WINDOW_MS;
  for (const [key, value] of requestBuckets) {
    if (value.startedAt < cutoff) requestBuckets.delete(key);
  }
}, WINDOW_MS).unref?.();

async function handleChat(req, res) {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid conversation" });

  try {
    const result = await openRouterChat(parsed.data);
    res.json({ success: true, content: result.content, model: result.model, usage: result.usage });
  } catch (err) {
    if (err.code === "OPENROUTER_NOT_CONFIGURED") return res.status(503).json({ error: err.message });
    if (err.code === "OPENROUTER_INVALID_REQUEST") return res.status(400).json({ error: err.message });
    if (err.code === "OPENROUTER_TIMEOUT") return res.status(504).json({ error: err.message });
    console.error("OpenRouter error", err);
    return res.status(502).json({ error: err.message || "AI service temporarily unavailable" });
  }
}

router.get("/api/ai/status", requireAdminAuth, (req, res) => {
  res.json({ success: true, provider: "openrouter", ...getOpenRouterStatus() });
});

router.post("/api/ai/chat", requireAuth, rateLimit, handleChat);
router.post("/api/admin/ai/chat", requireAdminAuth, rateLimit, handleChat);

export function registerAIRoutes(app) { app.use(router); }
