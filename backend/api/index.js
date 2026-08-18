// Vercel's Node.js runtime treats this file's default export as the request
// handler for every path matched by vercel.json's rewrite.
import app from "../server.js";
import { prisma } from "../src/db.js";
import { registerReferralRoutes } from "../src/referral-routes.js";
import { registerAdminV2Routes } from "../src/admin-v2-routes.js";
import { registerAIRoutes } from "../src/ai-routes.js";

app.get("/", (_req, res) => {
  res.json({ service: "CampusVerse API", status: "ok", runtime: "vercel", admin: "v2" });
});

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ service: "CampusVerse API", status: "ok", database: "ok", admin: "v2" });
  } catch (error) {
    console.error("Health check database error", error);
    res.status(503).json({ service: "CampusVerse API", status: "degraded", database: "unavailable" });
  }
});

// Keep the referral engine and OpenRouter AI, but replace the old admin
// authentication wiring with the new isolated v2 admin module.
registerReferralRoutes(app);
registerAdminV2Routes(app);
registerAIRoutes(app);

export default app;
