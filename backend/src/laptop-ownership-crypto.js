import { createCipheriv, createDecipheriv, createHmac, randomBytes } from "node:crypto";

export const MAX_EVIDENCE_BYTES = 2 * 1024 * 1024;
export const PROOF_TYPES = ["PURCHASE_RECEIPT", "BILL_OF_SALE", "ORGANISATION_RELEASE"];

export function evidenceKey(env = process.env) {
  const value = env.LAPTOP_PROOF_ENCRYPTION_KEY_BASE64;
  if (!value || !/^[A-Za-z0-9+/]{43}=$/.test(value)) {
    throw new Error("Ownership evidence storage not configured");
  }
  const key = Buffer.from(value, "base64");
  if (key.length !== 32) throw new Error("Ownership evidence storage not configured");
  return key;
}

export function normalizedSerial(input) {
  const serial = String(input ?? "").trim().toUpperCase().replace(/[-\s]/g, "");
  if (!/^[A-Z0-9]{6,40}$/.test(serial)) throw new Error("Enter a valid 6–40 character serial number from the laptop chassis or firmware");
  return serial;
}

export function normalizedDeviceIdentifier(deviceType, input) {
  if (deviceType === "LAPTOP") return normalizedSerial(input);
  if (deviceType !== "PHONE") throw new Error("Invalid device type");
  const imei = String(input ?? "").trim().replace(/[\s-]/g, "");
  if (!/^\d{15}$/.test(imei)) throw new Error("Enter the device’s 15-digit IMEI from Settings or its original box");
  const digits = [...imei].map(Number);
  const checksum = digits.reduce((sum, digit, index) => {
    if (index % 2 === 1) { const x = digit * 2; return sum + (x > 9 ? x - 9 : x); }
    return sum + digit;
  }, 0);
  if (checksum % 10 !== 0) throw new Error("Invalid IMEI check digit; recheck the phone number");
  return imei;
}

export function serialFingerprint(serial, key, deviceType = "LAPTOP") {
  const value = normalizedDeviceIdentifier(deviceType, serial);
  return createHmac("sha256", key).update("campusverse:device:identifier:v2:" + deviceType + ":" + value).digest("hex");
}

export function recognizedImage(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 20 || bytes.length > MAX_EVIDENCE_BYTES) return null;
  const isPng = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (isPng) return "image/png";
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff &&
    bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9;
  if (isJpeg) return "image/jpeg";
  return null;
}

export function encryptEvidence(bytes, key, listingId) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key, iv);
  cipher.setAAD(Buffer.from("campusverse:laptop:proof:v1:" + listingId));
  const cipherText = Buffer.concat([cipher.update(bytes), cipher.final()]);
  return { cipherText, iv, authTag: cipher.getAuthTag() };
}

export function decryptEvidence({ cipherText, iv, authTag }, key, listingId) {
  const decipher = createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAAD(Buffer.from("campusverse:laptop:proof:v1:" + listingId));
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(cipherText), decipher.final()]);
}


// Browser-camera proof is encrypted at rest; it is never publicly hosted.
// This recognizes container headers only; manual review is still required.
export const MAX_SELLER_VIDEO_BYTES = 2 * 1024 * 1024;
export function recognizedSellerVideo(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 16 || bytes.length > MAX_SELLER_VIDEO_BYTES) return null;
  if (bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3]))) return "video/webm";
  if (bytes.subarray(4,8).toString("ascii") === "ftyp") return "video/mp4";
  return null;
}
export function sellerVideoAAD(listingId) {
  return "seller-intent-video:" + listingId;
}
