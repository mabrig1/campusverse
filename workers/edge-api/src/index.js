// CampusVerse Cloudflare API gateway. Safe-by-default caching, never user or transaction data.
// Deploy first to workers.dev for tests; add a custom domain only after release approval.
const CACHE_SECONDS = Object.freeze({
  "/api/marketplace-categories": 3600,
  "/api/services": 60,
});
const MAX_CACHED_BODY_BYTES = 256 * 1024;
const NO_STORE = "private, no-store, max-age=0";
const ALLOWED_METHODS = new Set(["GET", "HEAD", "OPTIONS", "POST", "PUT", "PATCH", "DELETE"]);

export function cacheEligibility(request, url = new URL(request.url)) {
  const ttl = CACHE_SECONDS[url.pathname];
  if (!ttl || request.method !== "GET" || url.search) return 0;
  // Never share private, conditional, ranged or cookie-bearing responses across users.
  for (const name of ["authorization", "cookie", "range", "if-none-match", "if-modified-since", "x-api-key"]) {
    if (request.headers.has(name)) return 0;
  }
  return ttl;
}

export function mayStoreResponse(response) {
  if (response.status !== 200) return false;
  const type = (response.headers.get("content-type") || "").toLowerCase();
  if (!/^application\/json(?:\s*;|$)/.test(type)) return false;
  if (response.headers.has("set-cookie") || response.headers.has("www-authenticate")) return false;
  // Keep cached bytes identical to the decoded payload: compressed encodings
  // or partial-content metadata can produce incorrect Content-Length handling.
  if (response.headers.has("content-range") ||
      (response.headers.has("content-encoding") && response.headers.get("content-encoding") !== "identity"))
    return false;
  if (/\b(private|no-store|no-cache)\b/i.test(response.headers.get("cache-control") || "")) return false;
  const vary = (response.headers.get("vary") || "").trim().toLowerCase();
  if (vary && vary !== "accept-encoding") return false;
  const length = Number(response.headers.get("content-length") || 0);
  if (length > MAX_CACHED_BODY_BYTES) return false;
  return true;
}

function configOrigin(env, requestURL) {
  const raw = String(env?.UPSTREAM_ORIGIN || "").trim();
  if (!raw) throw new Error("Unconfigured upstream");
  const u = new URL(raw);
  if (u.protocol !== "https:" || !u.hostname || u.username || u.password ||
      u.pathname !== "/" || u.search || u.hash || u.host === requestURL.host) {
    throw new Error("Invalid upstream");
  }
  return u.origin;
}

const jsonError = (status, message) => new Response(JSON.stringify({ error: message }), {
  status,
  headers: {
    "content-type": "application/json; charset=utf-8",
    "cache-control": NO_STORE,
    "x-content-type-options": "nosniff",
    "access-control-allow-origin": "*",
  },
});

const copyResponse = (response) => new Response(response.body, response);

// Content-Length can be missing or falsified, so inspect the *actual* response bytes.
// Only small public metadata is ever buffered. Preserve the original streaming
// response for the visitor if the bounded cache inspection cannot complete.
async function boundedPublicCopy(response, ttl) {
  if (!response.body) return null;
  const reader = response.clone().body.getReader();
  const chunks = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_CACHED_BODY_BYTES) {
        await reader.cancel("Metadata exceeds the cache limit");
        return null;
      }
      chunks.push(value);
    }
    if (!size) return null;
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    const headers = new Headers(response.headers);
    headers.delete("content-length");
    headers.set("cache-control", "public, max-age=0, s-maxage=" + ttl);
    headers.set("x-content-type-options", "nosniff");
    return new Response(bytes, { status: response.status, statusText: response.statusText, headers });
  } catch {
    await reader.cancel("Cache read failed").catch(() => {});
    return null;
  }
}


export async function handleRequest(request, env = {}, ctx = {}, runtime = {}) {
  const url = new URL(request.url);
  if (url.pathname === "/_edge/health" && request.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", role: "campusverse-api-gateway" }), {
      headers: { "content-type": "application/json", "cache-control": NO_STORE },
    });
  }
  if (!url.pathname.startsWith("/api/")) return jsonError(404, "Only CampusVerse API routes are proxied");
  if (!ALLOWED_METHODS.has(request.method)) return jsonError(405, "Unsupported request method");

  let upstreamOrigin;
  try {
    upstreamOrigin = configOrigin(env, url);
  } catch {
    return jsonError(503, "Edge API gateway upstream is not configured");
  }

  const ttl = cacheEligibility(request, url);
  // Cache API works on a bound Cloudflare zone, not reliably in dashboard preview.
  const cache = runtime.cache === undefined ? globalThis.caches?.default : runtime.cache;
  const cacheKey = new Request(url.origin + url.pathname, { method: "GET" });
  if (ttl && cache) {
    try {
      const hit = await cache.match(cacheKey);
      if (hit) {
        const result = copyResponse(hit);
        result.headers.set("x-campusverse-edge-cache", "HIT");
        return result;
      }
    } catch {
      // Cache failure must never block the backend or weaken private route controls.
    }
  }

  const destination = new URL(url.pathname + url.search, upstreamOrigin);
  const upstreamHeaders = new Headers(request.headers);
  upstreamHeaders.delete("host");
  upstreamHeaders.delete("x-forwarded-host");
  // No user-supplied host rewrites, origins or arbitrary proxy targets.
  const outgoing = new Request(destination, {
    method: request.method,
    headers: upstreamHeaders,
    body: request.method === "GET" || request.method === "HEAD" ? undefined : request.body,
    redirect: "manual",
    ...(request.body && request.method !== "GET" && request.method !== "HEAD" ? { duplex: "half" } : {}),
  });

  let upstream;
  try {
    const fetcher = runtime.fetchImpl || fetch;
    upstream = await fetcher(outgoing, { redirect: "manual" });
  } catch {
    return jsonError(502, "CampusVerse backend is temporarily unreachable");
  }

  // Only two explicitly public, non-personal catalog endpoints are cacheable.
  // Device listings must never be cached: a theft report can revoke them immediately.
  if (ttl && cache && mayStoreResponse(upstream)) {
    const cacheable = await boundedPublicCopy(upstream, ttl);
    if (cacheable) {
      const stored = cacheable.clone();
      try {
        const write = cache.put(cacheKey, stored);
        if (ctx && typeof ctx.waitUntil === "function") ctx.waitUntil(write.catch(() => {}));
        else await write.catch(() => {});
      } catch { /* Cache errors must not prevent public metadata delivery. */ }
      cacheable.headers.set("x-campusverse-edge-cache", "MISS");
      return cacheable;
    }
  }

  const response = copyResponse(upstream);
  response.headers.set("cache-control", NO_STORE);
  response.headers.set("x-content-type-options", "nosniff");
  response.headers.set("x-campusverse-edge-cache", "BYPASS");
  return response;
}

export default {
  fetch(request, env, ctx) {
    return handleRequest(request, env, ctx);
  },
};
