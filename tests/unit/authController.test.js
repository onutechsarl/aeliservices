/**
 * Auth Controller Unit Tests
 * Tests for authentication endpoints
 */

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
  getMe,
} = require("../../src/controllers/authController");

// Mock dependencies
jest.mock("../../src/models", () => ({
  User: {
    findOne: jest.fn(),
    findByPk: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  Provider: {
    findOne: jest.fn(),
  },
  RefreshToken: {
    findOne: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    revokeAllForUser: jest.fn(),
  },
  Referral: {
    create: jest.fn(),
  },
}));

jest.mock("jsonwebtoken");
jest.mock("crypto", () => ({
  randomBytes: jest.fn(),
}));

jest.mock("../../src/middlewares/errorHandler", () => ({
  asyncHandler: (fn) => (req, res, next) => fn(req, res, next),
  AppError: class extends Error {
    constructor(message, statusCode) {
      super(message);
      this.statusCode = statusCode;
    }
  },
}));

jest.mock("../../src/config/email", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../../src/utils/emailTemplates", () => ({
  welcomeEmail: jest.fn(),
  passwordResetEmail: jest.fn(),
  otpEmail: jest.fn(),
}));

jest.mock("../../src/utils/helpers", () => ({
  generateResetToken: jest.fn(),
  hashToken: jest.fn(),
  i18nResponse: jest.fn(),
  successResponse: jest.fn(),
  sendEmailSafely: jest.fn(),
  getFrontendUrl: jest.fn(() => "http://localhost:5173"),
}));

jest.mock("../../src/utils/otp", () => ({
  generateOTP: jest.fn(),
  hashOTP: jest.fn(),
  verifyOTP: jest.fn(),
  getOTPExpiry: jest.fn(),
  isOTPExpired: jest.fn(),
}));

jest.mock("../../src/middlewares/security", () => ({
  handleFailedLogin: jest.fn(),
  handleSuccessfulLogin: jest.fn(),
  handleFailedOTP: jest.fn(),
  handleSuccessfulOTP: jest.fn(),
  logSecurityEvent: jest.fn(),
}));

jest.mock("../../src/middlewares/audit", () => ({
  auditLogger: {
    userLoggedIn: jest.fn(),
    userLoggedOut: jest.fn(),
    passwordResetRequested: jest.fn(),
    passwordChanged: jest.fn(),
  },
}));

const { User, Provider, RefreshToken } = require("../../src/models");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { i18nResponse } = require("../../src/utils/helpers");
const {
  generateOTP,
  hashOTP,
  verifyOTP,
  getOTPExpiry,
  isOTPExpired,
} = require("../../src/utils/otp");
const {
  handleFailedLogin,
  handleSuccessfulLogin,
  handleFailedOTP,
  handleSuccessfulOTP,
  logSecurityEvent,
} = require("../../src/middlewares/security");
const { auditLogger } = require("../../src/middlewares/audit");
const helpers = require("../../src/utils/helpers");

describe("Auth Controller", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      params: {},
      user: { id: "user-123" },
      t: jest.fn((key) => key),
      ip: "127.0.0.1",
      get: jest.fn(),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Setup default mocks
    jwt.sign.mockReturnValue("access-token");
    crypto.randomBytes.mockReturnValue(Buffer.from("refresh-token"));
    generateOTP.mockReturnValue("123456");
    hashOTP.mockResolvedValue("hashed-otp");
    getOTPExpiry.mockReturnValue(new Date(Date.now() + 10 * 60 * 1000));
    isOTPExpired.mockReturnValue(false);
    verifyOTP.mockResolvedValue(true);
    i18nResponse.mockImplementation(() => { });
    handleSuccessfulOTP.mockResolvedValue();
    handleFailedOTP.mockResolvedValue(true);
    logSecurityEvent.mockResolvedValue();
  });

  describe("register", () => {
    it("should register a new user successfully", async () => {
      const userData = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
        firstName: "John",
        lastName: "Doe",
        phone: "+237699123456",
        country: "Cameroun",
        gender: "male",
      };
      mockReq.body = userData;

      const mockUser = {
        id: "user-123",
        email: userData.email,
        firstName: userData.firstName,
        role: "client",
        save: jest.fn().mockResolvedValue(),
      };

      User.findOne.mockResolvedValue(null);
      User.create.mockResolvedValue(mockUser);

      await register(mockReq, mockRes, mockNext);

      expect(User.findOne).toHaveBeenCalledWith({
        where: { email: userData.email },
      });
      expect(User.create).toHaveBeenCalledWith({
        email: userData.email,
        password: userData.password,
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone,
        country: "Cameroun",
        gender: "male",
        role: "client",
        isEmailVerified: false,
      });
      expect(mockUser.save).toHaveBeenCalledWith({
        fields: ["otpCode", "otpExpires", "otpAttempts"],
      });
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        201,
        "auth.registered",
        expect.objectContaining({
          user: expect.objectContaining({
            id: mockUser.id,
            email: mockUser.email,
            firstName: mockUser.firstName,
            role: "client",
            isEmailVerified: false,
          }),
          requiresOTP: true,
        })
      );
    });

    it("should throw error if passwords do not match", async () => {
      mockReq.body = {
        email: "test@example.com",
        password: "password123",
        confirmPassword: "different123",
      };

      await expect(register(mockReq, mockRes, mockNext)).rejects.toThrow(
        "validation.passwordMismatch"
      );
    });

    it("should throw error if user already exists", async () => {
      mockReq.body = {
        email: "existing@example.com",
        password: "password123",
        confirmPassword: "password123",
      };

      User.findOne.mockResolvedValue({ id: "existing-user" });

      await expect(register(mockReq, mockRes, mockNext)).rejects.toThrow(
        "validation.emailInUse"
      );
    });

    it("should register and record a pending referral when a valid referralCode is provided", async () => {
      const { Referral } = require("../../src/models");
      mockReq.body = {
        email: "newbie@example.com",
        password: "password123",
        confirmPassword: "password123",
        firstName: "Newbie",
        lastName: "User",
        referralCode: "aeli-abc123", // lowercased input — must be normalized
      };

      // 1st findOne (email lookup) returns null, 2nd findOne (referrer) returns a user
      User.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "referrer-1", referralCode: "AELI-ABC123" });

      const mockUser = {
        id: "user-456",
        email: "newbie@example.com",
        firstName: "Newbie",
        role: "client",
        save: jest.fn().mockResolvedValue(),
      };
      User.create.mockResolvedValue(mockUser);
      Referral.create.mockResolvedValue();

      await register(mockReq, mockRes, mockNext);

      // Second findOne was the referrer lookup with normalized code + isActive guard
      expect(User.findOne.mock.calls[1][0]).toMatchObject({
        where: { referralCode: "AELI-ABC123", isActive: true },
      });
      expect(Referral.create).toHaveBeenCalledWith({
        referrerId: "referrer-1",
        referredUserId: "user-456",
        codeUsed: "AELI-ABC123",
        status: "pending",
      });
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        201,
        "auth.registered",
        expect.objectContaining({ referralAccepted: true })
      );
    });

    it("should still register when the referralCode is unknown", async () => {
      const { Referral } = require("../../src/models");
      mockReq.body = {
        email: "newbie@example.com",
        password: "password123",
        confirmPassword: "password123",
        firstName: "Newbie",
        lastName: "User",
        referralCode: "AELI-NOPE99",
      };

      // 1st (email) → null, 2nd (referrer) → null
      User.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const mockUser = {
        id: "user-789",
        email: "newbie@example.com",
        firstName: "Newbie",
        role: "client",
        save: jest.fn().mockResolvedValue(),
      };
      User.create.mockResolvedValue(mockUser);

      await register(mockReq, mockRes, mockNext);

      expect(Referral.create).not.toHaveBeenCalled();
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        201,
        "auth.registered",
        expect.objectContaining({ referralAccepted: false })
      );
    });

    it("should not block registration when the Referral insert fails", async () => {
      const { Referral } = require("../../src/models");
      mockReq.body = {
        email: "newbie@example.com",
        password: "password123",
        confirmPassword: "password123",
        firstName: "Newbie",
        lastName: "User",
        referralCode: "AELI-OK1234",
      };

      User.findOne
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "referrer-2", referralCode: "AELI-OK1234" });

      const mockUser = {
        id: "user-999",
        email: "newbie@example.com",
        firstName: "Newbie",
        role: "client",
        save: jest.fn().mockResolvedValue(),
      };
      User.create.mockResolvedValue(mockUser);
      Referral.create.mockRejectedValue(new Error("unique constraint"));

      await register(mockReq, mockRes, mockNext);

      // Registration completed despite Referral failure
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        201,
        "auth.registered",
        expect.any(Object)
      );
    });
  });

  describe("verifyOTPCode", () => {
    it("should verify OTP successfully", async () => {
      mockReq.body = { email: "test@example.com", otp: "123456" };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        otpCode: "hashed-otp",
        otpExpires: new Date(Date.now() + 10 * 60 * 1000),
        isEmailVerified: false,
        toPublicJSON: jest.fn().mockReturnValue({ id: "user-123" }),
      };

      User.findOne.mockResolvedValue(mockUser);
      RefreshToken.create.mockResolvedValue();

      await verifyOTPCode(mockReq, mockRes, mockNext);

      expect(handleSuccessfulOTP).toHaveBeenCalledWith(mockUser, mockReq);
      expect(RefreshToken.create).toHaveBeenCalled();
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "auth.otpVerified",
        expect.any(Object)
      );
    });

    it("should throw error if user not found", async () => {
      mockReq.body = { email: "nonexistent@example.com", otp: "123456" };

      User.findOne.mockResolvedValue(null);

      await expect(verifyOTPCode(mockReq, mockRes, mockNext)).rejects.toThrow(
        "user.notFound"
      );
    });

    it("should throw error if user already verified", async () => {
      mockReq.body = { email: "verified@example.com", otp: "123456" };

      const mockUser = {
        isEmailVerified: true,
      };

      User.findOne.mockResolvedValue(mockUser);

      await expect(verifyOTPCode(mockReq, mockRes, mockNext)).rejects.toThrow(
        "auth.otpVerified"
      );
    });
  });

  describe("login", () => {
    it("should login verified user successfully", async () => {
      mockReq.body = { email: "test@example.com", password: "password123" };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        role: "client",
        isActive: true,
        isEmailVerified: true,
        comparePassword: jest.fn().mockResolvedValue(true),
        toPublicJSON: jest.fn().mockReturnValue({ id: "user-123" }),
      };

      User.findOne.mockResolvedValue(mockUser);
      RefreshToken.create.mockResolvedValue();

      await login(mockReq, mockRes, mockNext);

      expect(handleSuccessfulLogin).toHaveBeenCalledWith(mockUser, mockReq);
      expect(auditLogger.userLoggedIn).toHaveBeenCalledWith(mockReq, mockUser);
      expect(RefreshToken.create).toHaveBeenCalled();
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "auth.loginSuccess",
        expect.any(Object)
      );
    });

    it("should handle unverified user login", async () => {
      mockReq.body = {
        email: "unverified@example.com",
        password: "password123",
      };

      const mockUser = {
        id: "user-123",
        email: "unverified@example.com",
        firstName: "John",
        isActive: true,
        isEmailVerified: false,
        comparePassword: jest.fn().mockResolvedValue(true),
        save: jest.fn().mockResolvedValue(),
      };

      User.findOne.mockResolvedValue(mockUser);

      await login(mockReq, mockRes, mockNext);

      expect(mockUser.save).toHaveBeenCalledWith({
        fields: ["otpCode", "otpExpires", "otpAttempts"],
      });
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "auth.emailNotVerified",
        {
          requiresOTP: true,
          email: mockUser.email,
        }
      );
    });

    it("should throw error for invalid credentials", async () => {
      mockReq.body = { email: "test@example.com", password: "wrongpassword" };

      const mockUser = {
        id: "user-123",
        isActive: true,
        comparePassword: jest.fn().mockResolvedValue(false),
      };

      User.findOne.mockResolvedValue(mockUser);
      handleFailedLogin.mockResolvedValue();

      await expect(login(mockReq, mockRes, mockNext)).rejects.toThrow(
        "auth.invalidCredentials"
      );
      expect(handleFailedLogin).toHaveBeenCalledWith(mockUser, mockReq);
    });
  });

  describe("refreshAccessToken", () => {
    it("should refresh access token successfully", async () => {
      mockReq.body = { refreshToken: "valid-refresh-token" };

      const mockTokenRecord = {
        userId: "user-123",
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        save: jest.fn().mockResolvedValue(),
      };

      RefreshToken.findOne.mockResolvedValue(mockTokenRecord);

      await refreshAccessToken(mockReq, mockRes, mockNext);

      expect(RefreshToken.findOne).toHaveBeenCalledWith({
        where: { token: "valid-refresh-token", isRevoked: false },
      });
      expect(jwt.sign).toHaveBeenCalledWith(
        { id: "user-123", type: "access" },
        process.env.JWT_SECRET,
        { expiresIn: expect.any(String) }
      );
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "auth.tokenRefreshed",
        { accessToken: "access-token" }
      );
    });

    it("should throw error for invalid refresh token", async () => {
      mockReq.body = { refreshToken: "invalid-token" };

      RefreshToken.findOne.mockResolvedValue(null);

      await expect(
        refreshAccessToken(mockReq, mockRes, mockNext)
      ).rejects.toThrow("auth.refreshTokenInvalid");
    });
  });

  describe("forgotPassword", () => {
    it("should send reset email for existing user", async () => {
      mockReq.body = { email: "test@example.com" };

      const mockUser = {
        id: "user-123",
        email: "test@example.com",
        firstName: "John",
        save: jest.fn().mockResolvedValue(),
      };

      User.findOne.mockResolvedValue(mockUser);
      helpers.generateResetToken.mockReturnValue({
        resetToken: "reset-token",
        hashedToken: "hashed-token",
      });

      await forgotPassword(mockReq, mockRes, mockNext);

      expect(mockUser.save).toHaveBeenCalledWith({
        fields: ["resetPasswordToken", "resetPasswordExpires"],
      });
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "auth.passwordResetSent"
      );
    });

    it("should not reveal if user does not exist", async () => {
      mockReq.body = { email: "nonexistent@example.com" };

      User.findOne.mockResolvedValue(null);

      await forgotPassword(mockReq, mockRes, mockNext);

      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "auth.passwordResetSent"
      );
    });
  });

  describe("resetPassword", () => {
    it("should reset password successfully", async () => {
      mockReq.params = { token: "reset-token" };
      mockReq.body = { password: "newpassword123" };

      const mockUser = {
        id: "user-123",
        save: jest.fn().mockResolvedValue(),
      };

      User.findOne.mockResolvedValue(mockUser);
      RefreshToken.revokeAllForUser.mockResolvedValue();
      RefreshToken.create.mockResolvedValue();

      await resetPassword(mockReq, mockRes, mockNext);

      expect(mockUser.save).toHaveBeenCalled();
      expect(RefreshToken.revokeAllForUser).toHaveBeenCalledWith("user-123");
      expect(RefreshToken.create).toHaveBeenCalled();
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "auth.passwordResetSuccess",
        expect.any(Object)
      );
    });

    it("should throw error for invalid token", async () => {
      mockReq.params = { token: "invalid-token" };

      User.findOne.mockResolvedValue(null);

      await expect(resetPassword(mockReq, mockRes, mockNext)).rejects.toThrow(
        "auth.tokenInvalid"
      );
    });
  });

  describe("getMe", () => {
    it("should return current user profile", async () => {
      const mockUser = {
        id: "user-123",
        toPublicJSON: jest.fn().mockReturnValue({ id: "user-123" }),
        provider: null,
      };

      User.findByPk.mockResolvedValue(mockUser);

      await getMe(mockReq, mockRes, mockNext);

      expect(User.findByPk).toHaveBeenCalledWith(
        "user-123",
        expect.any(Object)
      );
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "user.profile",
        {
          user: { id: "user-123" },
          provider: null,
        }
      );
    });

    it("should throw error if user not found", async () => {
      User.findByPk.mockResolvedValue(null);

      await expect(getMe(mockReq, mockRes, mockNext)).rejects.toThrow(
        "user.notFound"
      );
    });
  });
});
