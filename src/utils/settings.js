const PlatformSetting = require('../models/PlatformSetting');
const cache = require('../config/redis');
const logger = require('./logger');

const CACHE_PREFIX = 'platform-setting:';
const CACHE_TTL = 300; // 5 minutes

const buildKey = (key) => `${CACHE_PREFIX}${key}`;

/**
 * Read a platform setting by key.
 *
 *  1. Hit Redis cache (5 min TTL)
 *  2. On miss, hit the platform_settings table
 *  3. Parse the raw string according to declared valueType
 *  4. Fall back to `defaultValue` argument if the key is not registered yet
 *
 * Designed to be safe to call from hot code paths.
 */
const getSetting = async (key, defaultValue = null) => {
    try {
        const cached = await cache.get(buildKey(key));
        if (cached !== null && cached !== undefined) {
            return cached;
        }
    } catch (err) {
        // Cache errors are non-fatal — fall through to DB
        logger.debug && logger.debug(`settings cache read failed for ${key}: ${err.message}`);
    }

    try {
        const row = await PlatformSetting.findOne({ where: { key } });
        if (!row) return defaultValue;
        const parsed = PlatformSetting.parseValue(row.value, row.valueType);
        try {
            await cache.set(buildKey(key), parsed, CACHE_TTL);
        } catch (err) {
            logger.debug && logger.debug(`settings cache write failed for ${key}: ${err.message}`);
        }
        return parsed;
    } catch (err) {
        logger.error('settings DB read failed:', { key, error: err.message });
        return defaultValue;
    }
};

/**
 * Invalidate the cache for a key (call after admin writes).
 */
const invalidateSetting = async (key) => {
    try {
        await cache.del(buildKey(key));
    } catch (err) {
        logger.debug && logger.debug(`settings cache del failed for ${key}: ${err.message}`);
    }
};

/**
 * Validate a raw input value against the column's declared type & bounds.
 * Returns { ok, value, message }.
 */
const validateSettingInput = (row, rawValue) => {
    const type = row.valueType;

    if (rawValue === undefined || rawValue === null) {
        return { ok: false, message: 'Value is required' };
    }

    if (type === 'bool') {
        if (rawValue === true || rawValue === false) return { ok: true, value: rawValue };
        if (rawValue === 'true' || rawValue === 'false') return { ok: true, value: rawValue === 'true' };
        return { ok: false, message: 'Expected a boolean' };
    }

    if (type === 'int' || type === 'float') {
        const n = type === 'int' ? parseInt(rawValue, 10) : parseFloat(rawValue);
        if (Number.isNaN(n)) return { ok: false, message: `Expected ${type}` };
        if (row.minValue !== null && row.minValue !== undefined) {
            const min = parseFloat(row.minValue);
            if (n < min) return { ok: false, message: `Minimum is ${min}` };
        }
        if (row.maxValue !== null && row.maxValue !== undefined) {
            const max = parseFloat(row.maxValue);
            if (n > max) return { ok: false, message: `Maximum is ${max}` };
        }
        return { ok: true, value: n };
    }

    if (type === 'json') {
        if (typeof rawValue === 'object') return { ok: true, value: rawValue };
        try {
            return { ok: true, value: JSON.parse(rawValue) };
        } catch (e) {
            return { ok: false, message: 'Invalid JSON' };
        }
    }

    // string
    return { ok: true, value: String(rawValue) };
};

module.exports = {
    getSetting,
    invalidateSetting,
    validateSettingInput
};
