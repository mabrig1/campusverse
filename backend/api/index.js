// Vercel's Node.js runtime treats this file's default export as the request
// handler for every path matched by vercel.json's rewrite.
import app from "../server.js";
import { registerReferralRoutes } from "../src/referral-routes.js";
import { registerAdminAuthRoutes } from "../src/admin-auth-routes.js";
import { registerAIRoutes } from "../src/ai-routes.js";

// Referral/admin operations, Admin Portal authentication, and authenticated
// OpenRouter AI routes are registered here for the Vercel serverless deployment.
registerReferralRoutes(app);
registerAdminAuthRoutes(app);
registerAIRoutes(app);

export default app;
