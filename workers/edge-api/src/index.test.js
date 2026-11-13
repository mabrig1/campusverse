import test from "node:test";
import assert from "node:assert/strict";
import { handleRequest, cacheEligibility, mayStoreResponse } from "./index.js";

const env = { UPSTREAM_ORIGIN: "https://campusverse-backend.vercel.app" };
const json = (body = { items: ["a"] }, headers = {}) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json", ...headers } });
function fakeCache() {
  const entries = new Map();
  let writes = 0;
  return {
    async match(key) { return entries.get(key.url)?.clone(); },
    async put(key, response) { writes++; entries.set(key.url, response.clone()); },
    get writes() { return writes; },
  };
}
const setup = (cache = fakeCache()) => {
  let calls = 0;
  const promises = [];
  const runtime = {
    cache, async fetchImpl(request) {
      calls++;
      return json({ items: [request.method, new URL(request.url).pathname, calls] });
    },
  };
  return { cache, runtime, ctx: { waitUntil: promise => promises.push(promise) },
    get calls() { return calls; }, settle: () => Promise.all(promises) };
};
const url = path => "https://api.campusverse.store" + path;

test("anonymous, exact static metadata GET is cached with HIT/MISS", async () => {
  const t = setup(), request = new Request(url("/api/marketplace-categories"));
  const first = await handleRequest(request, env, t.ctx, t.runtime);
  await t.settle();
  assert.equal(first.headers.get("x-campusverse-edge-cache"), "MISS");
  assert.equal(t.cache.writes, 1);
  const second = await handleRequest(request, env, t.ctx, t.runtime);
  assert.equal(second.headers.get("x-campusverse-edge-cache"), "HIT");
  assert.equal(t.calls, 1);
  assert.equal((await second.json()).items[2], 1);
});
test("a live listing is never cached, even when anonymous", async () => {
  const t = setup();
  for (let i = 0; i < 2; i++) {
    const r = await handleRequest(new Request(url("/api/laptops")), env, t.ctx, t.runtime);
    assert.equal(r.headers.get("cache-control"), "private, no-store, max-age=0");
    assert.equal(r.headers.get("x-campusverse-edge-cache"), "BYPASS");
  }
  assert.equal(t.cache.writes, 0);
  assert.equal(t.calls, 2);
});
test("authenticated, cookie-bearing and query requests bypass public cache", async () => {
  const t = setup();
  for (const [path, headers] of [
    ["/api/services", { Authorization: "Bearer secret" }],
    ["/api/services", { Cookie: "session=private" }],
    ["/api/services?q=abc", {}],
    ["/api/services", { Range: "bytes=0-100" }],
  ]) {
    const r = await handleRequest(new Request(url(path), { headers }), env, t.ctx, t.runtime);
    assert.equal(r.headers.get("x-campusverse-edge-cache"), "BYPASS");
  }
  assert.equal(t.cache.writes, 0);
  assert.equal(t.calls, 4);
});
test("private evidence, admin and offer GET requests cannot enter edge cache", async () => {
  const t = setup();
  for (const path of [
    "/api/admin/v2/laptop-ownership/123/document",
    "/api/laptops/mine",
    "/api/laptops/offers",
    "/api/admin/v2/device-offers",
    "/api/me",
    "/api/products",
  ]) {
    const r = await handleRequest(new Request(url(path)), env, t.ctx, t.runtime);
    assert.equal(r.headers.get("cache-control"), "private, no-store, max-age=0");
  }
  assert.equal(t.cache.writes, 0);
});
test("ownership proof POST forwards original binary body, with no cache", async () => {
  const bytes = "private image contents";
  let observed;
  const t = setup();
  t.runtime.fetchImpl = async req => {
    observed = { method: req.method, path: new URL(req.url).pathname, body: await req.text(),
      type: req.headers.get("content-type"), doc: req.headers.get("x-ownership-document-type") };
    return json({ ownershipStatus: "PENDING" });
  };
  const request = new Request(url("/api/laptops/abc/ownership-proof"), {
    method: "POST", headers: {
      "content-type": "application/octet-stream",
      "x-ownership-document-type": "PURCHASE_RECEIPT",
    }, body: bytes,
  });
  const r = await handleRequest(request, env, t.ctx, t.runtime);
  assert.deepEqual(observed, {
    method: "POST", path: "/api/laptops/abc/ownership-proof", body: bytes,
    type: "application/octet-stream", doc: "PURCHASE_RECEIPT",
  });
  assert.equal(r.headers.get("x-campusverse-edge-cache"), "BYPASS");
  assert.equal(t.cache.writes, 0);
});
test("OPTIONS preflight is proxied, not cached", async () => {
  const t = setup();
  const r = await handleRequest(new Request(url("/api/auth/login"), {
    method: "OPTIONS", headers: { Origin: "https://www.campusverse.store", "Access-Control-Request-Method": "POST" },
  }), env, t.ctx, t.runtime);
  assert.equal(r.headers.get("x-campusverse-edge-cache"), "BYPASS");
  assert.equal(t.cache.writes, 0);
});
test("never cache a response with Set-Cookie, error status, private policy or varying origin", async () => {
  const t = setup(), responses = [
    json({}, { "set-cookie": "foo=bar" }),
    json({}, { "cache-control": "private" }),
    json({}, { "vary": "Origin" }),
    new Response("invalid", { status: 401, headers: { "content-type": "application/json" } }),
  ];
  for (const originResponse of responses) {
    t.runtime.fetchImpl = async () => originResponse.clone();
    const r = await handleRequest(new Request(url("/api/services")), env, t.ctx, t.runtime);
    assert.equal(r.headers.get("x-campusverse-edge-cache"), "BYPASS");
  }
  assert.equal(t.cache.writes, 0);
});
test("no arbitrary proxy paths and missing upstream fail closed", async () => {
  const t = setup();
  assert.equal((await handleRequest(new Request(url("/private")), env, t.ctx, t.runtime)).status, 404);
  assert.equal((await handleRequest(new Request(url("/api/services")), {}, t.ctx, t.runtime)).status, 503);
  assert.equal((await handleRequest(new Request(url("/api/services")), {UPSTREAM_ORIGIN:"http://127.0.0.1"}, t.ctx, t.runtime)).status, 503);
  assert.equal(t.calls, 0);
});
test("upstream failures return uncached 502 without leaking network details", async () => {
  const t = setup(); t.runtime.fetchImpl = async () => { throw new Error("secret backend details"); };
  const r = await handleRequest(new Request(url("/api/services")), env, t.ctx, t.runtime);
  assert.equal(r.status, 502);
  assert.doesNotMatch(await r.text(), /secret backend/);
  assert.equal(r.headers.get("cache-control"), "private, no-store, max-age=0");
});
test("cache policy strictly allows only approved public metadata paths", () => {
  assert.equal(cacheEligibility(new Request(url("/api/services"))),60);
  assert.equal(cacheEligibility(new Request(url("/api/marketplace-categories"))),3600);
  assert.equal(cacheEligibility(new Request(url("/api/laptops"))),0);
  assert.equal(mayStoreResponse(json({},{"cache-control":"no-store"})),false);
  assert.equal(mayStoreResponse(json({},{"vary":"Origin"})),false);
});


test("public metadata over 256 KiB is streamed to visitor but never stored", async () => {
  const t = setup();
  const tooLarge = { items: ["a".repeat(270_000)] };
  t.runtime.fetchImpl = async () => json(tooLarge);
  const res = await handleRequest(new Request(url("/api/services")), env, t.ctx, t.runtime);
  assert.equal(res.headers.get("x-campusverse-edge-cache"), "BYPASS");
  assert.deepEqual(await res.json(), tooLarge);
  assert.equal(t.cache.writes, 0);
});

test("a forged short Content-Length cannot bypass the actual byte bound", async () => {
  const t = setup();
  t.runtime.fetchImpl = async () => json({ data: "x".repeat(270_000) }, { "content-length": "15" });
  const res = await handleRequest(new Request(url("/api/marketplace-categories")), env, t.ctx, t.runtime);
  assert.equal(res.headers.get("x-campusverse-edge-cache"), "BYPASS");
  assert.equal(t.cache.writes, 0);
});

test("compressed or partial responses are not cached as public metadata", async () => {
  const t = setup();
  const list = [
    json({ x: 1 }, { "content-encoding": "gzip" }),
    json({ x: 2 }, { "content-range": "bytes 0-10/20" }),
  ];
  for (const data of list) {
    t.runtime.fetchImpl = async () => data.clone();
    const res = await handleRequest(new Request(url("/api/services")), env, t.ctx, t.runtime);
    assert.equal(res.headers.get("x-campusverse-edge-cache"), "BYPASS");
  }
  assert.equal(t.cache.writes, 0);
});
