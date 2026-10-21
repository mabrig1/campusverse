# CampusVerse student fraud-protection baseline

This branch prioritises accurate trust signals over attractive but false badges.

## Implemented
- Authentication endpoints are rate limited (15 requests per IP/route per 15 minutes, per server instance). Listing report submissions are limited (20/hour/IP/route).
- JSON bodies are capped at 64 KiB. Submission reasons are bounded to 500 characters.
- New accounts are no longer incorrectly marked as phone/email verified merely because an address or number was provided.
- Demo student ID, selfie, NIN, BVN, IMEI and fraud-score routes return **503 unavailable** instead of silently granting verification flags or misrepresenting a fake blacklist as a police check. NIN/BVN collection through these endpoints is therefore disabled.
- Fake wallet top-ups are disabled by default and always disabled in production. A real payment gateway, verified server-to-server webhook, replay protection and reconciliation are required before enabling payments.
- Existing listing report records are retained; this is an intake queue, **not** evidence that moderators have reviewed them.

## Important limitations
- In-memory rate limiting is per process and not sufficient for a horizontally scaled deployment. Add an edge/WAF or Redis-backed limiter, including login challenge handling, before production.
- Existing previously-issued verification flags in the database are **not** retroactively cleared; audit/migrate those values before treating any legacy badges as genuine.
- There is not yet a real verification provider, chargeback handling, moderation review workflow, real-time alert pipeline, or risk-scoring service.
- The wallet still supports internal transfers of existing balances; before processing real customer funds, complete financial, legal, threat-model, abuse and operational review.
- Current social-feed posts are client-local. Moderation for persistent community content must be built alongside the backend social feed.

## Next launch gate
1. Configure database-backed verification states with source, verifier, time and revocation.
2. Implement email verification, phone OTP, fraud-report triage and auditable moderator roles.
3. Choose an authorised identity-verification partner and handle sensitive data with minimal retention; avoid requiring NIN/BVN for basic participation.
4. Verify payment funding only after authenticated gateway webhooks; protect escrow release with ownership and dispute workflow checks.
5. Run unit/integration tests, mobile QA and a security review on staging; do not advertise end-to-end fraud prevention without independent verification.
