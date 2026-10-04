import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 12; // 12 bytes is standard and recommended for GCM
const AUTH_TAG_LENGTH = 16; // 16 bytes auth tag

export interface EncryptedData {
  ciphertext: string;
  iv: string;
  tag: string;
}

/**
 * Derives a consistent 32-byte key for AES-256-GCM.
 * Uses SOCIAL_TOKEN_ENCRYPTION_KEY if provided.
 * Falls back safely in local/test environments using SHA-256 derivation.
 */
function getEncryptionKey(): Buffer {
  const secret =
    process.env.SOCIAL_TOKEN_ENCRYPTION_KEY ||
    process.env.SESSION_SECRET ||
    "infurizz-dev-fallback-social-token-key-2026";

  // SHA-256 guarantees an exact 32-byte (256-bit) key regardless of input format
  return createHash("sha256").update(secret).digest();
}

/**
 * Encrypts sensitive text (e.g. OAuth access token or refresh token) using AES-256-GCM.
 * Generates a unique 12-byte IV per encryption and extracts a 16-byte authentication tag.
 *
 * @param plaintext The secret token string to encrypt.
 * @returns EncryptedData containing hex-encoded ciphertext, iv, and auth tag.
 */
export function encryptToken(plaintext: string): EncryptedData {
  if (!plaintext) {
    throw new Error("Cannot encrypt empty token string.");
  }

  const key = getEncryptionKey();
  const iv = randomBytes(IV_LENGTH);

  const cipher = createCipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  const encryptedBuffer = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);

  const tag = cipher.getAuthTag();

  return {
    ciphertext: encryptedBuffer.toString("hex"),
    iv: iv.toString("hex"),
    tag: tag.toString("hex"),
  };
}

/**
 * Decrypts an AES-256-GCM encrypted token.
 * Authenticates ciphertext against the authentication tag to guarantee integrity.
 *
 * @param encrypted EncryptedData containing hex-encoded ciphertext, iv, and tag.
 * @returns The original decrypted plaintext string.
 */
export function decryptToken(encrypted: EncryptedData): string {
  if (!encrypted || !encrypted.ciphertext || !encrypted.iv || !encrypted.tag) {
    throw new Error("Invalid encrypted payload: ciphertext, iv, and tag are required.");
  }

  const key = getEncryptionKey();
  const iv = Buffer.from(encrypted.iv, "hex");
  const tag = Buffer.from(encrypted.tag, "hex");
  const ciphertextBuffer = Buffer.from(encrypted.ciphertext, "hex");

  if (iv.length !== IV_LENGTH) {
    throw new Error(`Invalid IV length: expected ${IV_LENGTH} bytes, got ${iv.length}`);
  }

  if (tag.length !== AUTH_TAG_LENGTH) {
    throw new Error(`Invalid authentication tag length: expected ${AUTH_TAG_LENGTH} bytes, got ${tag.length}`);
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv, { authTagLength: AUTH_TAG_LENGTH });
  decipher.setAuthTag(tag);

  try {
    const decryptedBuffer = Buffer.concat([
      decipher.update(ciphertextBuffer),
      decipher.final(),
    ]);

    return decryptedBuffer.toString("utf8");
  } catch (error) {
    throw new Error(
      `Decryption failed or token was tampered with: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
