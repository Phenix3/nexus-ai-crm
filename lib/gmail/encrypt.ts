/**
 * AES-256-GCM encryption/decryption for OAuth tokens.
 * Uses Web Crypto API (available in Next.js Node runtime).
 *
 * Format: "iv_hex:ciphertext_hex"
 */

function getKeyMaterial(): string {
  const key = process.env.ENCRYPTION_KEY;
  if (!key || key.length !== 64) {
    throw new Error("ENCRYPTION_KEY must be set to 64 hex characters (32 bytes)");
  }
  return key;
}

function hexToBytes(hex: string): Uint8Array<ArrayBuffer> {
  const buf = new ArrayBuffer(hex.length / 2);
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return bytes;
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function importKey(): Promise<CryptoKey> {
  const keyBytes = hexToBytes(getKeyMaterial());
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

export async function encrypt(plaintext: string): Promise<string> {
  const key = await importKey();
  const ivBuf = new ArrayBuffer(12);
  const iv = crypto.getRandomValues(new Uint8Array(ivBuf)); // 96-bit IV for AES-GCM
  const encoded = new TextEncoder().encode(plaintext);

  const cipherBuffer = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);

  return `${bytesToHex(iv)}:${bytesToHex(new Uint8Array(cipherBuffer))}`;
}

export async function decrypt(encrypted: string): Promise<string> {
  // Handle "iv:ciphertext" format — ciphertext may contain colons in edge cases, so split on first only
  const colonIdx = encrypted.indexOf(":");
  if (colonIdx === -1) throw new Error("Invalid encrypted value format");
  const ivHex = encrypted.slice(0, colonIdx);
  const ciphertextHex = encrypted.slice(colonIdx + 1);

  const key = await importKey();
  const iv = hexToBytes(ivHex);
  const ciphertext = hexToBytes(ciphertextHex);

  const plainBuffer = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);

  return new TextDecoder().decode(plainBuffer);
}
