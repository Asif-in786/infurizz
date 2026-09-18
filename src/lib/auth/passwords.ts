import { scryptSync, randomBytes, timingSafeEqual } from "crypto";

/**
 * Secure password hashing using Node.js native crypto scrypt.
 * Formats hash as salt:derivedKey.
 */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

/**
 * Timing-safe password verification against stored scrypt hash.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  try {
    const [salt, key] = storedHash.split(":");
    if (!salt || !key) return false;
    const derived = scryptSync(password, salt, 64);
    const keyBuffer = Buffer.from(key, "hex");
    if (derived.length !== keyBuffer.length) return false;
    return timingSafeEqual(derived, keyBuffer);
  } catch {
    return false;
  }
}
