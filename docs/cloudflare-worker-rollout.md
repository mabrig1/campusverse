# Cloudflare Worker rollout: CampusVerse

## State
This integration is committed to a GitHub feature branch, not connected to Cloudflare production DNS. The authoritative backend remains at https://campusverse-backend.vercel.app and the active website remains at https://www.campusverse.store. Only the owner approves public cutovers. The repository includes a manual staging workflow; it cannot run until a Cloudflare account is authenticated and staging secrets are configured.

## Architecture
1. **Vercel backend:** Owns authentication, Postgres, device ownership evidence, buy/sell/swap offers and payment/handover records.
2. **Cloudflare API gateway:** workers/edge-api/src/index.js forwards only /api/* to the configured HTTPS backend. /_edge/health reports the gateway status but does not guarantee the origin is healthy.
3. **Optional Cloudflare static frontend:** frontend/wrangler.jsonc stages the compiled React/Vite assets on workers.dev with a single-page-application fallback. Browser-facing assets carry CSP, no-store HTML rules, a no-cache service worker, and immutable hashed JS/CSS.
4. **Existing Vercel frontend:** No domain switch has been performed. A Vite build-time environment variable, VITE_API_URL, can route API calls to the gateway only after acceptance testing.

Cloudflare does not automatically improve every request. Vercel already has a CDN; verify any reduction in cost and latency with actual traffic before migrating. The Worker also adds an extra hop for uncached requests.

## Strict public cache policy
- 3,600-second cache: anonymous GET /api/marketplace-categories with no query parameters.
- 60-second cache: anonymous GET /api/services with no query parameters.
- All other API responses: Cache-Control private, no-store, max-age=0, including all phone/laptop listings, authentication, documents, owner/admin, payment, wallets, escrow and offer routes.
- Any request with Authorization, Cookie, X-API-Key, Range or conditional headers bypasses caching.
- Origin responses with Set-Cookie, private/no-store/no-cache, an unsafe Vary, error status, or non-JSON content type bypass caching.

Never cache the public phone or laptop listings at this stage. A suspected stolen device must be quarantinable immediately rather than served from stale edge cache. The cached static metadata is not a source of ownership truth. The cache is per Cloudflare data center, not shared database storage.

## Non-production validation
From repository root:
    npm ci
    node --test workers/edge-api/src/index.test.js
    node workers/edge-api/validate-config.mjs
    npm run build --workspace=frontend

Optional Wrangler dry-run, after frontend build:
    npx wrangler@4.45.0 deploy --dry-run --config workers/edge-api/wrangler.jsonc
    npx wrangler@4.45.0 deploy --dry-run --config frontend/wrangler.jsonc

Both checked-in Wrangler configurations have workers_dev enabled and no routes. They cannot take over production domains unless an operator changes routing separately. A manual GitHub Actions workflow named Cloudflare staging previews deploys only these two staging Workers. Configure a GitHub environment called cloudflare-preview with approvals and restricted secrets named CLOUDFLARE_API_TOKEN and CLOUDFLARE_ACCOUNT_ID (Workers edit permissions; keep the token out of frontend builds and code). Then manually trigger workflow_dispatch. No secrets are included in the repository.

For a staged workers.dev API URL returned by Cloudflare, smoke-test:
    curl -i https://YOUR-EDGE-WORKER.workers.dev/_edge/health
    curl -i https://YOUR-EDGE-WORKER.workers.dev/api/services
    curl -i https://YOUR-EDGE-WORKER.workers.dev/api/laptops
    curl -i https://YOUR-EDGE-WORKER.workers.dev/api/me

Expect X-Campusverse-Edge-Cache: BYPASS and Cache-Control: no-store for live listings and private routes. No credentials should expose private information. Cache HIT/MISS for anonymous static endpoints may only work on bound Cloudflare domains; dashboard previews do not reliably exercise Cache API. Use authorised disposable test accounts for ownership document and offer flows, not real personal documents.

## Connecting the API subdomain after tests and approval
1. Confirm the campusverse.store Cloudflare DNS zone exists under the correct account. Inventory current DNS records for www, api and the root first.
2. Choose a fresh subdomain such as edge-api.campusverse.store; do not overwrite api.campusverse.store, which could already serve the Vercel backend.
3. In Cloudflare Dashboard > Workers & Pages > the reviewed API Worker > Settings > Domains & Routes > Add Custom Domain, select edge-api.campusverse.store. Cloudflare creates the DNS record and certificate for that hostname. The Worker must continue forwarding upstream to the Vercel backend, not to itself.
4. Set VITE_API_URL=https://edge-api.campusverse.store/api only in Vercel Preview environment, then rebuild the frontend preview. Confirm all buyer, seller and owner flows, including encrypted document upload/download, private serial checks and owner approval.
5. Collect baseline and after-change metrics: Nigerian mobile TTFB, error rates, origin invocation counts, Worker CPU/request usage, bytes transferred, and cache HIT/BYPASS distributions.
6. Only if the owner accepts the evidence, configure the same VITE_API_URL in the Vercel Production environment and rebuild. Nothing in this PR changes the live DNS or production variables automatically.

## Optional static frontend cutover
Test the separate campusverse-frontend-staging workers.dev build as a mirror. Its _headers file aligns with current Vercel CSP and browser security settings. Verify Google sign-in authorized origins, /admin SPA refresh, service worker updates and accessibility. Do not redirect www.campusverse.store to it during initial testing. Any final public frontend cutover requires a separate approval and verified rollback target.

## Rollback
- If the API gateway fails: change VITE_API_URL back to https://campusverse-backend.vercel.app/api in the affected Vercel environment and rebuild. Leave the actual backend and database untouched.
- If a later static-host migration fails: restore the verified Vercel frontend/DNS mapping, and purge only relevant static cache entries.
- Never delete device ownership evidence, reset the database, or rotate LAPTOP_PROOF_ENCRYPTION_KEY_BASE64 as part of a CDN rollback.
- Cloudflare WAF/rate limits, privacy retention, document malware scans and independent stolen-device verification are still separate launch prerequisites, not automatically supplied by an edge proxy.

Official documentation:
- https://developers.cloudflare.com/workers/runtime-apis/cache/
- https://developers.cloudflare.com/workers/static-assets/
- https://developers.cloudflare.com/workers/static-assets/headers/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/

## Connected staging preview (API and frontend together)

For the manual GitHub Action, supply the actual Worker URL `https://campusverse-edge-api-preview.<account-subdomain>.workers.dev/api` in the `api_preview_url` field. The job rejects URLs that do not match the expected HTTPS Worker hostname. It deploys and smoke-tests the API Worker first; it then builds React with `VITE_API_URL` pointing at that Worker and adds a strictly scoped staging-only CSP for that exact preview API origin. The default production frontend and backend configurations remain unchanged.
