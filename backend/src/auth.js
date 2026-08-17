import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET must be set (see backend/.env.example)");
}

export function signToken(user) {
  return jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: "30d" });
}

export function signAdminToken(user) {
  return jwt.sign({ sub: user.id, scope: "admin" }, JWT_SECRET, { expiresIn: "8h" });
}

/** Rejects the request with 401 if there's no valid bearer token; otherwise sets req.userId. */
export function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    req.authScope = payload.scope || "user";
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}

/** Admin-only middleware: requires a short-lived admin-scoped JWT and re-checks the current DB role. */
export async function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Admin session required" });

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    if (payload.scope !== "admin") return res.status(403).json({ error: "Administrator session required" });
    req.userId = payload.sub;
    req.authScope = "admin";

    // Imported lazily to keep auth.js independent from Prisma at module initialization.
    const { prisma } = await import("./db.js");
    const user = await prisma.user.findUnique({ where: { id: req.userId }, select: { role: true } });
    if (!user || user.role !== "ADMIN") return res.status(403).json({ error: "Admin access required" });
    next();
  } catch {
    return res.status(401).json({ error: "Admin session expired or invalid" });
  }
}

/** Sets req.userId if a valid bearer token is present; never rejects. For routes that are public but personalize their response when logged in. */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      req.userId = payload.sub;
      req.authScope = payload.scope || "user";
    } catch {
      // Ignore invalid/expired tokens on optional-auth routes — treat as logged out.
    }
  }
  next();
}
