/**
 * Subscription Controller Unit Tests
 * Tests for subscription-related endpoints
 */

const {
  getPlans,
  getMySubscription,
  subscribe,
  activateSubscription,
  checkProviderStatus,
  sendExpirationReminders,
  processExpiredSubscriptions,
} = require("../../src/controllers/subscriptionController");

// Mock dependencies
jest.mock("../../src/models", () => ({
  Subscription: {
    getStatus: jest.fn(),
    renewSubscription: jest.fn(),
    getExpiringSoon: jest.fn(),
    expireOldSubscriptions: jest.fn(),
    markReminderSent: jest.fn(),
    findOne: jest.fn(),
    PLANS: {
      monthly: { price: 5000, days: 30 },
      quarterly: { price: 15000, days: 90 },
      yearly: { price: 25000, days: 365 },
    },
  },
  Provider: {
    findOne: jest.fn(),
    update: jest.fn(),
  },
  User: {
    findByPk: jest.fn(),
  },
  Payment: {
    create: jest.fn(),
  },
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

jest.mock("../../src/utils/dbHelpers", () => ({
  withTransaction: (cb) => cb({}),
}));

jest.mock("../../src/utils/helpers", () => ({
  i18nResponse: jest.fn(),
  sendEmailSafely: jest.fn(),
  getFrontendUrl: jest.fn(() => "http://localhost:5173"),
}));

jest.mock("../../src/config/email", () => ({
  sendEmail: jest.fn(),
}));

jest.mock("../../src/utils/emailTemplates", () => ({
  subscriptionExpiringEmail: jest.fn(),
}));

jest.mock("../../src/utils/paymentGateway", () => ({
  initializeCinetPayPayment: jest.fn(),
  initializeNotchPayPayment: jest.fn(),
}));

const { Subscription, Provider, Payment } = require("../../src/models");
const { i18nResponse, sendEmailSafely } = require("../../src/utils/helpers");
const { sendEmail } = require("../../src/config/email");
const {
  initializeCinetPayPayment,
  initializeNotchPayPayment,
} = require("../../src/utils/paymentGateway");

describe("Subscription Controller", () => {
  let mockReq, mockRes, mockNext;

  beforeEach(() => {
    jest.clearAllMocks();

    mockReq = {
      body: {},
      params: {},
      user: { id: "user-123" },
      t: jest.fn((key) => key),
    };

    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockNext = jest.fn();

    // Setup default mocks
    i18nResponse.mockImplementation(() => {});
    sendEmailSafely.mockImplementation((emailData) => sendEmail(emailData));
    sendEmail.mockResolvedValue({});
  });

  describe("getPlans", () => {
    it("should return subscription plans successfully", async () => {
      await getPlans(mockReq, mockRes, mockNext);

      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "subscription.plans",
        expect.any(Object),
      );
    });
  });

  describe("getMySubscription", () => {
    it("should get my subscription status successfully", async () => {
      const mockProvider = { id: "provider-123", userId: "user-123" };
      const mockStatus = {
        isActive: true,
        plan: "monthly",
        endDate: "2024-12-31",
      };

      Provider.findOne.mockResolvedValue(mockProvider);
      Subscription.getStatus.mockResolvedValue(mockStatus);

      await getMySubscription(mockReq, mockRes, mockNext);

      expect(Provider.findOne).toHaveBeenCalledWith({
        where: { userId: "user-123" },
      });
      expect(Subscription.getStatus).toHaveBeenCalledWith("provider-123");
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "subscription.status",
        {
          subscription: mockStatus,
          plans: Subscription.PLANS,
        },
      );
    });

    it("should throw error if provider not found", async () => {
      Provider.findOne.mockResolvedValue(null);

      await expect(
        getMySubscription(mockReq, mockRes, mockNext),
      ).rejects.toThrow("subscription.providerRequired");
    });
  });

  describe("subscribe", () => {
    it("should subscribe to plan successfully", async () => {
      mockReq.body = { plan: "monthly" };

      const mockProvider = { id: "provider-123", userId: "user-123" };
      const mockPayment = {
        id: "payment-123",
        transactionId: "txn-123",
        amount: 5000,
        description: "Test",
        save: jest.fn().mockResolvedValue(),
      };

      Provider.findOne.mockResolvedValue(mockProvider);
      Subscription.findOne.mockResolvedValue(null);
      Payment.create.mockResolvedValue(mockPayment);

      initializeCinetPayPayment.mockResolvedValue({
        code: "201",
        data: {
          payment_token: "token-123",
          payment_url: "http://cinetpay.com/pay",
        },
      });

      await subscribe(mockReq, mockRes, mockNext);

      expect(Provider.findOne).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: expect.any(Array),
      });
      expect(Payment.create).toHaveBeenCalledWith({
        userId: "user-123",
        providerId: "provider-123",
        amount: 5000,
        currency: "XAF",
        type: "subscription",
        description: "Abonnement monthly - 30 jours",
        status: "PENDING",
        transactionId: expect.any(String),
        metadata: { plan: "monthly" },
      });
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        201,
        "subscription.paymentInitiated",
        expect.any(Object),
      );
    });

    it("should subscribe to plan successfully using NotchPay", async () => {
      mockReq.body = { plan: "monthly", gateway: "notchpay" };

      const mockProvider = {
        id: "provider-123",
        userId: "user-123",
        user: { email: "test@example.com" },
      };
      const mockPayment = {
        id: "payment-123",
        transactionId: "txn-123",
        amount: 5000,
        description: "Test",
        save: jest.fn().mockResolvedValue(),
      };

      Provider.findOne.mockResolvedValue(mockProvider);
      Subscription.findOne.mockResolvedValue(null);
      Payment.create.mockResolvedValue(mockPayment);

      initializeNotchPayPayment.mockResolvedValue({
        status: "Accepted",
        authorization_url: "http://notchpay.co/pay",
      });

      await subscribe(mockReq, mockRes, mockNext);

      expect(Provider.findOne).toHaveBeenCalledWith({
        where: { userId: "user-123" },
        include: expect.any(Array),
      });
      expect(Payment.create).toHaveBeenCalledWith({
        userId: "user-123",
        providerId: "provider-123",
        amount: 5000,
        currency: "XAF",
        type: "subscription",
        description: "Abonnement monthly - 30 jours",
        status: "PENDING",
        transactionId: expect.any(String),
        metadata: { plan: "monthly" },
      });
      expect(initializeNotchPayPayment).toHaveBeenCalled();
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        201,
        "subscription.paymentInitiated",
        expect.objectContaining({ gateway: "NotchPay" }),
      );
    });

    it("should throw error for invalid plan", async () => {
      mockReq.body = { plan: "invalid" };

      await expect(subscribe(mockReq, mockRes, mockNext)).rejects.toThrow(
        "subscription.invalidPlan",
      );
    });

    it("should throw error if provider not found", async () => {
      mockReq.body = { plan: "monthly" };

      Provider.findOne.mockResolvedValue(null);

      await expect(subscribe(mockReq, mockRes, mockNext)).rejects.toThrow(
        "subscription.providerRequired",
      );
    });
  });

  describe("activateSubscription", () => {
    it("should activate subscription successfully", async () => {
      const mockPayment = {
        type: "subscription",
        providerId: "provider-123",
        metadata: { plan: "monthly" },
      };

      Subscription.renewSubscription.mockResolvedValue();
      Provider.update.mockResolvedValue([1]);

      await activateSubscription(mockPayment);

      expect(Subscription.renewSubscription).toHaveBeenCalledWith(
        "provider-123",
        "monthly",
        undefined,
        expect.objectContaining({ transaction: expect.anything() }),
      );
      expect(Provider.update).toHaveBeenCalledWith(
        { isVisible: true },
        expect.objectContaining({ where: { id: "provider-123" } }),
      );
    });

    it("should skip if payment type is not subscription", async () => {
      const mockPayment = {
        type: "boost",
        providerId: "provider-123",
      };

      await activateSubscription(mockPayment);

      expect(Subscription.renewSubscription).not.toHaveBeenCalled();
    });
  });

  describe("checkProviderStatus", () => {
    it("should check provider subscription status successfully", async () => {
      mockReq.params = { providerId: "provider-123" };

      const mockStatus = { isActive: true, plan: "monthly" };

      Subscription.getStatus.mockResolvedValue(mockStatus);

      await checkProviderStatus(mockReq, mockRes, mockNext);

      expect(Subscription.getStatus).toHaveBeenCalledWith("provider-123");
      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "subscription.providerStatus",
        {
          isActive: true,
          canContact: true,
          showImages: true,
        },
      );
    });

    it("should return false for inactive subscription", async () => {
      mockReq.params = { providerId: "provider-123" };

      const mockStatus = { isActive: false };

      Subscription.getStatus.mockResolvedValue(mockStatus);

      await checkProviderStatus(mockReq, mockRes, mockNext);

      expect(i18nResponse).toHaveBeenCalledWith(
        mockReq,
        mockRes,
        200,
        "subscription.providerStatus",
        {
          isActive: false,
          canContact: false,
          showImages: false,
        },
      );
    });
  });

  describe("sendExpirationReminders", () => {
    it("should send expiration reminders successfully", async () => {
      const mockExpiringSubs = [
        {
          id: "sub-1",
          endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days from now
          provider: {
            user: {
              email: "provider@example.com",
              firstName: "John",
            },
            businessName: "Test Provider",
          },
        },
      ];

      Subscription.getExpiringSoon.mockResolvedValue(mockExpiringSubs);
      Subscription.markReminderSent.mockResolvedValue();

      const result = await sendExpirationReminders();

      expect(Subscription.getExpiringSoon).toHaveBeenCalled();
      expect(sendEmail).toHaveBeenCalled();
      expect(Subscription.markReminderSent).toHaveBeenCalledWith("sub-1");
      expect(result).toBe(1);
    });

    it("should return 0 if no reminders to send", async () => {
      Subscription.getExpiringSoon.mockResolvedValue([]);

      const result = await sendExpirationReminders();

      expect(result).toBe(0);
      expect(sendEmail).not.toHaveBeenCalled();
    });
  });

  describe("processExpiredSubscriptions", () => {
    it("should process expired subscriptions successfully", async () => {
      Subscription.expireOldSubscriptions.mockResolvedValue(5);

      const result = await processExpiredSubscriptions();

      expect(Subscription.expireOldSubscriptions).toHaveBeenCalled();
      expect(result).toBe(5);
    });
  });
});
