// Vercel's Node.js runtime treats this file's default export as the request
// handler for every path matched by vercel.json's rewrite. An Express app is
// itself a valid (req, res) handler, so exporting it directly is enough —
// no adapter library needed.
import app from "../server.js";

export default app;
