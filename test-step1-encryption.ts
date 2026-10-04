import { encryptToken, decryptToken } from "./lib/security/encryption";

console.log("==========================================");
console.log("   STEP 1: AES-256-GCM ENCRYPTION TEST    ");
console.log("==========================================\n");

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✔ ${message}`);
  } else {
    console.error(`  ✖ FAIL: ${message}`);
    throw new Error(`Assertion failed: ${message}`);
  }
}

// 1. Basic round-trip test
const sampleToken = "ya29.a0AfH6SMD_SampleYouTubeAccessToken_1234567890_abcdef";
const encrypted = encryptToken(sampleToken);

assert(Boolean(encrypted.ciphertext), "Ciphertext generated");
assert(Boolean(encrypted.iv) && encrypted.iv.length === 24, "IV is 12 bytes (24 hex characters)");
assert(Boolean(encrypted.tag) && encrypted.tag.length === 32, "Auth tag is 16 bytes (32 hex characters)");
assert(encrypted.ciphertext !== sampleToken, "Ciphertext does not expose plaintext token");

const decrypted = decryptToken(encrypted);
assert(decrypted === sampleToken, "Decrypted token matches original plaintext exactly");

// 2. Random IV uniqueness check (same plaintext, different ciphertext & IV)
const encrypted2 = encryptToken(sampleToken);
assert(encrypted.iv !== encrypted2.iv, "Subsequent encryptions generate unique IVs");
assert(encrypted.ciphertext !== encrypted2.ciphertext, "Subsequent encryptions generate unique ciphertexts");
assert(decryptToken(encrypted2) === sampleToken, "Second encryption also decrypts correctly");

// 3. Tamper resistance (authenticated encryption check)
let tamperCaught = false;
try {
  // Alter the last character of ciphertext
  const tamperedCiphertext =
    encrypted.ciphertext.slice(0, -1) +
    (encrypted.ciphertext.slice(-1) === "a" ? "b" : "a");
  decryptToken({
    ...encrypted,
    ciphertext: tamperedCiphertext,
  });
} catch {
  tamperCaught = true;
}
assert(tamperCaught, "Tampered ciphertext is detected and rejected by GCM auth tag");

// 4. Tampered tag check
let tagTamperCaught = false;
try {
  const tamperedTag =
    encrypted.tag.slice(0, -1) + (encrypted.tag.slice(-1) === "0" ? "1" : "0");
  decryptToken({
    ...encrypted,
    tag: tamperedTag,
  });
} catch {
  tagTamperCaught = true;
}
assert(tagTamperCaught, "Tampered auth tag is detected and rejected");

// 5. Empty token rejection
let emptyCaught = false;
try {
  encryptToken("");
} catch {
  emptyCaught = true;
}
assert(emptyCaught, "Empty token encryption is safely rejected");

console.log("\n==========================================");
console.log("   STEP 1 ENCRYPTION VERIFICATION PASSED! ");
console.log("==========================================\n");
