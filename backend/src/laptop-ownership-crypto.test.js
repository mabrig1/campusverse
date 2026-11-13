import test from "node:test";
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { evidenceKey, normalizedSerial, normalizedDeviceIdentifier, serialFingerprint, recognizedImage, encryptEvidence, decryptEvidence, recognizedOwnershipDocument, recognizedSellerVideo, sellerVideoAAD, MAX_SELLER_VIDEO_BYTES } from "./laptop-ownership-crypto.js";

test("serial values normalize and get a private, deterministic fingerprint", () => {
  const key = randomBytes(32);
  assert.equal(normalizedSerial(" 5cg-123-abcd "), "5CG123ABCD");
  assert.equal(serialFingerprint("5cg-123-abcd", key), serialFingerprint("5CG123ABCD", key));
  assert.notEqual(serialFingerprint("5CG123ABCD", key), serialFingerprint("5CG123ABCE", key));
  assert.throws(() => normalizedSerial(""), /valid/);
  assert.throws(() => normalizedSerial("!!!"), /valid/);
});
test("encryption is authenticated to the listing and tampering fails", () => {
  const key = randomBytes(32), bytes = Buffer.from("private receipt");
  const encrypted = encryptEvidence(bytes, key, "listing-1");
  assert.notDeepEqual(encrypted.cipherText, bytes);
  assert.deepEqual(decryptEvidence(encrypted, key, "listing-1"), bytes);
  assert.throws(() => decryptEvidence(encrypted, key, "listing-2"));
  const tampered = { ...encrypted, cipherText: Buffer.from(encrypted.cipherText) };
  tampered.cipherText[0] ^= 1;
  assert.throws(() => decryptEvidence(tampered, key, "listing-1"));
});
test("storage fails closed without a correctly formatted encryption key", () => {
  assert.throws(() => evidenceKey({}), /not configured/);
  assert.throws(() => evidenceKey({ LAPTOP_PROOF_ENCRYPTION_KEY_BASE64: "123" }), /not configured/);
  const key = randomBytes(32); assert.deepEqual(evidenceKey({ LAPTOP_PROOF_ENCRYPTION_KEY_BASE64: key.toString("base64") }), key);
});
test("only small JPEG or PNG proof photographs are allowed", () => {
  assert.equal(recognizedImage(Buffer.from("<svg><script>alert(1)</script></svg>")), null);
  assert.equal(recognizedImage(Buffer.from("%PDF-1.7 test")), null);
  assert.equal(recognizedImage(Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), Buffer.alloc(16)])), "image/png");
  assert.equal(recognizedImage(Buffer.concat([Buffer.from([255,216,255]),Buffer.alloc(20),Buffer.from([255,217])])), "image/jpeg");
});

test("valid IMEIs are structural checks only, not stolen-phone clearance", () => {
  assert.equal(normalizedDeviceIdentifier("PHONE", "490154203237518"), "490154203237518");
  assert.throws(() => normalizedDeviceIdentifier("PHONE","490154203237519"), /check digit/);
  const key = randomBytes(32);
  assert.notEqual(serialFingerprint("490154203237518",key,"PHONE"),serialFingerprint("490154203237518",key,"LAPTOP"));
});


test("seller selfie video magic signatures and strict size cap", () => {
  assert.equal(recognizedSellerVideo(Buffer.concat([Buffer.from([0x1a,0x45,0xdf,0xa3]), Buffer.alloc(36)])), "video/webm");
  assert.equal(recognizedSellerVideo(Buffer.concat([Buffer.from([0,0,0,24]), Buffer.from("ftypisom"), Buffer.alloc(32)])), "video/mp4");
  assert.equal(recognizedSellerVideo(Buffer.from("<script>bad file</script>")), null);
  assert.equal(recognizedSellerVideo(Buffer.alloc(MAX_SELLER_VIDEO_BYTES+1)), null);
  const key = randomBytes(32), bytes = Buffer.from("private seller video");
  const ciphertext = encryptEvidence(bytes, key, sellerVideoAAD("listing-9"));
  assert.deepEqual(decryptEvidence(ciphertext,key,sellerVideoAAD("listing-9")),bytes);
  assert.throws(()=>decryptEvidence(ciphertext,key,"listing-9"), /auth|authenticate|Unsupported|unable/i);
});


test("private ownership evidence accepts a well-formed PDF signature without inline rendering", () => {
  const doc = Buffer.concat([Buffer.from("%PDF-1.7\n1 0 obj\nendobj\n"),Buffer.from("%%EOF\n")]);
  assert.equal(recognizedOwnershipDocument(doc),"application/pdf");
  assert.equal(recognizedOwnershipDocument(Buffer.from("%PDF-1.7\ncontent with no final marker")),null);
});
