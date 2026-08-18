// Vercel's Node.js runtime treats this file's default export as the request
// handler for every path matched by vercel.json's rewrite.
import app from "../server.js";
import { prisma } from "../src/db.js";
import { registerReferralRoutes } from "../src/referral-routes.js";
import { registerAdminAuthRoutes } from "../src/admin-auth-routes.js";
import { registerAIRoutes } from "../src/ai-routes.js";

// Lightweight platform/database diagnostics. These make it possible to tell
// a Vercel routing problem from a backend/database problem without exposing
// credentials or database contents.
app.get("/", (_req, res) => {
  res.json({ service: "CampusVerse API", status: "ok", runtime: "vercel" });
});

app.get("/api/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ service: "CampusVerse API", status: "ok", database: "ok" });
  } catch (error) {
    console.error("Health check database error", error);
    res.status(503).json({ service: "CampusVerse API", status: "degraded", database: "unavailable" });
  }
});

// Referral/admin operations, Admin Portal authentication, and authenticated
// OpenRouter AI routes are registered here for the Vercel serverless deployment.
registerReferralRoutes(app);
registerAdminAuthRoutes(app);
registerAIRoutes(app);

export default app;
