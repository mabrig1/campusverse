import { z } from "zod";

const requestSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1).max(12000),
  })).min(1).max(30),
  model: z.string().min(1).max(160).optional(),
  temperature: z.number().min(0).max(2).optional(),
  maxTokens: z.number().int().min(1).max(4000).optional(),
});

const DEFAULT_SYSTEM_PROMPT = `You are CampusVerse AI, a helpful assistant for a Nigerian university campus marketplace and services platform. Help users with campus services, gadgets, phone accessories, printing, legitimate academic support, referrals, orders, and general productivity. Be concise, practical, safe, and honest. Never invent prices, order status, payments, commissions, or verification results. For academic work, support learning and legitimate assistance rather than facilitating cheating or impersonation.`;

export async function openRouterChat(payload) {
  const apiKey = String(process.env.OPENROUTER_API_KEY || "").trim();
  if (!apiKey) {
    const error = new Error("OpenRouter is not configured. Add OPENROUTER_API_KEY to the backend environment.");
    error.code = "OPENROUTER_NOT_CONFIGURED";
    throw error;
  }

  const parsed = requestSchema.safeParse(payload);
  if (!parsed.success) {
    const error = new Error(parsed.error.issues[0]?.message || "Invalid AI request");
    error.code = "OPENROUTER_INVALID_REQUEST";
    throw error;
  }

  const model = parsed.data.model || process.env.OPENROUTER_MODEL || "openrouter/free";
  const messages = [
    { role: "system", content: process.env.OPENROUTER_SYSTEM_PROMPT || DEFAULT_SYSTEM_PROMPT },
    ...parsed.data.messages,
  ];

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      ...(process.env.PUBLIC_APP_URL ? { "HTTP-Referer": process.env.PUBLIC_APP_URL } : {}),
      "X-Title": "CampusVerse",
    },
    body: JSON.stringify({
      model,
      messages,
      temperature: parsed.data.temperature ?? 0.4,
      max_tokens: parsed.data.maxTokens ?? 1200,
    }),
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = data?.error?.message || `OpenRouter request failed (${response.status})`;
    const error = new Error(message);
    error.code = "OPENROUTER_UPSTREAM_ERROR";
    error.status = response.status;
    throw error;
  }

  const content = data?.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error("OpenRouter returned an empty response");
    error.code = "OPENROUTER_EMPTY_RESPONSE";
    throw error;
  }

  return {
    content,
    model: data.model || model,
    usage: data.usage || null,
  };
}
