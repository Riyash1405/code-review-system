import { describe, it, expect } from 'vitest';
import { encrypt, decrypt, timingSafeEqual } from '../crypto.js';
import crypto from 'crypto';

describe('Crypto Utilities', () => {
  describe('encrypt and decrypt', () => {
    it('should correctly encrypt and decrypt a string', () => {
      const plaintext = 'super-secret-token-123';
      
      const encrypted = encrypt(plaintext);
      
      // Should not be plain text
      expect(encrypted).not.toContain(plaintext);
      // Should have iv, authTag, and ciphertext (3 parts)
      expect(encrypted.split(':').length).toBe(3);

      const decrypted = decrypt(encrypted);
      expect(decrypted).toBe(plaintext);
    });

    it('should return different ciphertexts for the same plaintext due to random IV', () => {
      const plaintext = 'hello-world';
      const encrypted1 = encrypt(plaintext);
      const encrypted2 = encrypt(plaintext);

      expect(encrypted1).not.toBe(encrypted2);
      expect(decrypt(encrypted1)).toBe(plaintext);
      expect(decrypt(encrypted2)).toBe(plaintext);
    });

    it('should throw an error when trying to decrypt invalid or tampered text', () => {
      const plaintext = 'hello';
      const encrypted = encrypt(plaintext);
      
      const parts = encrypted.split(':');
      // Tamper with the ciphertext
      parts[2] = '0000' + parts[2].substring(4);
      const tampered = parts.join(':');

      expect(() => decrypt(tampered)).toThrow();
    });
  });

  describe('timingSafeEqual', () => {
    it('should return true for identical strings', () => {
      expect(timingSafeEqual('hello', 'hello')).toBe(true);
    });

    it('should return false for different strings of same length', () => {
      expect(timingSafeEqual('hello', 'world')).toBe(false);
    });

    it('should return false for strings of different lengths', () => {
      expect(timingSafeEqual('hello', 'hello world')).toBe(false);
    });
  });
});
