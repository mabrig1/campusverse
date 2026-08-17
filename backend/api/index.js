// Vercel's Node.js runtime treats this file's default export as the request
// handler for every path matched by vercel.json's rewrite. An Express app is
// itself a valid (req, res) handler, so exporting it directly is enough.
import app from "../server.js";
import { registerReferralRoutes } from "../src/referral-routes.js";

// Referral/admin routes are registered here so the existing backend/server.js
// can remain the shared local development entrypoint.
registerReferralRoutes(app);

export default app;
