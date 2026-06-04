const express = require("express");
const router = express.Router();
const {
  getStats,
  getPendingProviders,
  verifyProvider,
  featureProvider,
  updateUserStatus,
  getAllReviews,
  updateReviewVisibility,
  getAllUsers,
  getProvidersUnderReview,
  getFeaturedProviders,
  reviewProviderDocuments,
  deleteUser,
  toggleProviderStatus,
  getAllProvidersAdmin,
  listAdmins,
  createAdmin,
  promoteToAdmin,
  demoteAdmin,
  grantSubscription,
  getGrantHistory,
} = require("../controllers/adminController");
const {
  updateUserStatusValidation,
  verifyProviderValidation,
  featureProviderValidation,
  updateReviewVisibilityValidation,
  deleteUserValidation,
  toggleProviderStatusValidation,
  reviewProviderDocumentsValidation,
} = require("../validators/adminValidator");
const { validate } = require("../middlewares/validation");
const {
  getApplications,
  reviewApplication,
  getApplicationDetails,
} = require("../controllers/providerApplicationController");
const {
  exportUsersCSV,
  exportProvidersCSV,
  exportReviewsCSV,
  exportContactsCSV,
  exportReportPDF,
} = require("../controllers/exportController");
const { protect, restrictTo } = require("../middlewares/auth");
const { AuditLog, ApiUsage, BannedIP, SecurityLog } = require("../models");
const { asyncHandler } = require("../middlewares/errorHandler");
const { i18nResponse } = require("../utils/helpers");
const { clearIPCache } = require("../middlewares/ipBanlist");
const cache = require("../config/redis");

// All routes require admin authentication
router.use(protect);
router.use(restrictTo("admin"));

// Statistics
router.get("/stats", getStats);

// Users management
router.get("/users", getAllUsers);
router.put(
  "/users/:id/status",
  updateUserStatusValidation,
  validate,
  updateUserStatus,
);
router.delete("/users/:id", deleteUserValidation, validate, deleteUser);

// ============ PLATFORM SETTINGS ============
const {
  listSettings,
  getOneSetting,
  updateSetting,
  resetSetting,
} = require("../controllers/settingsController");

router.get("/settings", listSettings);
router.get("/settings/:key", getOneSetting);
router.put("/settings/:key", updateSetting);
router.post("/settings/:key/reset", resetSetting);

// ============ ADMIN ACCOUNTS ============
router.get("/admins", listAdmins);
router.post("/admins", createAdmin);
router.put("/admins/:id/promote", promoteToAdmin);
router.put("/admins/:id/demote", demoteAdmin);

// ============ PROVIDER APPLICATIONS ============
router.get("/provider-applications", getApplications);
router.get("/provider-applications/:id", getApplicationDetails);
router.put("/provider-applications/:id/review", reviewApplication);

// Providers management (existing providers)
router.get("/providers", getAllProvidersAdmin);
router.get("/providers/pending", getPendingProviders);
router.get("/providers/under-review", getProvidersUnderReview);
router.get("/providers/featured", getFeaturedProviders);
router.put(
  "/providers/:id/verify",
  verifyProviderValidation,
  validate,
  verifyProvider,
);
router.put(
  "/providers/:id/feature",
  featureProviderValidation,
  validate,
  featureProvider,
);
router.put(
  "/providers/:id/status",
  toggleProviderStatusValidation,
  validate,
  toggleProviderStatus,
);
router.put(
  "/providers/:id/review-documents",
  reviewProviderDocumentsValidation,
  validate,
  reviewProviderDocuments,
);

// Admin grants a free subscription period to a provider
router.post("/providers/:id/grant-subscription", grantSubscription);
router.get("/providers/:id/grant-history", getGrantHistory);

// Reviews moderation
router.get("/reviews", getAllReviews);
router.put(
  "/reviews/:id/visibility",
  updateReviewVisibilityValidation,
  validate,
  updateReviewVisibility,
);

// ============ EXPORTS ============
router.get("/export/users", exportUsersCSV);
router.get("/export/providers", exportProvidersCSV);
router.get("/export/reviews", exportReviewsCSV);
router.get("/export/contacts", exportContactsCSV);
router.get("/export/report", exportReportPDF);

// ============ AUDIT LOGS ============
router.get(
  "/audit-logs",
  asyncHandler(async (req, res) => {
    const { limit = 100, userId, entityType } = req.query;
    const where = {};
    if (userId) where.userId = userId;
    if (entityType) where.entityType = entityType;

    const logs = await AuditLog.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
      include: [
        {
          association: "user",
          attributes: ["id", "firstName", "lastName", "email"],
        },
      ],
    });
    res.json({ success: true, data: { logs } });
  }),
);

// ============ API ANALYTICS ============
router.get(
  "/analytics",
  asyncHandler(async (req, res) => {
    const stats = await ApiUsage.getOverallStats();
    const endpoints = await ApiUsage.getEndpointStats({ limit: 20 });
    res.json({ success: true, data: { stats, endpoints } });
  }),
);

router.get(
  "/analytics/hourly",
  asyncHandler(async (req, res) => {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const hourly = await ApiUsage.getHourlyBreakdown(date);
    res.json({ success: true, data: { hourly } });
  }),
);

/**
 * Daily active users — counts the distinct users who logged in successfully
 * each day over the requested window (default: last 30 days).
 *
 *   GET /api/admin/analytics/daily-active-users?days=30
 *
 * Returns: [{ day: 'YYYY-MM-DD', count: <distinct users> }, ...]
 */
router.get(
  "/analytics/daily-active-users",
  asyncHandler(async (req, res) => {
    const { fn, col, literal, Op } = require("sequelize");
    const days = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const rows = await SecurityLog.findAll({
      attributes: [
        [fn("date_trunc", "day", col("created_at")), "day"],
        [fn("COUNT", fn("DISTINCT", col("user_id"))), "count"],
      ],
      where: {
        eventType: "login_success",
        userId: { [Op.ne]: null },
        createdAt: { [Op.gte]: since },
      },
      group: [literal("day")],
      order: [[literal("day"), "ASC"]],
      raw: true,
    });

    const series = rows.map((r) => ({
      day: r.day instanceof Date ? r.day.toISOString().slice(0, 10) : String(r.day).slice(0, 10),
      count: Number(r.count),
    }));

    res.json({ success: true, data: { days, series } });
  }),
);

// ============ IP BANLIST ============
router.get(
  "/banned-ips",
  asyncHandler(async (req, res) => {
    const ips = await BannedIP.findAll({
      where: { isActive: true },
      order: [["createdAt", "DESC"]],
    });
    i18nResponse(req, res, 200, "security.bannedIPsList", { bannedIPs: ips });
  }),
);

router.post(
  "/banned-ips",
  asyncHandler(async (req, res) => {
    const { ipAddress, reason, duration } = req.body;
    await BannedIP.banIP(ipAddress, {
      reason,
      bannedBy: req.user.id,
      duration,
    });
    i18nResponse(req, res, 201, "security.ipBannedSuccess", {});
  }),
);

router.delete(
  "/banned-ips/:identifier",
  asyncHandler(async (req, res) => {
    const affectedCount = await BannedIP.unbanIP(req.params.identifier);

    if (!affectedCount) {
      return i18nResponse(req, res, 404, "common.notFound", {});
    }

    clearIPCache();
    await cache.del("banned-ips");

    i18nResponse(req, res, 200, "security.ipUnbanned", {});
  }),
);

// ============ PAYMENTS ============
const { getAllPayments } = require("../controllers/paymentController");
router.get("/payments", getAllPayments);

// ============ SECURITY LOGS ============
// SecurityLog is already imported at the top of the file.

// Get security logs with filters
router.get(
  "/security-logs",
  asyncHandler(async (req, res) => {
    const {
      limit = 100,
      eventType,
      riskLevel,
      userId,
      success,
      startDate,
      endDate,
    } = req.query;
    const { Op } = require("sequelize");
    const where = {};

    if (eventType) where.eventType = eventType;
    if (riskLevel) where.riskLevel = riskLevel;
    if (userId) where.userId = userId;
    if (success !== undefined) where.success = success === "true";

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt[Op.gte] = new Date(startDate);
      if (endDate) where.createdAt[Op.lte] = new Date(endDate);
    }

    const logs = await SecurityLog.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: parseInt(limit),
    });

    i18nResponse(req, res, 200, "security.securityLogs", { logs });
  }),
);

// Export security logs as CSV
router.get(
  "/security-logs/export",
  asyncHandler(async (req, res) => {
    const { startDate, endDate, eventType, riskLevel } = req.query;
    const { Op } = require("sequelize");
    const where = {};

    if (eventType) where.eventType = eventType;
    if (riskLevel) where.riskLevel = riskLevel;

    // Default to last 30 days
    const start = startDate
      ? new Date(startDate)
      : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    where.createdAt = { [Op.between]: [start, end] };

    const logs = await SecurityLog.findAll({
      where,
      order: [["createdAt", "DESC"]],
      limit: 10000,
    });

    // Generate CSV
    const headers = [
      "Date",
      "Event Type",
      "IP Address",
      "Email",
      "User Agent",
      "Risk Level",
      "Success",
      "Details",
    ];
    const rows = logs.map((log) => [
      log.createdAt.toISOString(),
      log.eventType,
      log.ipAddress || "",
      log.email || "",
      (log.userAgent || "").substring(0, 100),
      log.riskLevel,
      log.success ? "Yes" : "No",
      JSON.stringify(log.details || {}),
    ]);

    const csv = [
      headers.join(","),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=security_logs_${start.toISOString().split("T")[0]}_to_${end.toISOString().split("T")[0]}.csv`,
    );
    res.send(csv);
  }),
);

// Get security statistics
router.get(
  "/security-stats",
  asyncHandler(async (req, res) => {
    const { Op, fn, col, literal } = require("sequelize");
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const [hourlyFailed, dailyFailed, highRiskEvents, bannedIPsCount] =
      await Promise.all([
        SecurityLog.count({
          where: { success: false, createdAt: { [Op.gte]: oneHourAgo } },
        }),
        SecurityLog.count({
          where: { success: false, createdAt: { [Op.gte]: oneDayAgo } },
        }),
        SecurityLog.count({
          where: { riskLevel: "high", createdAt: { [Op.gte]: oneDayAgo } },
        }),
        BannedIP.count({ where: { isActive: true } }),
      ]);

    const topSuspiciousIPs = await SecurityLog.findAll({
      where: { success: false, createdAt: { [Op.gte]: oneDayAgo } },
      attributes: ["ipAddress", [fn("COUNT", col("id")), "count"]],
      group: ["ipAddress"],
      order: [[literal("count"), "DESC"]],
      limit: 10,
      raw: true,
    });

    i18nResponse(req, res, 200, "security.securityStats", {
      hourlyFailedAttempts: hourlyFailed,
      dailyFailedAttempts: dailyFailed,
      highRiskEvents24h: highRiskEvents,
      activeBannedIPs: bannedIPsCount,
      topSuspiciousIPs,
    });
  }),
);

module.exports = router;
