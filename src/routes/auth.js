const express = require('express');
const router = express.Router();
const {
    register,
    verifyOTPCode,
    resendOTP,
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
    passwordResetLimiter,
    otpLimiter,
    otpResendLimiter,
    registerLimiter
} = require('../middlewares/rateLimiter');
const {
    registerValidation,
    loginValidation,
    forgotPasswordValidation,
    resetPasswordValidation
} = require('../validators/authValidator');
const { body } = require('express-validator');

// OTP validation
const otpValidation = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail(),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Code OTP invalide')
];

const resendOtpValidation = [
    body('email').isEmail().withMessage('Email invalide').normalizeEmail()
];

const refreshTokenValidation = [
    body('refreshToken').notEmpty().withMessage('Refresh token requis')
];

// ============ PUBLIC ROUTES ============

// Registration & OTP
router.post('/register', registerLimiter, registerValidation, validate, register);
router.post('/verify-otp', otpLimiter, otpValidation, validate, verifyOTPCode);
router.post('/resend-otp', otpResendLimiter, resendOtpValidation, validate, resendOTP);

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

