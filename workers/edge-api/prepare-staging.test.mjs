import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { checkedPreviewUrl, makeStagingHeaders } from "./prepare-staging.mjs";
const correct = "https://campusverse-edge-api-preview.teamtest.workers.dev/api";
test("only valid CampusVerse preview API workers.dev URLs are accepted", () => {
  assert.equal(checkedPreviewUrl(correct).site, "campusverse-frontend-staging.teamtest.workers.dev");
  for (const bad of [
    "https://evil.example/api",
    "https://campusverse-edge-api-preview.teamtest.workers.dev.evil.com/api",
    "https://campusverse-edge-api-preview.teamtest.workers.dev/admin",
    "https://campusverse-edge-api-preview.teamtest.workers.dev/api?to=evil",
    "http://campusverse-edge-api-preview.teamtest.workers.dev/api",
    "https://other-worker.teamtest.workers.dev/api",
    "https://campusverse-edge-api-preview.teamtest.workers.dev:444/api",
    "",
  ]) assert.throws(() => checkedPreviewUrl(bad));
});
test("exact staging site CSP permits only its designated preview API", () => {
  const base = readFileSync("frontend/public/_headers", "utf8");
  const result = makeStagingHeaders(base, correct);
  assert.match(result, /https:\/\/campusverse-frontend-staging\.teamtest\.workers\.dev\/\*/);
  assert.match(result, /! Content-Security-Policy/);
  assert.match(result, /connect-src 'self' https:\/\/campusverse-edge-api-preview\.teamtest\.workers\.dev /);
  assert.match(result, /X-Robots-Tag: noindex/);
  assert.doesNotMatch(base, /campusverse-edge-api-preview\.teamtest/);
});
