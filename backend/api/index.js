// Vercel's Node.js runtime treats this file's default export as the request
// handler for every path matched by vercel.json's rewrite.
import app from "../server.js";
import { registerReferralRoutes } from "../src/referral-routes.js";
import { registerAdminAuthRoutes } from "../src/admin-auth-routes.js";

// Referral/admin operations and the dedicated Admin Portal authentication
// are registered here for the Vercel serverless deployment.
registerReferralRoutes(app);
registerAdminAuthRoutes(app);

export default app;
