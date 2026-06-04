const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Provider, RefreshToken, Referral } = require("../models");
const { asyncHandler, AppError } = require("../middlewares/errorHandler");
const { sendEmail } = require("../config/email");
const {
  welcomeEmail,
  passwordResetEmail,
  otpEmail,
} = require("../utils/emailTemplates");
const {
  generateResetToken,
  hashToken,
  i18nResponse,
  successResponse,
  sendEmailSafely,
  getFrontendUrl,
} = require("../utils/helpers");
const {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  isOTPExpired,
} = require("../utils/otp");
const logger = require("../utils/logger");
const referralReward = require("../services/referralReward");
const { getSetting } = require("../utils/settings");
const {
  handleFailedLogin,
  handleSuccessfulLogin,
  handleFailedOTP,
  handleSuccessfulOTP,
  logSecurityEvent,
} = require("../middlewares/security");
const { auditLogger } = require("../middlewares/audit");

/**
 * Generate access token (short-lived)
 */
const generateAccessToken = (userId) => {
  return jwt.sign({ id: userId, type: "access" }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_ACCESS_EXPIRES || "15m",
  });
};

/**
 * Generate refresh token (long-lived)
 */
const generateRefreshToken = () => {
  return crypto.randomBytes(64).toString("hex");
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 * @access  Public
 */
const register = asyncHandler(async (req, res) => {
  const {
    email,
    password,
    confirmPassword,
    firstName,
    lastName,
    phone,
    country,
    gender,
    referralCode,
  } = req.body;

  // Validate confirmPassword
  if (password !== confirmPassword) {
    throw new AppError(req.t("validation.passwordMismatch"), 400);
  }

  // Check if user already exists
  const existingUser = await User.findOne({ where: { email } });
  if (existingUser) {
    throw new AppError(req.t("validation.emailInUse"), 400);
  }

  // Resolve optional referral code BEFORE creating the user, so we never end
  // up with an orphan user when the Referral insert fails. The code is best-
  // effort: an unknown code does not block the registration.
  let referrer = null;
  if (referralCode) {
    const normalized = String(referralCode).trim().toUpperCase();
    referrer = await User.findOne({
      where: { referralCode: normalized, isActive: true },
      attributes: ["id", "referralCode"],
    });
    if (!referrer) {
      logger.warn("Unknown referral code submitted on register", {
        code: normalized,
      });
    }
  }

  // Create user (email not verified)
  const user = await User.create({
    email,
    password,
    firstName,
    lastName,
    phone,
    country: country || "Cameroun",
    gender,
    role: "client", // All users start as clients, can apply to become provider
    isEmailVerified: false,
  });

  // Record the referral as pending. The bonus is applied later by the
  // referralReward service; the exact moment depends on the platform setting
  // `referral.requireEmailVerified` (default true → wait for OTP verification).
  if (referrer && referrer.id !== user.id) {
    try {
      await Referral.create({
        referrerId: referrer.id,
        referredUserId: user.id,
        codeUsed: referrer.referralCode,
        status: "pending",
      });

      // If the gate is disabled, attempt the reward immediately.
      const requireVerified = await getSetting('referral.requireEmailVerified', true);
      if (!requireVerified) {
        referralReward
          .attemptReward(user.id, { req })
          .catch((err) => logger.error('Referral reward failed', { error: err.message }));
      }
    } catch (err) {
      logger.warn("Could not record referral", {
        referrerId: referrer.id,
        referredUserId: user.id,
        error: err.message,
      });
    }
  }

  // Generate and send OTP
  const otp = generateOTP();
  user.otpCode = await hashOTP(otp);
  user.otpExpires = getOTPExpiry();
  user.otpAttempts = 0;
  await user.save({ fields: ["otpCode", "otpExpires", "otpAttempts"] });

  // Send OTP email (optional - don't fail if email system is down)
  await sendEmailSafely(
    {
      to: user.email,
      ...otpEmail({ firstName: user.firstName, otp }),
    },
    "OTP registration"
  );

  await logSecurityEvent(
    "otp_sent",
    req,
    user.id,
    { action: "registration" },
    true
  );

  i18nResponse(req, res, 201, "auth.registered", {
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      isEmailVerified: false,
    },
    requiresOTP: true,
    referralAccepted: !!(referrer && referrer.id !== user.id),
  });
});

/**
 * @desc    Verify OTP code
 * @route   POST /api/auth/verify-otp
 * @access  Public
 */
const verifyOTPCode = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError(req.t("user.notFound"), 404);
  }

  if (user.isEmailVerified) {
    throw new AppError(req.t("auth.otpVerified"), 400);
  }

  if (!user.otpCode || !user.otpExpires) {
    throw new AppError(req.t("auth.otpInvalid"), 400);
  }

  if (isOTPExpired(user.otpExpires)) {
    throw new AppError(req.t("auth.otpExpired"), 400);
  }

  const isValid = await verifyOTP(otp, user.otpCode);
  if (!isValid) {
    const canRetry = await handleFailedOTP(user, req);
    if (!canRetry) {
      throw new AppError(req.t("auth.otpMaxAttempts"), 400);
    }
    throw new AppError(req.t("auth.otpInvalid"), 400);
  }

  // OTP is valid
  await handleSuccessfulOTP(user, req);

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  // Save refresh token
  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });

  // Send welcome email (optional - don't fail if email system is down)
  await sendEmailSafely(
    {
      to: user.email,
      ...welcomeEmail({ firstName: user.firstName, role: user.role }),
    },
    "Welcome"
  );

  // Trigger referral reward (best-effort, never blocks the response).
  // The configured trigger gate is read inside attemptReward — when the
  // platform setting `referral.requireEmailVerified` is true (default), the
  // bonus is applied here. The function is idempotent and a no-op if there
  // is no pending referral for this user.
  const requireVerified = await getSetting('referral.requireEmailVerified', true);
  if (requireVerified) {
    referralReward
      .attemptReward(user.id, { req })
      .catch((err) => logger.error('Referral reward failed', { error: err.message }));
  }

  i18nResponse(req, res, 200, "auth.otpVerified", {
    user: user.toPublicJSON(),
    accessToken,
    refreshToken,
  });
});

/**
 * @desc    Resend OTP code
 * @route   POST /api/auth/resend-otp
 * @access  Public
 */
const resendOTP = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal if user exists
    return i18nResponse(req, res, 200, "auth.otpSent");
  }

  if (user.isEmailVerified) {
    throw new AppError(req.t("auth.otpVerified"), 400);
  }

  // Generate new OTP
  const otp = generateOTP();
  user.otpCode = await hashOTP(otp);
  user.otpExpires = getOTPExpiry();
  user.otpAttempts = 0;
  await user.save({ fields: ["otpCode", "otpExpires", "otpAttempts"] });

  // Send OTP email (optional - don't fail if email system is down)
  await sendEmailSafely(
    {
      to: user.email,
      ...otpEmail({ firstName: user.firstName, otp }),
    },
    "OTP resend"
  );

  await logSecurityEvent("otp_sent", req, user.id, { action: "resend" }, true);

  i18nResponse(req, res, 200, "auth.otpSent");
});

/**
 * @desc    Login user
 * @route   POST /api/auth/login
 * @access  Public
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Find user by email
  const user = await User.findOne({ where: { email } });
  if (!user) {
    throw new AppError(req.t("auth.invalidCredentials"), 401);
  }

  // Check if account is active
  if (!user.isActive) {
    throw new AppError(req.t("common.forbidden"), 401);
  }

  // Check password
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    await handleFailedLogin(user, req);
    throw new AppError(req.t("auth.invalidCredentials"), 401);
  }

  // Check if email is verified
  if (!user.isEmailVerified) {
    // Generate new OTP for unverified users
    const otp = generateOTP();
    user.otpCode = await hashOTP(otp);
    user.otpExpires = getOTPExpiry();
    user.otpAttempts = 0;
    await user.save({ fields: ["otpCode", "otpExpires", "otpAttempts"] });

    // Send OTP email (optional - don't fail if email system is down)
    await sendEmailSafely(
      {
        to: user.email,
        ...otpEmail({ firstName: user.firstName, otp }),
      },
      "OTP login"
    );

    return i18nResponse(req, res, 200, "auth.emailNotVerified", {
      requiresOTP: true,
      email: user.email,
    });
  }

  // Login successful
  await handleSuccessfulLogin(user, req);

  // Audit Log
  auditLogger.userLoggedIn(req, user);

  // Generate tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  // Save refresh token
  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });

  // Get provider profile if exists
  let provider = null;
  if (user.role === "provider") {
    provider = await Provider.findOne({ where: { userId: user.id } });
  }

  i18nResponse(req, res, 200, "auth.loginSuccess", {
    user: user.toPublicJSON(),
    provider: provider
      ? {
        id: provider.id,
        businessName: provider.businessName,
        isVerified: provider.isVerified,
      }
      : null,
    accessToken,
    refreshToken,
  });
});

/**
 * @desc    Refresh access token
 * @route   POST /api/auth/refresh-token
 * @access  Public
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    throw new AppError(req.t("auth.refreshTokenInvalid"), 400);
  }

  // Find refresh token
  const tokenRecord = await RefreshToken.findOne({
    where: { token: refreshToken, isRevoked: false },
  });

  if (!tokenRecord) {
    throw new AppError(req.t("auth.refreshTokenInvalid"), 401);
  }

  // Check if expired
  if (new Date() > tokenRecord.expiresAt) {
    tokenRecord.isRevoked = true;
    tokenRecord.revokedAt = new Date();
    await tokenRecord.save();
    throw new AppError(req.t("auth.tokenExpired"), 401);
  }

  // Update last used
  tokenRecord.lastUsedAt = new Date();
  await tokenRecord.save({ fields: ["lastUsedAt"] });

  // Generate new access token
  const accessToken = generateAccessToken(tokenRecord.userId);

  await logSecurityEvent("token_refresh", req, tokenRecord.userId, {}, true);

  i18nResponse(req, res, 200, "auth.tokenRefreshed", { accessToken });
});

/**
 * @desc    Logout user
 * @route   POST /api/auth/logout
 * @access  Private
 */
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (refreshToken) {
    // Revoke specific refresh token
    await RefreshToken.update(
      { isRevoked: true, revokedAt: new Date() },
      { where: { token: refreshToken, userId: req.user.id } }
    );
  }

  await logSecurityEvent("logout", req, req.user.id, {}, true);

  // Audit Log
  auditLogger.userLoggedOut(req, req.user);

  i18nResponse(req, res, 200, "auth.logoutSuccess");
});

/**
 * @desc    Logout from all devices
 * @route   POST /api/auth/logout-all
 * @access  Private
 */
const logoutAll = asyncHandler(async (req, res) => {
  await RefreshToken.revokeAllForUser(req.user.id);

  await logSecurityEvent(
    "logout",
    req,
    req.user.id,
    { allDevices: true },
    true
  );

  i18nResponse(req, res, 200, "auth.logoutAllSuccess");
});

/**
 * @desc    Forgot password - send reset email
 * @route   POST /api/auth/forgot-password
 * @access  Public
 */
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  // Find user
  const user = await User.findOne({ where: { email } });
  if (!user) {
    // Don't reveal if email exists
    return i18nResponse(req, res, 200, "auth.passwordResetSent");
  }

  // Generate reset token
  const { resetToken, hashedToken } = generateResetToken();

  // Save hashed token to database
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save({ fields: ["resetPasswordToken", "resetPasswordExpires"] });

  // Create reset URL
  const resetUrl = `${getFrontendUrl(user.role)}/reset-password/${resetToken}`;

  await logSecurityEvent("password_reset_request", req, user.id, {}, true);

  // Audit Log
  auditLogger.passwordResetRequested(req, user);

  // Send email (optional - don't fail if email system is down)
  await sendEmailSafely(
    {
      to: user.email,
      ...passwordResetEmail({ firstName: user.firstName, resetUrl }),
    },
    "Password reset"
  );

  i18nResponse(req, res, 200, "auth.passwordResetSent");
});

/**
 * @desc    Reset password
 * @route   POST /api/auth/reset-password/:token
 * @access  Public
 */
const resetPassword = asyncHandler(async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  // Hash the token from URL
  const hashedToken = hashToken(token);

  // Find user with valid token
  const { Op } = require("sequelize");
  const user = await User.findOne({
    where: {
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { [Op.gt]: new Date() },
    },
  });

  if (!user) {
    throw new AppError(req.t("auth.tokenInvalid"), 400);
  }

  // Update password and clear token
  user.password = password;
  user.resetPasswordToken = null;
  user.resetPasswordExpires = null;
  await user.save();

  // Revoke all refresh tokens for security
  await RefreshToken.revokeAllForUser(user.id);

  await logSecurityEvent("password_reset_success", req, user.id, {}, true);

  // Audit Log
  auditLogger.passwordChanged(req, user);

  // Generate new tokens
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();

  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });

  i18nResponse(req, res, 200, "auth.passwordResetSuccess", {
    accessToken,
    refreshToken,
  });
});

/**
 * @desc    Get current logged in user
 * @route   GET /api/auth/me
 * @access  Private
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await User.findByPk(req.user.id, {
    attributes: {
      exclude: [
        "password",
        "resetPasswordToken",
        "resetPasswordExpires",
        "otpCode",
        "otpExpires",
      ],
    },
    include: [
      {
        model: Provider,
        as: "provider",
        required: false,
      },
    ],
  });

  if (!user) {
    throw new AppError(req.t("user.notFound"), 404);
  }

  i18nResponse(req, res, 200, "user.profile", {
    user: user.toPublicJSON(),
    provider: user.provider || null,
  });
});

module.exports = {
  register,
  verifyOTPCode,
  resendOTP,
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
};
