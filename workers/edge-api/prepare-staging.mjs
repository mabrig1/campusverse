// Run only in approved staging CI, after Vite generates frontend/dist.
// Creates an exact-host CSP binding between this Cloudflare account's preview Workers.
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

export function checkedPreviewUrl(value) {
  let parsed;
  try { parsed = new URL(String(value || "")); }
  catch { throw new Error("Provide a complete Cloudflare workers.dev preview URL"); }
  const match = /^campusverse-edge-api-preview\.([a-z0-9](?:[a-z0-9-]{0,60}[a-z0-9])?)\.workers\.dev$/.exec(parsed.hostname);
  if (!match || parsed.protocol !== "https:" || parsed.port || parsed.username || parsed.password ||
      parsed.pathname !== "/api" || parsed.search || parsed.hash) {
    throw new Error("Provide https://campusverse-edge-api-preview.<account>.workers.dev/api");
  }
  return { url: parsed.href.replace(/\/$/, ""), site: "campusverse-frontend-staging." + match[1] + ".workers.dev" };
}

export function makeStagingHeaders(baseHeaders, apiUrl) {
  const { url, site } = checkedPreviewUrl(apiUrl);
  const csp = /^\s+Content-Security-Policy: (.+)$/m.exec(baseHeaders)?.[1];
  if (!csp || !csp.includes("connect-src 'self' ")) throw new Error("Static CSP must explicitly list connect-src");
  const origin = new URL(url).origin;
  const newCsp = csp.replace("connect-src 'self' ", "connect-src 'self' " + origin + " ");
  // Staging-only exact-host override, never widen CSP for campusverse.store.
  return baseHeaders.trimEnd() + "\n\nhttps://" + site + "/*\n" +
    "  ! Content-Security-Policy\n  Content-Security-Policy: " + newCsp + "\n" +
    "  X-Robots-Tag: noindex\n";
}

if (process.argv[1] && import.meta.url === new URL("file://" + resolve(process.argv[1])).href) {
  const path = resolve("frontend/dist/_headers");
  const base = readFileSync(path, "utf8");
  writeFileSync(path, makeStagingHeaders(base, process.env.CAMPUSVERSE_PREVIEW_API_URL), "utf8");
  console.log("Applied exact preview API origin to Cloudflare staging frontend CSP.");
}
