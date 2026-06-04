const crypto = require('crypto');

/**
 * Generate a human-friendly referral code suffix.
 *
 * Uses an alphabet that drops ambiguous characters (0/O, 1/I, etc.) so the
 * code stays legible if a user has to retype it from a screenshot.
 */
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

const randomSuffix = (length) => {
    const bytes = crypto.randomBytes(length);
    let out = '';
    for (let i = 0; i < length; i++) {
        out += ALPHABET[bytes[i] % ALPHABET.length];
    }
    return out;
};

/**
 * Generate a referral code, unique-checked against the User model.
 * Returns the first candidate not yet present in DB.
 */
const generateUniqueReferralCode = async (UserModel, length = 6, maxAttempts = 10) => {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
        const candidate = `AELI-${randomSuffix(length)}`;
        // eslint-disable-next-line no-await-in-loop
        const existing = await UserModel.findOne({
            where: { referralCode: candidate },
            attributes: ['id']
        });
        if (!existing) return candidate;
    }
    // Last resort: append a millisecond suffix to defeat any collision
    return `AELI-${randomSuffix(length)}-${Date.now().toString().slice(-3)}`;
};

module.exports = { generateUniqueReferralCode, randomSuffix };
