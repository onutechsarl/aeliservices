const crypto = require('crypto');
const logger = require('../utils/logger');

// Store CSRF tokens (in memory for simplicity, use Redis in production for scalability)
const csrfTokens = new Map();

// Token expiration time (1 hour)
const TOKEN_EXPIRY = 60 * 60 * 1000;

/**
 * Generate a CSRF token
 * @returns {string} CSRF token
 */
const generateCSRFToken = () => {
    return crypto.randomBytes(32).toString('hex');
};

/**
 * Clean expired tokens periodically
 */
const cleanExpiredTokens = () => {
    const now = Date.now();
    for (const [token, expiry] of csrfTokens.entries()) {
        if (expiry < now) {
            csrfTokens.delete(token);
        }
    }
};

// Clean expired tokens every 10 minutes.
// unref() so this timer never keeps the process alive (clean shutdown, and it
// no longer blocks the test runner / one-off scripts from exiting).
const csrfCleanupTimer = setInterval(cleanExpiredTokens, 10 * 60 * 1000);
if (typeof csrfCleanupTimer.unref === 'function') {
    csrfCleanupTimer.unref();
}

/**
 * CSRF token generation middleware
 * Sets a CSRF token in a cookie and makes it available in req.csrfToken
 */
const csrfTokenMiddleware = (req, res, next) => {
    // Skip for non-browser requests (API calls with Authorization header)
    if (req.headers.authorization) {
        return next();
    }

    // Check if token exists in cookie
    let token = req.cookies['XSRF-TOKEN'];

    if (!token || !csrfTokens.has(token)) {
        // Generate new token
        token = generateCSRFToken();
        csrfTokens.set(token, Date.now() + TOKEN_EXPIRY);

        // Set cookie (readable by client-side JavaScript)
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false, // Must be readable by client JS
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: TOKEN_EXPIRY
        });
    }

    // Make token available for templates/responses
    req.csrfToken = () => token;
    next();
};

/**
 * CSRF validation middleware
 * Validates CSRF token on state-changing requests (POST, PUT, DELETE, PATCH)
 */
const csrfValidation = (req, res, next) => {
    // Skip for GET, HEAD, OPTIONS requests (safe methods)
    if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
        return next();
    }

    // Skip for API requests with Bearer token (stateless authentication)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return next();
    }

    // Get token from header or body
    const token = req.headers['x-csrf-token'] ||
        req.headers['x-xsrf-token'] ||
        req.body?._csrf;

    if (!token) {
        logger.warn(`CSRF token missing - ${req.method} ${req.path} - IP: ${req.ip}`);
        return res.status(403).json({
            success: false,
            message: 'CSRF token manquant',
            code: 'CSRF_MISSING'
        });
    }

    // Validate token
    if (!csrfTokens.has(token)) {
        logger.warn(`CSRF token invalid - ${req.method} ${req.path} - IP: ${req.ip}`);
        return res.status(403).json({
            success: false,
            message: 'CSRF token invalide ou expiré',
            code: 'CSRF_INVALID'
        });
    }

    // Token is valid, proceed
    next();
};

/**
 * Get CSRF token endpoint handler
 * Use this for SPA frontend to get initial CSRF token
 */
const getCSRFToken = (req, res) => {
    const token = generateCSRFToken();
    csrfTokens.set(token, Date.now() + TOKEN_EXPIRY);

    res.cookie('XSRF-TOKEN', token, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: TOKEN_EXPIRY
    });

    res.json({
        success: true,
        csrfToken: token
    });
};

module.exports = {
    csrfTokenMiddleware,
    csrfValidation,
    getCSRFToken
};
