import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Hash a plain-text password using scrypt.
 * Returns a string in the format "salt:hash" (both hex-encoded).
 */
export function hashPassword(plain: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(plain, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Verify a plain-text password against a stored "salt:hash" string.
 * Uses timing-safe comparison to prevent timing attacks.
 */
export function verifyPassword(plain: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const hashBuffer = Buffer.from(hash, "hex");
  const supplied = scryptSync(plain, salt, 64);
  return timingSafeEqual(hashBuffer, supplied);
}
