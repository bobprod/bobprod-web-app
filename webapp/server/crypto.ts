import crypto from 'node:crypto';

// AES-256-GCM helpers for encrypting BYOK provider API keys at rest.
// Key material is separate from JWT_SECRET (different trust boundary — session
// signing vs. secrets-at-rest) per docs/architecture/assistant-llm.md.

if (!process.env.LLM_ENCRYPTION_KEY) {
  throw new Error('LLM_ENCRYPTION_KEY is not set — add it to server/.env');
}
const LLM_ENCRYPTION_KEY: string = process.env.LLM_ENCRYPTION_KEY;
if (!/^[0-9a-fA-F]{64}$/.test(LLM_ENCRYPTION_KEY)) {
  throw new Error(
    'LLM_ENCRYPTION_KEY must be a 64-character hex string (32 bytes) — generate one with ' +
      `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`,
  );
}
const KEY = Buffer.from(LLM_ENCRYPTION_KEY, 'hex');

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV, recommended size for GCM

/** Encrypts `plaintext`, returning `iv:authTag:ciphertext` (all hex-encoded, colon-joined). */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted.toString('hex')}`;
}

/** Reverses {@link encrypt}. Throws if the ciphertext is malformed or the auth tag doesn't match. */
export function decrypt(ciphertext: string): string {
  const parts = ciphertext.split(':');
  if (parts.length !== 3) {
    throw new Error('Malformed ciphertext: expected "iv:authTag:data"');
  }
  const [ivHex, authTagHex, dataHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const data = Buffer.from(dataHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
  return decrypted.toString('utf8');
}

/** Masks a plaintext API key for display — never send the real key or a decrypted value to an HTTP response. */
export function maskApiKey(plaintext: string): string {
  if (plaintext.length <= 4) return '••••';
  return `••••${plaintext.slice(-4)}`;
}
