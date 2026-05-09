const jwt = require('jsonwebtoken');
const { User } = require('../models');

/**
 * Session inactivity timeout in hours
 */
const SESSION_TIMEOUT_HOURS = parseInt(process.env.SESSION_TIMEOUT_HOURS) || 24;

/**
 * Middleware to protect routes - verifies JWT access token
 */
const protect = async (req, res, next) => {
    let token;

    // Check for token in Authorization header
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    // Check if token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Non autorisé, veuillez vous connecter',
            code: 'NO_TOKEN'
        });
    }

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Find user and attach to request
        const user = await User.findByPk(decoded.id, {
            attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'otpCode', 'otpExpires'] }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Utilisateur non trouvé',
                code: 'USER_NOT_FOUND'
            });
        }

        // Check if user is active
        if (!user.isActive) {
            return res.status(401).json({
                success: false,
                message: 'Ce compte a été désactivé',
                code: 'ACCOUNT_DISABLED'
            });
        }

        // Check session inactivity
        if (user.lastActivity) {
            const hoursSinceActivity = (new Date() - new Date(user.lastActivity)) / (1000 * 60 * 60);
            if (hoursSinceActivity > SESSION_TIMEOUT_HOURS) {
                return res.status(401).json({
                    success: false,
                    message: 'Session expirée. Veuillez vous reconnecter.',
                    code: 'SESSION_EXPIRED'
                });
            }
        }

        // Update last activity
        await User.update(
            { lastActivity: new Date() },
            { where: { id: user.id } }
        );

        req.user = user;
        next();
    } catch (error) {
        const logger = require('../utils/logger');
        logger.error('Auth middleware error:', {
            error: error.message,
            stack: error.stack
        });

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expiré. Utilisez le refresh token.',
                code: 'TOKEN_EXPIRED'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Token invalide',
            code: 'INVALID_TOKEN'
        });
    }
};

/**
 * Middleware to restrict access to certain roles.
 *
 * Admins implicitly satisfy any role check: a user with role="admin" passes
 * restrictTo("provider"), restrictTo("client"), etc. This lets an admin who
 * also runs their own Provider profile use provider-only routes without
 * having to switch role.
 *
 * @param  {...string} roles - Allowed roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission d\'effectuer cette action',
                code: 'FORBIDDEN'
            });
        }
        const allowed = roles.includes(req.user.role) || req.user.role === 'admin';
        if (!allowed) {
            return res.status(403).json({
                success: false,
                message: 'Vous n\'avez pas la permission d\'effectuer cette action',
                code: 'FORBIDDEN'
            });
        }
        next();
    };
};

/**
 * Optional authentication - attaches user if token is present but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findByPk(decoded.id, {
                attributes: { exclude: ['password', 'resetPasswordToken', 'resetPasswordExpires', 'otpCode', 'otpExpires'] }
            });
            if (user && user.isActive) {
                req.user = user;
            }
        } catch (error) {
            // Token invalid, continue without user
        }
    }

    next();
};

/**
 * Middleware to require email verification
 */
const requireVerifiedEmail = (req, res, next) => {
    if (!req.user.isEmailVerified) {
        return res.status(403).json({
            success: false,
            message: 'Veuillez vérifier votre email pour accéder à cette fonctionnalité.',
            code: 'EMAIL_NOT_VERIFIED'
        });
    }
    next();
};

/**
 * Generate JWT token (legacy - use authController functions instead)
 * @param {string} userId - User ID to encode
 * @returns {string} JWT token
 */
const generateToken = (userId) => {
    return jwt.sign(
        { id: userId, type: 'access' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
    );
};

module.exports = {
    protect,
    restrictTo,
    optionalAuth,
    requireVerifiedEmail,
    generateToken
};

