/**
 * Unit Tests for Encryption Utility
 * Tests AES-256-GCM encryption/decryption functionality
 */

describe('Encryption Utility', () => {
    // Store original env
    const originalEnv = process.env.ENCRYPTION_KEY;

    beforeAll(() => {
        // Set test encryption key (must be exactly 32 characters)
        process.env.ENCRYPTION_KEY = 'test-encryption-key-32-chars!!!!';
    });

    afterAll(() => {
        // Restore original env
        process.env.ENCRYPTION_KEY = originalEnv;
    });

    // Re-require module after env setup
    let encryption;
    beforeEach(() => {
        jest.resetModules();
        encryption = require('../../src/utils/encryption');
    });

    describe('encrypt()', () => {
        test('should encrypt a plain text string', () => {
            const plainText = 'Hello World';
            const encrypted = encryption.encrypt(plainText);

            expect(encrypted).toBeDefined();
            expect(encrypted).not.toBe(plainText);
            expect(encrypted).toContain(':'); // Format: iv:authTag:ciphertext
        });

        test('should return different ciphertexts for same input (random IV)', () => {
            const plainText = 'Same Text';
            const encrypted1 = encryption.encrypt(plainText);
            const encrypted2 = encryption.encrypt(plainText);

            expect(encrypted1).not.toBe(encrypted2);
        });

        test('should return null/undefined for null input', () => {
            expect(encryption.encrypt(null)).toBeNull();
        });

        test('should return undefined for undefined input', () => {
            expect(encryption.encrypt(undefined)).toBeUndefined();
        });

        test('should return non-string values as-is', () => {
            const num = 12345;
            expect(encryption.encrypt(num)).toBe(num);
        });

        test('should handle empty string', () => {
            const result = encryption.encrypt('');
            expect(result).toBe('');
        });

        test('should handle special characters', () => {
            const specialChars = '!@#$%^&*()_+-=[]{}|;:,.<>?éàü中文';
            const encrypted = encryption.encrypt(specialChars);
            expect(encrypted).toContain(':');
        });

        test('should handle long strings', () => {
            const longString = 'A'.repeat(10000);
            const encrypted = encryption.encrypt(longString);
            expect(encrypted).toContain(':');
        });
    });

    describe('decrypt()', () => {
        test('should decrypt an encrypted string back to original', () => {
            const plainText = 'Hello World';
            const encrypted = encryption.encrypt(plainText);
            const decrypted = encryption.decrypt(encrypted);

            expect(decrypted).toBe(plainText);
        });

        test('should return non-encrypted strings as-is', () => {
            const plainText = 'Not Encrypted';
            expect(encryption.decrypt(plainText)).toBe(plainText);
        });

        test('should return null for null input', () => {
            expect(encryption.decrypt(null)).toBeNull();
        });

        test('should return undefined for undefined input', () => {
            expect(encryption.decrypt(undefined)).toBeUndefined();
        });

        test('should handle encrypted special characters', () => {
            const specialChars = '!@#$%^&*()éàü中文';
            const encrypted = encryption.encrypt(specialChars);
            const decrypted = encryption.decrypt(encrypted);
            expect(decrypted).toBe(specialChars);
        });

        test('should handle encrypted long strings', () => {
            const longString = 'A'.repeat(10000);
            const encrypted = encryption.encrypt(longString);
            const decrypted = encryption.decrypt(encrypted);
            expect(decrypted).toBe(longString);
        });

        test('should return original for invalid format (wrong number of parts)', () => {
            const invalidFormat = 'part1:part2';
            expect(encryption.decrypt(invalidFormat)).toBe(invalidFormat);
        });
    });

    describe('isEncrypted()', () => {
        test('should return true for encrypted string', () => {
            const encrypted = encryption.encrypt('test');
            expect(encryption.isEncrypted(encrypted)).toBe(true);
        });

        test('should return false for plain string', () => {
            expect(encryption.isEncrypted('plain text')).toBe(false);
        });

        test('should return false for null', () => {
            expect(encryption.isEncrypted(null)).toBe(false);
        });

        test('should return false for undefined', () => {
            expect(encryption.isEncrypted(undefined)).toBe(false);
        });

        test('should return false for non-string values', () => {
            expect(encryption.isEncrypted(12345)).toBe(false);
            expect(encryption.isEncrypted({})).toBe(false);
        });

        test('should return false for string with colons but not hex', () => {
            expect(encryption.isEncrypted('not:hex:values')).toBe(false);
        });
    });

    describe('encryptIfNeeded()', () => {
        test('should encrypt plain text', () => {
            const plainText = 'My Phone Number';
            const result = encryption.encryptIfNeeded(plainText);
            expect(result).toContain(':');
            expect(encryption.isEncrypted(result)).toBe(true);
        });

        test('should not double-encrypt already encrypted text', () => {
            const plainText = 'Already Encrypted Test';
            const encrypted = encryption.encrypt(plainText);
            const result = encryption.encryptIfNeeded(encrypted);

            // Should return same value
            expect(result).toBe(encrypted);

            // Decrypting should give original
            expect(encryption.decrypt(result)).toBe(plainText);
        });

        test('should return null for null input', () => {
            expect(encryption.encryptIfNeeded(null)).toBeNull();
        });

        test('should return undefined for undefined input', () => {
            expect(encryption.encryptIfNeeded(undefined)).toBeUndefined();
        });
    });

    describe('createBlindIndex()', () => {
        test('should create a deterministic hash for same input', () => {
            const text = 'test@example.com';
            const hash1 = encryption.createBlindIndex(text);
            const hash2 = encryption.createBlindIndex(text);

            expect(hash1).toBe(hash2);
            expect(hash1).toHaveLength(64); // SHA-256 produces 64 hex chars
        });

        test('should create different hashes for different inputs', () => {
            const hash1 = encryption.createBlindIndex('email1@test.com');
            const hash2 = encryption.createBlindIndex('email2@test.com');

            expect(hash1).not.toBe(hash2);
        });

        test('should be case-insensitive', () => {
            const hash1 = encryption.createBlindIndex('TEST@EXAMPLE.COM');
            const hash2 = encryption.createBlindIndex('test@example.com');

            expect(hash1).toBe(hash2);
        });

        test('should trim whitespace', () => {
            const hash1 = encryption.createBlindIndex('  test@example.com  ');
            const hash2 = encryption.createBlindIndex('test@example.com');

            expect(hash1).toBe(hash2);
        });

        test('should return null for null input', () => {
            expect(encryption.createBlindIndex(null)).toBeNull();
        });

        test('should return null for empty string', () => {
            expect(encryption.createBlindIndex('')).toBeNull();
        });
    });

    describe('generateEncryptionKey()', () => {
        test('should generate a 32-character key', () => {
            const key = encryption.generateEncryptionKey();
            expect(key).toHaveLength(32);
        });

        test('should generate unique keys', () => {
            const key1 = encryption.generateEncryptionKey();
            const key2 = encryption.generateEncryptionKey();
            expect(key1).not.toBe(key2);
        });

        test('should generate a URL-safe (base64url) key', () => {
            const key = encryption.generateEncryptionKey();
            expect(/^[A-Za-z0-9_-]+$/.test(key)).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle decryption with tampered ciphertext gracefully', () => {
            const encrypted = encryption.encrypt('test');
            const parts = encrypted.split(':');
            // Tamper with ciphertext
            parts[2] = 'tamperedciphertext';
            const tampered = parts.join(':');

            // Should return original (silently fail) rather than throw
            const result = encryption.decrypt(tampered);
            expect(result).toBe(tampered);
        });

        test('should return null (never the raw hex) for an authentic-format but corrupt value', () => {
            const encrypted = encryption.encrypt('secret');
            const parts = encrypted.split(':');
            // Flip the ciphertext to a valid-hex but wrong value so it parses as
            // encrypted-format yet fails authentication.
            parts[2] = parts[2].replace(/./, (c) => (c === 'a' ? 'b' : 'a'));
            const corrupt = parts.join(':');

            const result = encryption.decrypt(corrupt);
            expect(result).toBeNull();
        });

        test('should throw in strict mode for a corrupt encrypted value', () => {
            const encrypted = encryption.encrypt('secret');
            const parts = encrypted.split(':');
            parts[2] = parts[2].replace(/./, (c) => (c === 'a' ? 'b' : 'a'));
            const corrupt = parts.join(':');

            expect(() => encryption.decrypt(corrupt, { strict: true })).toThrow();
        });
    });
});
