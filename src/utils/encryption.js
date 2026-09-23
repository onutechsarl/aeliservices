/**
 * Encryption Utility for Sensitive Data
 * Uses AES-256-GCM for authenticated encryption
 */

const crypto = require('crypto');
const logger = require('./logger');

// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16; // 128 bits
const AUTH_TAG_LENGTH = 16; // 128 bits
const ENCODING = 'hex';

/**
 * Get encryption key from environment
 * Must be exactly 32 characters (256 bits)
 */
const getEncryptionKey = () => {
    let key = process.env.ENCRYPTION_KEY;

    // Fallback for test environment
    if (!key && process.env.NODE_ENV === 'test') {
        key = 'test-encryption-key-32-chars!!!!';
    }

    if (!key) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
    }

    if (key.length !== 32) {
        throw new Error('ENCRYPTION_KEY must be exactly 32 characters');
    }

    return Buffer.from(key, 'utf8');
};

/**
 * Encrypt a string using AES-256-GCM
 * @param {string} text - Plain text to encrypt
 * @returns {string} Encrypted text (iv:authTag:ciphertext)
 */
const encrypt = (text) => {
    if (!text || typeof text !== 'string') {
        return text;
    }

    try {
        const key = getEncryptionKey();
        const iv = crypto.randomBytes(IV_LENGTH);
        const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

        let encrypted = cipher.update(text, 'utf8', ENCODING);
        encrypted += cipher.final(ENCODING);

        const authTag = cipher.getAuthTag();

        // Format: iv:authTag:ciphertext
        return `${iv.toString(ENCODING)}:${authTag.toString(ENCODING)}:${encrypted}`;
    } catch (error) {
        logger.error('Encryption error:', {
            error: error.message,
            stack: error.stack
        });
        throw new Error('Failed to encrypt data');
    }
};

/**
 * Decrypt a string using AES-256-GCM
 * @param {string} encryptedText - Encrypted text (iv:authTag:ciphertext)
 * @returns {string} Decrypted plain text
 */
const decrypt = (encryptedText, options = {}) => {
    const { strict = false } = options;

    if (!encryptedText || typeof encryptedText !== 'string') {
        return encryptedText;
    }

    // Values that are not in our encrypted format are legacy plaintext and are
    // returned unchanged (e.g. a phone stored before encryption was added).
    if (!isEncrypted(encryptedText)) {
        return encryptedText;
    }

    try {
        const key = getEncryptionKey();
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], ENCODING);
        const authTag = Buffer.from(parts[1], ENCODING);
        const encrypted = parts[2];

        const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
        decipher.setAuthTag(authTag);

        let decrypted = decipher.update(encrypted, ENCODING, 'utf8');
        decrypted += decipher.final('utf8');

        return decrypted;
    } catch (error) {
        // The value *is* in encrypted format but failed authentication: this is
        // real corruption, tampering, or a wrong ENCRYPTION_KEY. Never return
        // the raw ciphertext (it would leak hex to the client). Fail explicitly
        // in strict mode; otherwise surface null so callers don't expose it.
        logger.error('Decryption failed for an encrypted-format value:', {
            error: error.message
        });
        if (strict) {
            throw new Error('Failed to decrypt data');
        }
        return null;
    }
};

/**
 * Create a blind index for searchable encryption
 * Uses HMAC-SHA256 for deterministic hashing
 * @param {string} text - Text to hash
 * @returns {string} Hex hash for searching
 */
const createBlindIndex = (text) => {
    if (!text || typeof text !== 'string') {
        return null;
    }

    try {
        // Domain-separate the blind-index key from the AES key so the two uses
        // never share the same secret. (No blind indexes are persisted yet, so
        // changing this derivation breaks nothing.)
        const masterKey = getEncryptionKey();
        const indexKey = crypto
            .createHmac('sha256', masterKey)
            .update('aeli-blind-index-key-v1')
            .digest();
        const hmac = crypto.createHmac('sha256', indexKey);
        hmac.update(text.toLowerCase().trim());
        return hmac.digest('hex');
    } catch (error) {
        logger.error('Blind index error:', {
            error: error.message,
            stack: error.stack
        });
        return null;
    }
};

/**
 * Check if a value is already encrypted
 * @param {string} value - Value to check
 * @returns {boolean} True if encrypted
 */
const isEncrypted = (value) => {
    if (!value || typeof value !== 'string') {
        return false;
    }

    const parts = value.split(':');
    if (parts.length !== 3) {
        return false;
    }

    // Check if parts look like hex values
    const hexRegex = /^[0-9a-f]+$/i;
    return parts.every(part => hexRegex.test(part));
};

/**
 * Encrypt field if not already encrypted
 * @param {string} value - Value to encrypt
 * @returns {string} Encrypted value
 */
const encryptIfNeeded = (value) => {
    if (!value || isEncrypted(value)) {
        return value;
    }
    return encrypt(value);
};

/**
 * Generate a random 32-character encryption key (for setup).
 *
 * Uses base64url of 24 random bytes, which is exactly 32 characters and
 * carries 192 bits of entropy — as opposed to the previous hex-of-16-bytes
 * (32 chars but only 128 bits). Note: the key is used directly as the AES-256
 * key, so its byte length caps the effective strength; treat this as a
 * high-entropy secret and rotate it via a re-encryption migration if raised.
 */
const generateEncryptionKey = () => {
    return crypto.randomBytes(24).toString('base64url');
};

module.exports = {
    encrypt,
    decrypt,
    createBlindIndex,
    isEncrypted,
    encryptIfNeeded,
    generateEncryptionKey
};
