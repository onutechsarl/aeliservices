const express = require('express');
const router = express.Router();
const {
    register,
    login,
    refreshAccessToken,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
    getMe
} = require('../controllers/authController');
const { protect } = require('../middlewares/auth');
const { validate } = require('../middlewares/validation');
const { checkAccountLock } = require('../middlewares/security');
const {
    loginLimiter,
    passwordResetLimiter
} = require('../middlewares/rateLimiter');
const {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
} = require('../validators/authValidator');
const { body } = require('express-validator');

const refreshTokenValidation = [
    body('refreshToken').notEmpty().withMessage('Refresh token requis')
];

// ============ PUBLIC ROUTES ============

// Registration (email verification by one-time code has been removed)
router.post('/register', registerValidation, validate, register);

// Login (with account lock check)
router.post('/login', loginLimiter, checkAccountLock, loginValidation, validate, login);

// Refresh token
router.post('/refresh-token', refreshTokenValidation, validate, refreshAccessToken);

// Password reset
router.post('/forgot-password', passwordResetLimiter, forgotPasswordValidation, validate, forgotPassword);
router.post('/reset-password/:token', resetPasswordValidation, validate, resetPassword);

// ============ PROTECTED ROUTES ============

router.get('/me', protect, getMe);
router.post('/logout', protect, logout);
router.post('/logout-all', protect, logoutAll);

module.exports = router;

