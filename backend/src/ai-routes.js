import express from "express";
import { z } from "zod";
import { requireAuth, requireAdminAuth } from "./auth.js";
import { openRouterChat } from "./openrouter.js";

const router = express.Router();

const chatSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant"]),
    content: z.string().min(1).max(12000),
  })).min(1).max(30),
  model: z.string().min(1).max(160).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(4000).optional(),
});

async function handleChat(req, res) {
  const parsed = chatSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: "Provide a valid conversation" });

  try {
    const result = await openRouterChat(parsed.data);
    res.json({
      success: true,
      content: result.content,
      model: result.model,
      usage: result.usage,
    });
  } catch (err) {
    if (err.code === "OPENROUTER_NOT_CONFIGURED") {
      return res.status(503).json({ error: err.message });
    }
    if (err.code === "OPENROUTER_INVALID_REQUEST") {
      return res.status(400).json({ error: err.message });
    }
    console.error("OpenRouter error", err);
    return res.status(502).json({ error: err.message || "AI service temporarily unavailable" });
  }
}

// Authenticated CampusVerse users can use the assistant.
router.post("/api/ai/chat", requireAuth, handleChat);

// Admin AI operations are explicitly protected by the short-lived admin session.
router.post("/api/admin/ai/chat", requireAdminAuth, handleChat);

export function registerAIRoutes(app) { app.use(router); }
