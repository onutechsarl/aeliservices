const ApiUsage = require('../models/ApiUsage');
const logger = require('../utils/logger');

const SKIP_PATHS = ['/api/health', '/api-docs', '/favicon.ico'];

const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi;
const NUMERIC_ID_RE = /\/\d+(?=\/|$)/g;

/**
 * Normalize dynamic path segments so `/api/providers/<uuid>` and
 * `/api/users/123` collapse into `/api/providers/:id` etc.  This keeps the
 * cardinality of `endpoint` low so aggregation queries stay fast and the
 * table doesn't explode.
 */
const normalizePath = (path) => {
    return path
        .replace(UUID_RE, ':id')
        .replace(NUMERIC_ID_RE, '/:id');
};

/**
 * API Analytics tracking middleware
 * Tracks all API requests for analytics (writes one row per request).
 */
const analyticsMiddleware = (req, res, next) => {
    if (SKIP_PATHS.some((p) => req.path.startsWith(p))) {
        return next();
    }

    const startTime = Date.now();
    const originalEnd = res.end;

    res.end = function (chunk, encoding) {
        res.end = originalEnd;

        const duration = Date.now() - startTime;
        const responseSize = chunk ? Buffer.byteLength(chunk) : 0;

        setImmediate(async () => {
            try {
                await ApiUsage.create({
                    endpoint: normalizePath(req.path),
                    method: req.method,
                    statusCode: res.statusCode,
                    duration,
                    userId: req.user?.id || null,
                    ipAddress: req.ip || req.connection?.remoteAddress,
                    userAgent: req.headers['user-agent'],
                    requestSize: req.headers['content-length'] ? parseInt(req.headers['content-length']) : null,
                    responseSize
                });
            } catch (error) {
                if (process.env.NODE_ENV !== 'test') {
                    logger.error('Analytics tracking error:', error.message);
                }
            }
        });

        return originalEnd.call(this, chunk, encoding);
    };

    next();
};

module.exports = { analyticsMiddleware, normalizePath };
