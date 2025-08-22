import crypto from "crypto";

export function generateRefreshToken() {
  // 64 bytes -> 128 hex chars; plenty of entropy
  return crypto.randomBytes(64).toString("hex");
}

export function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}
