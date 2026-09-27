const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { User, Provider, RefreshToken, Referral } = require("../models");
const { asyncHandler, AppError } = require("../middlewares/errorHandler");
const { sendEmail } = require("../config/email");
const {
  welcomeEmail,
  passwordResetEmail,
} = require("../utils/emailTemplates");
const {
  generateResetToken,
  hashToken,
  i18nResponse,
  sendEmailSafely,
  getFrontendUrl,
} = require("../utils/helpers");
const logger = require("../utils/logger");
const referralReward = require("../services/referralReward");
const {
  handleFailedLogin,
  handleSuccessfulLogin,
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
    firstName,
    lastName,
    phone,
    country,
    gender,
    referralCode,
  } = req.body;

  // Password confirmation is now handled by the frontend only; the server no
  // longer requires a confirmPassword field.

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

  // Create the user. Email verification by one-time code has been removed
  // (client request): the account is usable immediately.
  const user = await User.create({
    email,
    password,
    firstName,
    lastName: lastName || "",
    phone,
    country: country || "Cameroun",
    gender,
    role: "client", // All users start as clients, can apply to become provider
    isEmailVerified: true,
  });

  // Record the referral and attempt the reward now. With OTP verification gone,
  // registration is the trigger point. Both steps are best-effort and never
  // block the signup.
  if (referrer && referrer.id !== user.id) {
    try {
      await Referral.create({
        referrerId: referrer.id,
        referredUserId: user.id,
        codeUsed: referrer.referralCode,
        status: "pending",
      });

      referralReward
        .attemptReward(user.id, { req })
        .catch((err) => logger.error("Referral reward failed", { error: err.message }));
    } catch (err) {
      logger.warn("Could not record referral", {
        referrerId: referrer.id,
        referredUserId: user.id,
        error: err.message,
      });
    }
  }

  // Log the user in immediately by issuing tokens.
  const accessToken = generateAccessToken(user.id);
  const refreshToken = generateRefreshToken();
  await RefreshToken.create({
    userId: user.id,
    token: refreshToken,
    expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    userAgent: req.get("user-agent"),
    ipAddress: req.ip,
  });

  // Welcome email (optional - don't fail if email system is down)
  await sendEmailSafely(
    {
      to: user.email,
      ...welcomeEmail({ firstName: user.firstName, role: user.role }),
    },
    "Welcome"
  );

  i18nResponse(req, res, 201, "auth.registered", {
    user: user.toPublicJSON(),
    accessToken,
    refreshToken,
    referralAccepted: !!(referrer && referrer.id !== user.id),
  });
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

  // Email verification by one-time code has been removed; accounts are usable
  // as soon as they are created, so there is no verification gate at login.

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
  login,
  refreshAccessToken,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  getMe,
};
