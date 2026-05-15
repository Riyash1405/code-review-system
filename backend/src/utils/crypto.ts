import crypto from 'crypto';

const ALGORITHM = 'aes-256-gcm';

// Lazy getter — reads process.env directly at call time.
// We intentionally bypass the env.ts module here to avoid the circular
// import-time dependency that causes CI failures when running tests
// (env.ts → validateEnv() runs before setupFiles inject the dummy key).
let _key: Buffer | null = null;
function getKey(): Buffer {
  if (!_key) {
    const raw = process.env.ENCRYPTION_KEY;
    if (!raw) {
      throw new Error('ENCRYPTION_KEY environment variable is not set');
    }
    _key = Buffer.from(raw, 'hex');
  }
  return _key;
}

/**
 * Encrypts a plaintext string using AES-256-GCM.
 * @returns Format: iv:authTag:ciphertext (all in hex)
 */
export function encrypt(plaintext: string): string {
  const iv = crypto.randomBytes(12); // 96-bit IV is standard for GCM
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);

  let encrypted = cipher.update(plaintext, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  const authTag = cipher.getAuthTag().toString('hex');

  return `${iv.toString('hex')}:${authTag}:${encrypted}`;
}

/**
 * Decrypts an AES-256-GCM encrypted string.
 * @param encrypted Format: iv:authTag:ciphertext (all in hex)
 */
export function decrypt(encrypted: string): string {
  const parts = encrypted.split(':');
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted string format. Expected iv:authTag:ciphertext');
  }

  const [ivHex, authTagHex, ciphertextHex] = parts;
  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');

  const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(ciphertextHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
}

/**
 * Timing-safe comparison of two strings or buffers.
 */
export function timingSafeEqual(a: string | Buffer, b: string | Buffer): boolean {
  const bufA = Buffer.isBuffer(a) ? a : Buffer.from(a, 'utf8');
  const bufB = Buffer.isBuffer(b) ? b : Buffer.from(b, 'utf8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
