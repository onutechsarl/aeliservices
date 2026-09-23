const rateLimit = require('express-rate-limit');
const { RedisStore } = require('rate-limit-redis');
const Redis = require('ioredis');
const logger = require('../utils/logger');

/**
 * Build a Redis-backed store when REDIS_URL/REDIS_HOST is set, so rate limit
 * counters are shared across replicas and survive process restarts.
 * Falls back to the in-process memory store otherwise (single replica only).
 */
let sharedRedisClient = null;
const getStore = (prefix) => {
    const useRedis = !!(process.env.REDIS_URL || process.env.REDIS_HOST);
    if (!useRedis) return undefined;

    if (!sharedRedisClient) {
        const url = process.env.REDIS_URL
            || `redis://${process.env.REDIS_HOST || 'localhost'}:${process.env.REDIS_PORT || 6379}`;
        sharedRedisClient = new Redis(url, {
            // Queue commands until the first connection succeeds, otherwise
            // RedisStore's init script throws at module load time.
            enableOfflineQueue: true,
            maxRetriesPerRequest: 3,
            lazyConnect: false
        });
        sharedRedisClient.on('error', (err) => {
            logger.warn('Rate-limit Redis error:', err.message);
        });
    }

    return new RedisStore({
        prefix: `rl:${prefix}:`,
        sendCommand: (...args) => sharedRedisClient.call(...args)
    });
};

/**
 * Rate limiter for login attempts
 * 5 attempts per 15 minutes
 */
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: {
        success: false,
        message: 'Trop de tentatives de connexion. Veuillez réessayer dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${req.ip}-${req.body.email || 'unknown'}`,
    store: getStore('login')
});

/**
 * Rate limiter for password reset requests
 * 3 attempts per hour
 */
const passwordResetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Trop de demandes de réinitialisation. Veuillez réessayer dans 1 heure.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('pwd-reset')
});

/**
 * General rate limiter for API requests
 * Defaults: 1000 requests per minute per IP (~16 req/s).
 * Sized for ~1k concurrent users; tune via env if needed.
 */
const generalLimiter = rateLimit({
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60 * 1000,
    max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 1000,
    message: {
        success: false,
        message: 'Trop de requêtes. Veuillez ralentir.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('general')
});

/**
 * Rate limiter for contact form submissions
 * 10 contacts per hour per IP
 */
const contactLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Vous avez envoyé trop de messages. Veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('contact')
});

/**
 * Rate limiter for OTP verification
 * 3 attempts per 10 minutes
 */
const otpLimiter = rateLimit({
    windowMs: 10 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Trop de tentatives de vérification OTP. Veuillez réessayer dans 10 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => `${req.ip}-otp-${req.body.email || 'unknown'}`,
    store: getStore('otp')
});

/**
 * Rate limiter for resending OTP
 * 3 resends per hour
 */
const otpResendLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    message: {
        success: false,
        message: 'Trop de demandes de renvoi OTP. Veuillez réessayer dans 1 heure.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('otp-resend')
});

/**
 * Rate limiter for account registration.
 * Deliberately generous (default 20/hour/IP) so it never blocks legitimate
 * sign-ups, while still stopping bulk account creation and OTP-email abuse
 * against third-party addresses. Tunable via REGISTER_RATE_LIMIT_MAX.
 */
const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: parseInt(process.env.REGISTER_RATE_LIMIT_MAX) || 20,
    message: {
        success: false,
        message: 'Trop de tentatives d\'inscription. Veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('register')
});

/**
 * Strict rate limiter for sensitive operations
 * 10 requests per hour
 */
const strictLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Trop de requêtes. Veuillez réessayer plus tard.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    store: getStore('strict')
});

module.exports = {
    loginLimiter,
    passwordResetLimiter,
    generalLimiter,
    contactLimiter,
    otpLimiter,
    otpResendLimiter,
    strictLimiter,
    registerLimiter
};
