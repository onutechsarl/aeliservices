const axios = require("axios");
const crypto = require("crypto");
const Payment = require("../models/Payment");
const { sequelize, User, Provider } = require("../models");
const {
  CINETPAY_CONFIG,
  PAYMENT_STATUS,
  CINETPAY_CODES,
} = require("../config/cinetpay");
const { NOTCH_PAY_CONFIG, NOTCH_PAY_STATUS } = require("../config/notchpay");
const { asyncHandler, AppError } = require("../middlewares/errorHandler");
const { Subscription } = require("../models");
const {
  i18nResponse,
  getPaginationParams,
  getPaginationData,
  sendEmailSafely,
  getFrontendUrl,
} = require("../utils/helpers");
const logger = require("../utils/logger");
const { auditLogger } = require("../middlewares/audit");
const {
  paymentSuccessEmail,
  paymentFailedEmail,
} = require("../utils/emailTemplates");
const {
  initializeCinetPayPayment,
  initializeNotchPayPayment: initNotchPay,
} = require("../utils/paymentGateway");

/**
 * Initialize a payment with CinetPay
 * POST /api/payments/initialize
 */
const initializePayment = asyncHandler(async (req, res) => {
  const { amount, type, providerId, description } = req.body;
  const userId = req.user?.id;

  // Validate amount (must be multiple of 5)
  if (!amount || amount < 100 || amount % 5 !== 0) {
    throw new AppError(req.t("common.badRequest"), 400);
  }

  // Validate type
  const validTypes = ["contact_premium", "featured", "boost", "subscription"];
  if (!validTypes.includes(type)) {
    throw new AppError(req.t("common.badRequest"), 400);
  }

  // Check if subscription already active (cannot buy if active/trial is not expired)
  if (type === "subscription" && providerId) {
    const activeSub = await Subscription.findOne({
      where: { providerId },
    });

    if (activeSub && activeSub.isActive()) {
      throw new AppError(req.t("subscription.alreadyActive"), 400);
    }
  }

  // Get user info for card payments
  let user = null;
  if (userId) {
    user = await User.findByPk(userId);
  }

  // Generate unique transaction ID
  const transactionId = Payment.generateTransactionId();

  // Create payment record
  const payment = await Payment.create({
    transactionId,
    userId,
    providerId,
    type,
    amount,
    currency: CINETPAY_CONFIG.currency,
    status: "PENDING",
    description: description || `Paiement ${type} AELI Services`,
    metadata: { type, providerId },
  });

  // Prepare CinetPay request
  const cinetpayData = {
    apikey: CINETPAY_CONFIG.apiKey,
    site_id: CINETPAY_CONFIG.siteId,
    transaction_id: transactionId,
    amount: amount,
    currency: CINETPAY_CONFIG.currency,
    description: payment.description,
    notify_url: CINETPAY_CONFIG.notifyUrl,
    return_url: `${CINETPAY_CONFIG.returnUrl}?transaction_id=${transactionId}`,
    channels: CINETPAY_CONFIG.channels,
    lang: CINETPAY_CONFIG.lang,
    metadata: JSON.stringify({ paymentId: payment.id, type, userId }),
  };

  // Add customer info for card payments
  if (user) {
    cinetpayData.customer_id = user.id;
    cinetpayData.customer_name = user.lastName || "Client";
    cinetpayData.customer_surname = user.firstName || "AELI";
    cinetpayData.customer_email = user.email;
    cinetpayData.customer_phone_number = user.phone || "";
    cinetpayData.customer_address = "Cameroun";
    cinetpayData.customer_city = "Douala";
    cinetpayData.customer_country = "CM";
    cinetpayData.customer_state = "CM";
    cinetpayData.customer_zip_code = "00237";
  }

  try {
    // Call CinetPay API
    const response = await axios.post(
      CINETPAY_CONFIG.paymentUrl,
      cinetpayData,
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    const cinetpayResponse = response.data;

    if (cinetpayResponse.code === "201") {
      // Update payment with token and URL
      payment.paymentToken = cinetpayResponse.data.payment_token;
      payment.paymentUrl = cinetpayResponse.data.payment_url;
      await payment.save();

      logger.info(`Payment initialized: ${transactionId}`);

      i18nResponse(req, res, 201, "payment.initialized", {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        paymentUrl: payment.paymentUrl,
        amount: payment.amount,
        currency: payment.currency,
      });
    } else {
      // Handle error
      payment.status = "REFUSED";
      payment.errorMessage = cinetpayResponse.message;
      await payment.save();

      throw new AppError(req.t("payment.failed"), 400);
    }
  } catch (error) {
    if (error.response) {
      logger.error("CinetPay API error:", error.response.data);
      payment.errorMessage = JSON.stringify(error.response.data);
      await payment.save();
    }
    throw error;
  }
});

/**
 * Initialize a payment with NotchPay
 * POST /api/payments/notchpay/initialize
 */
const initializeNotchPayPayment = asyncHandler(async (req, res, next) => {
  const { amount, type, providerId, description } = req.body;
  const userId = req.user?.id;

  // Validate amount
  if (!amount || amount < 100) {
    throw new AppError(req.t("common.badRequest"), 400);
  }

  // Validate type
  const validTypes = [
    "contact_premium",
    "featured",
    "boost",
    "subscription",
    "contact_unlock",
  ];
  if (!validTypes.includes(type)) {
    throw new AppError(req.t("common.badRequest"), 400);
  }

  // Check if subscription already active (cannot buy if active/trial is not expired)
  if (type === "subscription" && providerId) {
    const activeSub = await Subscription.findOne({
      where: { providerId },
    });

    if (activeSub && activeSub.isActive()) {
      throw new AppError(req.t("subscription.alreadyActive"), 400);
    }
  }

  // Get user info
  let user = null;
  if (userId) {
    user = await User.findByPk(userId);
  }

  // Generate unique transaction ID (reference)
  const transactionId = Payment.generateTransactionId();

  // Create payment record
  const payment = await Payment.create({
    transactionId,
    userId,
    providerId,
    type,
    amount,
    currency: NOTCH_PAY_CONFIG.currency,
    status: "PENDING",
    gateway: "NotchPay",
    description: description || `Paiement ${type} AELI Services (NotchPay)`,
    metadata: { type, providerId },
  });

  // Prepare NotchPay request
  const notchPayData = {
    amount: amount,
    currency: NOTCH_PAY_CONFIG.currency,
    description: payment.description,
    reference: transactionId,
    callback: NOTCH_PAY_CONFIG.callbackUrl,
    customer: {
      name: user ? `${user.firstName} ${user.lastName}` : "Client AELI",
      email: user?.email,
      phone: user?.phone,
    },
  };

  try {
    const notchpayResponse = await initNotchPay({
      email: user?.email || "test@aeli.com",
      amount: amount,
      currency: payment.currency,
      description: payment.description,
      reference: transactionId,
      callback: NOTCH_PAY_CONFIG.callbackUrl,
    });

    if (
      notchpayResponse.status === "Accepted" ||
      notchpayResponse.authorization_url
    ) {
      // Update payment with URL
      payment.paymentUrl = notchpayResponse.authorization_url;
      await payment.save();

      logger.info(`NotchPay payment initialized: ${transactionId}`);

      i18nResponse(req, res, 201, "payment.initialized", {
        paymentId: payment.id,
        transactionId: payment.transactionId,
        paymentUrl: payment.paymentUrl,
        amount: payment.amount,
        currency: payment.currency,
      });
    } else {
      payment.status = "REFUSED";
      payment.errorMessage = notchpayResponse.message;
      await payment.save();

      throw new AppError(req.t("payment.failed"), 400);
    }
  } catch (error) {
    next(error);
  }
});

/**
 * CinetPay webhook handler
 * POST /api/payments/webhook
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const {
    cpm_trans_id,
    cpm_site_id,
    cpm_amount,
    cpm_currency,
    cpm_error_message,
  } = req.body;

  logger.info(`Webhook received for transaction: ${cpm_trans_id}`);

  // Verify site_id
  if (cpm_site_id !== CINETPAY_CONFIG.siteId) {
    logger.warn(`Invalid site_id in webhook: ${cpm_site_id}`);
    return res.status(400).send("Invalid site_id");
  }

  // Find payment
  const payment = await Payment.findByTransactionId(cpm_trans_id);
  if (!payment) {
    logger.warn(`Payment not found for transaction: ${cpm_trans_id}`);
    return res.status(404).send("Payment not found");
  }

  // If already processed, skip
  if (payment.status === "ACCEPTED" || payment.status === "REFUSED") {
    logger.info(`Payment ${cpm_trans_id} already processed`);
    return res.status(200).send("OK");
  }

  // Verify transaction with CinetPay API
  try {
    const verifyResponse = await axios.post(
      CINETPAY_CONFIG.checkUrl,
      {
        apikey: CINETPAY_CONFIG.apiKey,
        site_id: CINETPAY_CONFIG.siteId,
        transaction_id: cpm_trans_id,
      },
      {
        headers: { "Content-Type": "application/json" },
      },
    );

    const verifyData = verifyResponse.data;

    if (verifyData.code === "00" && verifyData.data.status === "ACCEPTED") {
      // Payment successful
      await payment.updateFromCinetPay(verifyData.data);

      // Process business logic based on payment type
      await processPaymentSuccess(payment);

      logger.info(`Payment ${cpm_trans_id} verified and accepted`);
    } else if (verifyData.data.status === "REFUSED") {
      // Payment failed
      payment.status = "REFUSED";
      payment.errorMessage = cpm_error_message || verifyData.message;
      await payment.save();

      logger.info(`Payment ${cpm_trans_id} refused`);
    } else {
      // Still pending (WAITING_CUSTOMER)
      payment.status = "WAITING_CUSTOMER";
      await payment.save();
    }
  } catch (error) {
    logger.error(`Error verifying payment ${cpm_trans_id}:`, error.message);
  }

  // Always return 200 to CinetPay
  res.status(200).send("OK");
});

/**
 * Constant-time comparison of a received signature against the expected HMAC.
 * Returns false on any length mismatch or malformed input instead of throwing.
 */
const signatureMatches = (expectedHex, receivedHex) => {
  if (typeof receivedHex !== "string" || !receivedHex) return false;
  const expected = Buffer.from(expectedHex, "hex");
  let received;
  try {
    received = Buffer.from(receivedHex, "hex");
  } catch (e) {
    return false;
  }
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
};

/**
 * NotchPay webhook handler (server-to-server, state-changing)
 * POST /api/payments/notchpay/webhook
 *
 * The signature is MANDATORY. A missing header, an unconfigured secret, or a
 * mismatch all reject the request. This is the only entry point allowed to
 * move a payment to ACCEPTED/REFUSED; the browser callback (GET) is read-only.
 */
const handleNotchPayWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers["x-notch-signature"];

  // Only a signed JSON body is accepted here. Query-parameter payloads cannot
  // be signed and must not reach this state-changing path.
  if (!req.body || Object.keys(req.body).length === 0) {
    logger.warn("NotchPay webhook called without a JSON body");
    return res.status(400).send("Missing body");
  }

  const event = req.body;
  const rawBody = req.rawBody || Buffer.from(JSON.stringify(req.body));

  const webhookSecret =
    NOTCH_PAY_CONFIG.webhookSecret || NOTCH_PAY_CONFIG.secretKey;

  // Fail closed: no secret configured means we cannot trust anything.
  if (!webhookSecret) {
    logger.error("NotchPay webhook secret is not configured; rejecting webhook");
    return res.status(503).send("Webhook not configured");
  }

  if (!signature) {
    logger.warn("NotchPay webhook rejected: missing signature header");
    return res.status(401).send("Missing signature");
  }

  const expectedHash = crypto
    .createHmac("sha256", webhookSecret)
    .update(rawBody)
    .digest("hex");

  if (!signatureMatches(expectedHash, signature)) {
    logger.warn("Invalid NotchPay signature");
    return res.status(401).send("Invalid signature");
  }

  logger.info(
    `NotchPay Webhook verified: ${event.event} for ref ${event.data?.reference}`,
  );

  const { reference, merchant_reference, status } = event.data || {};

  // Utiliser merchant_reference (notre référence interne) si disponible, sinon reference
  const transactionId = merchant_reference || reference;

  if (!transactionId) return res.status(400).send("Missing reference");

  const payment = await Payment.findByTransactionId(transactionId);
  if (!payment) return res.status(404).send("Payment not found");

  // Validation supplémentaire pour les paiements subscription
  if (
    payment.type === "subscription" &&
    (!payment.providerId || !payment.metadata?.plan)
  ) {
    logger.warn(`Subscription payment missing required data: ${transactionId}`);
    return res.status(400).send("Subscription payment incomplete");
  }

  // If already processed, skip
  if (payment.status === "ACCEPTED" || payment.status === "REFUSED") {
    return res.status(200).send("OK");
  }

  // Update payment
  await payment.updateFromNotchPay(event.data);

  if (payment.status === "ACCEPTED") {
    await processPaymentSuccess(payment);
  } else if (payment.status === "REFUSED") {
    await processPaymentFailure(payment, payment.errorMessage);
  }

  res.status(200).send("OK");
});

/**
 * NotchPay browser callback (read-only)
 * GET /api/payments/notchpay/webhook
 *
 * NotchPay redirects the customer's browser here after payment. The query
 * string is attacker-controllable, so this handler NEVER changes payment
 * state. It only reads the current status (authoritatively set by the signed
 * POST webhook) and redirects the browser to the frontend result page.
 */
const handleNotchPayCallback = asyncHandler(async (req, res) => {
  const reference =
    req.query.trxref || req.query.notchpay_trxref || req.query.reference;

  const frontend = getFrontendUrl();
  const base = `${frontend.replace(/\/$/, "")}/payment/callback`;

  if (!reference) {
    return res.redirect(`${base}?status=unknown`);
  }

  const payment = await Payment.findByTransactionId(reference);
  const status = payment ? payment.status : "unknown";

  // No state mutation here — the signed webhook is the source of truth.
  return res.redirect(
    `${base}?reference=${encodeURIComponent(reference)}&status=${encodeURIComponent(status)}`,
  );
});

/**
 * Process successful payment
 */
const processPaymentSuccess = async (payment) => {
  const { paymentSuccessEmail } = require("../utils/emailTemplates");
  const { activateSubscription } = require("./subscriptionController");

  // Get user for email
  const user = await User.findByPk(payment.userId);

  switch (payment.type) {
    case "featured":
      // Make provider featured
      if (payment.providerId) {
        await Provider.update(
          { isFeatured: true },
          { where: { id: payment.providerId } },
        );
        logger.info(`Provider ${payment.providerId} is now featured`);
      }
      break;

    case "boost":
      // Boost provider visibility
      if (payment.providerId) {
        await Provider.increment("viewsCount", {
          by: 100,
          where: { id: payment.providerId },
        });
        logger.info(`Provider ${payment.providerId} boosted`);
      }
      break;

    case "subscription":
      // Handle subscription activation
      if (payment.providerId && payment.metadata?.plan) {
        await activateSubscription(payment);
        logger.info(
          `Subscription activated for provider ${payment.providerId}`,
        );
      } else {
        logger.warn(
          `Cannot activate subscription - missing data for payment ${payment.transactionId}`,
        );
      }
      break;
  }

  // Audit Log
  auditLogger.paymentCompleted(payment, "ACCEPTED");

  // Send success email (optional - don't fail if email system is down)
  if (user) {
    await sendEmailSafely(
      {
        to: user.email,
        ...paymentSuccessEmail({
          firstName: user.firstName,
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          type: payment.type,
          description: payment.description,
        }),
      },
      "Payment success",
    );
  }
};

const processPaymentFailure = async (payment, errorMessage) => {
  // Send failure email (optional - don't fail if email system is down)
  const user = await User.findByPk(payment.userId);

  if (user) {
    await sendEmailSafely(
      {
        to: user.email,
        ...paymentFailedEmail({
          firstName: user.firstName,
          transactionId: payment.transactionId,
          amount: payment.amount,
          currency: payment.currency,
          errorMessage: errorMessage,
        }),
      },
      "Payment failed",
    );
  }
};

/**
 * Verify payment status
 * GET /api/payments/:transactionId/status
 */
const checkPaymentStatus = asyncHandler(async (req, res) => {
  const { transactionId } = req.params;

  const payment = await Payment.findByTransactionId(transactionId);
  if (!payment) {
    throw new AppError(req.t("payment.notFound"), 404);
  }

  // If pending, check with CinetPay
  if (payment.status === "PENDING" || payment.status === "WAITING_CUSTOMER") {
    try {
      const response = await axios.post(
        CINETPAY_CONFIG.checkUrl,
        {
          apikey: CINETPAY_CONFIG.apiKey,
          site_id: CINETPAY_CONFIG.siteId,
          transaction_id: transactionId,
        },
        {
          headers: { "Content-Type": "application/json" },
        },
      );

      if (response.data.code === "00") {
        await payment.updateFromCinetPay(response.data.data);

        if (response.data.data.status === "ACCEPTED") {
          await processPaymentSuccess(payment);
        }
      }
    } catch (error) {
      logger.error(`Error checking payment status: ${error.message}`);
    }
  }

  i18nResponse(req, res, 200, "payment.status", {
    transactionId: payment.transactionId,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    type: payment.type,
    paymentMethod: payment.paymentMethod,
    paidAt: payment.paidAt,
  });
});

/**
 * Get user's payment history
 * GET /api/payments/history
 */
const getPaymentHistory = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 10 } = req.query;
  const { limit: queryLimit, offset } = getPaginationParams(page, limit);

  const { count, rows: payments } = await Payment.findAndCountAll({
    where: { userId },
    order: [["createdAt", "DESC"]],
    limit: queryLimit,
    offset,
  });

  const pagination = getPaginationData(page, queryLimit, count);

  i18nResponse(req, res, 200, "payment.history", { payments, pagination });
});

/**
 * Admin: Get all payments
 * GET /api/admin/payments
 */
const getAllPayments = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, type } = req.query;
  const { limit: queryLimit, offset } = getPaginationParams(page, limit);
  const where = {};

  if (status) where.status = status;
  if (type) where.type = type;

  const { count, rows: payments } = await Payment.findAndCountAll({
    where,
    include: [
      {
        model: User,
        as: "user",
        attributes: ["id", "firstName", "lastName", "email"],
      },
      { model: Provider, as: "provider", attributes: ["id", "businessName"] },
    ],
    order: [["createdAt", "DESC"]],
    limit: queryLimit,
    offset,
  });

  const pagination = getPaginationData(page, queryLimit, count);

  // Calculate totals
  const totals = await Payment.findAll({
    where: { status: "ACCEPTED" },
    attributes: [
      [sequelize.fn("SUM", sequelize.col("amount")), "totalAmount"],
      [sequelize.fn("COUNT", sequelize.col("id")), "totalCount"],
    ],
    raw: true,
  });

  i18nResponse(req, res, 200, "common.list", {
    payments,
    totals: totals[0],
    pagination,
  });
});

module.exports = {
  initializePayment,
  initializeNotchPayPayment,
  handleWebhook,
  handleNotchPayWebhook,
  handleNotchPayCallback,
  checkPaymentStatus,
  getPaymentHistory,
  getAllPayments,
};
